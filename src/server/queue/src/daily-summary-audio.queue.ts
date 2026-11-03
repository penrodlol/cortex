import db, { article, summaryAudio, youtubeVideo } from '#/db';
import { inArray } from 'drizzle-orm';
import type { DailySummaryAudioScheduledBody } from '../../scheduled/src/daily-summary-audio.scheduled';
import { executeWithRetry } from '../../utils/function';
import { logInfo } from '../../utils/logger';
import { generateSummaryAudioPrompt } from '../../utils/prompts';
import { sound, speech, textToSpeech, type SpeechSegments } from '../../utils/speech';

export const DAILY_SUMMARY_AUDIO_QUEUE_FAILED_PROMPT_CREATION_ERROR = 'Failed To Create Summary Audio Prompt';
export const DAILY_SUMMARY_AUDIO_QUEUE_SEGMENT_TOO_LONG_ERROR = 'Failed To Segment Summary Audio As Chunk Is Too Long';
export const DAILY_SUMMARY_AUDIO_QUEUE_FAILED_AUDIO_UPLOAD_ERROR = 'Failed To Upload Summary Audio';
export const DAILY_SUMMARY_AUDIO_QUEUE_FAILED_DB_PERSIST_ERROR = 'Failed To Persist To Database';
export const DAILY_SUMMARY_AUDIO_QUEUE_COMPLETED = 'Daily Summary Audio Queue Completed';

const handler = async (env: Env, body: DailySummaryAudioScheduledBody) => {
  const prompt = await executeWithRetry(() => generateSummaryAudioPrompt(env, 'daily_summary_audio_queue_ai_response', body.items));
  if (!prompt.success) throw new Error(DAILY_SUMMARY_AUDIO_QUEUE_FAILED_PROMPT_CREATION_ERROR, { cause: prompt.error });

  const segmentedPromps = getSegmentedPrompts(env, prompt.data);
  if (segmentedPromps.length === 0) return;

  const textToSpeechResponse = await textToSpeech(env, segmentedPromps);
  if (textToSpeechResponse.length === 0) return;

  const summaryAudioId = crypto.randomUUID();
  const summaryAudioKey = `summary-audio/${summaryAudioId}.mp3`;
  const summaryAudioUpload = await executeWithRetry(() =>
    env.R2.put(summaryAudioKey, textToSpeechResponse, { httpMetadata: { contentType: 'audio/mpeg' } }),
  );
  if (!summaryAudioUpload.success)
    throw new Error(DAILY_SUMMARY_AUDIO_QUEUE_FAILED_AUDIO_UPLOAD_ERROR, { cause: summaryAudioUpload.error });

  const persistResult = await persist(env, summaryAudioId, summaryAudioKey, body.items);
  if (!persistResult.success) throw new Error(DAILY_SUMMARY_AUDIO_QUEUE_FAILED_DB_PERSIST_ERROR, { cause: persistResult.error });

  logInfo(DAILY_SUMMARY_AUDIO_QUEUE_COMPLETED, {
    successful: Object.values(body.items.articles).flat().length + Object.values(body.items.youtubeVideos).flat().length,
  });
};

function getSegmentedPrompts(env: Env, prompt: Awaited<ReturnType<typeof generateSummaryAudioPrompt>>) {
  const chapters = [
    { title: 'Articles', publishers: prompt.articles },
    { title: 'YouTube videos', publishers: prompt.youtubeVideos },
  ]
    .filter((chapter) => chapter.publishers.length > 0)
    .flatMap((chapter) => [
      speech(`${chapter.title}.`),
      ...chapter.publishers.flatMap(({ publisher, summary }) => [
        speech(publisher),
        speech(`${summary} [pause]`),
        sound(env.ELEVENLABS_TRANSITION_SOUND_KEY),
      ]),
    ]);
  if (chapters.length === 0) return [];

  return [
    sound(env.ELEVENLABS_INTRO_OUTRO_SOUND_KEY),
    speech('Cortex Digital Archive. [pause]'),
    speech(
      `Today is ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}. [pause]`,
    ),
    speech("Here are today's technical briefings."),
    ...chapters,
    speech("That's all for today's briefing. [pause]"),
    speech('This has been Cortex Digital Archive.'),
    sound(env.ELEVENLABS_INTRO_OUTRO_SOUND_KEY),
  ].reduce<SpeechSegments>((chunks, segment) => {
    if (segment.type === 'sound') return [...chunks, segment];
    if (segment.text.length > 10_000) throw new Error(DAILY_SUMMARY_AUDIO_QUEUE_SEGMENT_TOO_LONG_ERROR, { cause: segment.text });

    const last = chunks.at(-1);
    if (last?.type === 'speech' && last.text.length + segment.text.length + 1 <= 10_000)
      return [...chunks.slice(0, -1), speech(`${last.text}\n${segment.text}`)];

    return [...chunks, segment];
  }, []);
}

async function persist(env: Env, summaryAudioId: string, summaryAudioKey: string, items: DailySummaryAudioScheduledBody['items']) {
  const articleIds = Object.values(items.articles).flatMap((entries) => entries.map(({ id }) => id));
  const youtubeVideoIds = Object.values(items.youtubeVideos).flatMap((entries) => entries.map(({ id }) => id));
  const articleIdsBatched = Array.from({ length: Math.ceil(articleIds.length / 10) }, (_, i) => articleIds.slice(i * 10, (i + 1) * 10));
  const youtubeVideoIdsBatched = Array.from({ length: Math.ceil(youtubeVideoIds.length / 10) }, (_, i) =>
    youtubeVideoIds.slice(i * 10, (i + 1) * 10),
  );

  const result = await executeWithRetry(() =>
    db.batch([
      db.insert(summaryAudio).values({ id: summaryAudioId, audioUrl: new URL(summaryAudioKey, env.CLOUDFLARE_R2_URL).toString() }),
      ...articleIdsBatched.map((ids) => db.update(article).set({ summaryAudioId }).where(inArray(article.id, ids))),
      ...youtubeVideoIdsBatched.map((ids) => db.update(youtubeVideo).set({ summaryAudioId }).where(inArray(youtubeVideo.id, ids))),
    ]),
  );
  if (!result.success) {
    await executeWithRetry(() => env.R2.delete(summaryAudioKey));
    return { success: false, error: result.error } as const;
  }

  return { success: true } as const;
}

export default handler;
