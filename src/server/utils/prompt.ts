import { z } from 'zod';
import { logError } from './logger';

export const PROMPT_SUMMARIZE_ERROR = 'Prompt AI Summarization Failed';

export async function summarize(env: Env, name: string, content: string, retryLimit: number) {
  const prompt = `
  Summarize the content.
  
  Summary requirements:
  - Write exactly one paragraph.
  - Begin immediately with the central claim, finding, announcement, or technical takeaway.
  - Write naturally, as if written by an experienced engineer.
  - Avoid generic introductions such as "This article", "This blog post", or "This guide".
  - Focus on the most important information and omit minor details.
  
  Content:
  ${content}
  `;

  const schema = z.preprocess(
    (value) => {
      if (typeof value === 'string') return { summary: value };
      if (Array.isArray(value)) return { summary: typeof value[0] === 'string' ? value[0] : value[0]?.summary };
      return value;
    },
    z.object({ summary: z.string().min(1) }),
  );

  let retry = 0;

  while (retry < retryLimit) {
    try {
      const aiRunResponse = await env.AI.run(env.CLOUDFLARE_AI_MODEL, {
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_schema', json_schema: { ...z.toJSONSchema(schema), name, strict: true } },
      });
      const aiRunResponseText = (aiRunResponse as ChatCompletionsOutput)?.choices?.[0]?.message?.content;
      const aiRunResponseJson = schema.safeParse(JSON.parse(aiRunResponseText ?? '{}'));
      if (!aiRunResponseJson.success) {
        logError(PROMPT_SUMMARIZE_ERROR, z.prettifyError(aiRunResponseJson.error));
        retry++;
        continue;
      }
      return aiRunResponseJson.data.summary;
    } catch (error) {
      logError(PROMPT_SUMMARIZE_ERROR, { name, error });
      retry++;
    }
  }
}
