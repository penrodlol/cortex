import { z } from 'zod';

export type GenerateSummaryAudioPromptContent<T = { id: string; title: string; summary: string }> = {
  articles: Record<string, Array<T>>;
  youtubeVideos: Record<string, Array<T>>;
};

export async function generateSummaryAudioPrompt(env: Env, name: string, content: GenerateSummaryAudioPromptContent) {
  const schema = z.preprocess(
    (value) => {
      const parsed = typeof value === 'string' ? parseSummaryAudioJson(value) : value;
      return Array.isArray(parsed) ? parsed[0] : parsed;
    },
    z.object({
      articles: z.array(z.object({ publisher: z.string().min(1), summary: z.string().min(1) })).default([]),
      youtubeVideos: z.array(z.object({ publisher: z.string().min(1), summary: z.string().min(1) })).default([]),
    }),
  );

  const aiRunResponse = await env.AI.run(env.CLOUDFLARE_AI_MODEL, {
    messages: [{ role: 'user', content: `${prompt}\n\n${JSON.stringify(content)}` }],
    response_format: { type: 'json_schema', json_schema: { ...z.toJSONSchema(schema), name, strict: true } },
  });
  const aiRunResponseText = (aiRunResponse as ChatCompletionsOutput)?.choices?.[0]?.message?.content;
  const aiRunResponseJson = schema.safeParse(parseSummaryAudioJson(aiRunResponseText ?? '{}'));
  if (!aiRunResponseJson.success) throw new Error(z.prettifyError(aiRunResponseJson.error));
  return aiRunResponseJson.data;
}

function parseSummaryAudioJson(text: string) {
  try {
    return JSON.parse(
      text
        .trim()
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/, ''),
    );
  } catch {
    return text;
  }
}

const prompt = `
  You are writing the spoken segments of a daily audio news briefing. Every segment will be sent directly to the ElevenLabs Eleven v4 text-to-speech model, so every character you output is either spoken aloud or treated as a delivery instruction.

  ## Input

  The input is a JSON object with this exact structure:

  {
    "articles": {
      "<publisher name>": [
        {
          "id": string,       // internal identifier, never read aloud
          "title": string,    // article title
          "summary": string   // one paragraph summary of the article
        }
      ]
    },
    "youtubeVideos": {
      "<channel name>": [
        {
          "id": string,       // internal identifier, never read aloud
          "title": string,    // video title
          "summary": string   // one paragraph summary of the video
        }
      ]
    }
  }

  - "articles" and "youtubeVideos" are objects keyed by publisher or channel name. The key is the name to announce.
  - Each key maps to an array of one or more items from that publisher or channel.
  - Either top-level object may be empty.

  ## Output structure

  Return a JSON object that mirrors the input:

  {
    "articles": [
      {
        "publisher": string,  // spoken publisher announcement
        "summary": string     // one spoken paragraph covering all of the publisher's articles
      }
    ],
    "youtubeVideos": [
      {
        "publisher": string,  // spoken channel announcement
        "summary": string     // one spoken paragraph covering all of the channel's videos
      }
    ]
  }

  - Add exactly one entry to "articles" for each publisher key in the input "articles", in the same order.
  - Add exactly one entry to "youtubeVideos" for each channel key in the input "youtubeVideos", in the same order.
  - If an input object is empty, return an empty array for it.
  - "publisher" is the spoken announcement:
    - For articles: "From <publisher name>."
    - For YouTube videos: "From the <channel name> channel."
  - "summary" is a single, concise paragraph that consolidates all of that publisher's or channel's items into one short spoken briefing.
  - Do not add section announcements, a greeting, an introduction, an outro, transitions between publishers, or any other commentary. Section headings and the pauses between segments are added separately.

  ## Summary content rules

  - The goal is an informative but efficient listen. Give each item roughly two to three sentences, and keep each publisher's paragraph to no more than about two hundred words in total, no matter how many items there are.
  - Cover the key point of every item. Do not read titles verbatim or announce each item separately; weave them into flowing prose, for example "Vercel shipped stable Turbopack builds in Next.js sixteen, and also announced...".
  - When several items share a theme, group them into a single sentence instead of describing each one at length.
  - For each item, explain what happened and why it matters, and keep the most useful specifics such as names, numbers, and concrete changes. Drop only filler, repetition, and minor tangents.
  - Only use facts present in the input. Do not invent, speculate, or editorialize.
  - Never read out ids, URLs, or JSON keys.

  ## Eleven v4 delivery rules

  - Eleven v4 does NOT support SSML. Never output <break>, <phoneme>, or any other XML or SSML tags.
  - Do not use any audio tags, including [pause], [long pause], emotion, reaction, or sound-effect tags such as [laughs], [sighs], [applause], or [music]. Pauses are added separately. Use normal punctuation for pacing.
  - Do not write words in ALL CAPS for emphasis; capital letters cause the model to stress words. Only keep capitals for acronyms that are normally written that way.
  - Avoid parentheses, em dashes, semicolons, and quotation marks.

  ## Text normalization rules

  Write everything, including titles and publisher names, exactly as it should be spoken:
  - Numbers: "1,200" becomes "twelve hundred", "3.5" becomes "three point five"
  - Versions: "v2.1.0" becomes "version two point one point zero"
  - Percentages, currency, and units: "45%" becomes "forty-five percent", "$20M" becomes "twenty million dollars", "100ms" becomes "one hundred milliseconds", "16GB" becomes "sixteen gigabytes"
  - Dates and years: always fully spoken, for example "March third, twenty twenty-five", never numeric formats
  - Symbols: "&" becomes "and", "+" becomes "plus", "->" becomes "to", "/" becomes "or" or "slash" depending on context
  - Abbreviations: "e.g." becomes "for example", "i.e." becomes "that is", "vs." becomes "versus", "etc." becomes "and so on"
  - Code, file names, and identifiers: say them naturally, for example "package.json" becomes "package dot JSON", "useEffect" becomes "use effect", "node_modules" becomes "node modules"
  - Domains: "elevenlabs.io" becomes "eleven labs dot I O", "dev.to" becomes "dev dot to"

  ## Example output

  {
    "articles": [
      {
        "publisher": "From Vercel.",
        "summary": "Next.js sixteen ships with stable Turbopack builds, cutting production build times by up to five times. Vercel also introduced <spoken summary of the next item>, and <spoken summary of the next item>."
      }
    ],
    "youtubeVideos": [
      {
        "publisher": "From the Fireship channel.",
        "summary": "<one concise spoken paragraph covering every video>"
      }
    ]
  }

  ## Input JSON
  `;
