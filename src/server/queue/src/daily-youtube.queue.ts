import db, { youtubeVideo, type YoutubeVideo } from '@/db';
import supadata from '@/libs/supadata';
import type { TranscriptOrJobId } from '@supadata/js';
import { z } from 'zod';
import type { DailyYoutubeScheduledBody } from '../../scheduled/src/daily-youtube.scheduled';
import { logError } from '../../utils/logger';
import { summarize } from '../../utils/prompt';

export const DAILY_YOUTUBE_QUEUE_INVALID_REPING_LIMIT_ERROR = 'Invalid Reping Limit';
export const DAILY_YOUTUBE_QUEUE_INVALID_REPING_DELAY_ERROR = 'Invalid Reping Delay';
export const DAILY_YOUTUBE_QUEUE_NO_JOB_ID_ERROR = 'No Job ID Found';
export const DAILY_YOUTUBE_QUEUE_COMPLETED_WITH_EMPTY_CONTENT_ERROR = 'Completed With Empty Content';
export const DAILY_YOUTUBE_QUEUE_TRANSCRIPT_POLLING_FAILED_ERROR = 'Transcript Polling Failed';
export const DAILY_YOUTUBE_QUEUE_MAX_REPING_LIMIT_REACHED_ERROR = 'Max Reping Limit Reached';
export const DAILY_YOUTUBE_QUEUE_TRANSCRIPT_RETRIEVAL_FAILED_ERROR = 'Transcript Retrieval Failed';

const handler = async (env: Env, body: DailyYoutubeScheduledBody, retryLimit: number) => {
  const repingLimit = z.coerce.number().int().nonnegative().safeParse(env.CLOUDFLARE_DAILY_QUEUE_REPING_LIMIT);
  if (!repingLimit.success) return logError(DAILY_YOUTUBE_QUEUE_INVALID_REPING_LIMIT_ERROR, z.prettifyError(repingLimit.error));

  const repingDelay = z.coerce.number().int().nonnegative().safeParse(env.CLOUDFLARE_DAILY_QUEUE_REPING_DELAY);
  if (!repingDelay.success) return logError(DAILY_YOUTUBE_QUEUE_INVALID_REPING_DELAY_ERROR, z.prettifyError(repingDelay.error));

  const success: Array<Omit<YoutubeVideo, 'id' | 'createdAt'>> = [];

  for (const item of body.items) {
    if (!item.id?.videoId || !item.snippet?.title || !item.snippet?.publishedAt || !item.snippet?.thumbnails?.high?.url) continue;

    const youtubeUrl = `https://www.youtube.com/watch?v=${item.id.videoId}`;
    const youtubeTranscript = await getYoutubeTranscript(youtubeUrl, retryLimit, repingLimit.data, repingDelay.data);
    if (!youtubeTranscript) continue;
    const youtubeTranscriptSummary = await summarize(env, 'daily_youtube_queue_ai_response', youtubeTranscript, retryLimit);
    if (!youtubeTranscriptSummary) continue;

    success.push({
      title: item.snippet.title,
      url: youtubeUrl,
      thumbnailUrl: item.snippet.thumbnails.high.url,
      summary: youtubeTranscriptSummary,
      pubDate: Math.floor(new Date(item.snippet.publishedAt).getTime() / 1000),
      youtubeChannelId: body.id,
    });
  }

  if (success.length) await db.insert(youtubeVideo).values(success).onConflictDoNothing();
};

async function getYoutubeTranscript(youtubeUrl: string, retryLimit: number, repingLimit: number, repingDelay: number) {
  let retry = 0;
  while (retry < retryLimit) {
    try {
      const youtubeTranscriptRequest = await supadata.transcript({ url: youtubeUrl, lang: 'en', text: true, mode: 'auto' });
      const youtubeTranscriptPolledRequest = await getYoutubeTranscriptPolled(youtubeTranscriptRequest, repingLimit, repingDelay);
      if (!youtubeTranscriptPolledRequest.success) {
        logError(youtubeTranscriptPolledRequest.error, { youtubeUrl, youtubeTranscriptRequest });
        retry++;
        continue;
      }
      return youtubeTranscriptPolledRequest.data;
    } catch (error) {
      logError(DAILY_YOUTUBE_QUEUE_TRANSCRIPT_RETRIEVAL_FAILED_ERROR, { youtubeUrl, error });
      retry++;
    }
  }
}

async function getYoutubeTranscriptPolled(request: TranscriptOrJobId, repingLimit: number, repingDelay: number, reping = 0) {
  if (!('jobId' in request))
    return request.content
      ? ({ success: true, data: String(request.content) } as const)
      : ({ success: false, error: DAILY_YOUTUBE_QUEUE_NO_JOB_ID_ERROR } as const);

  const youtubeTranscriptRequest = await supadata.transcript.getJobStatus(request.jobId);
  switch (youtubeTranscriptRequest.status) {
    case 'completed':
      return youtubeTranscriptRequest.result?.content
        ? ({ success: true, data: String(youtubeTranscriptRequest.result.content) } as const)
        : ({ success: false, error: DAILY_YOUTUBE_QUEUE_COMPLETED_WITH_EMPTY_CONTENT_ERROR } as const);
    case 'failed':
      return { success: false, error: DAILY_YOUTUBE_QUEUE_TRANSCRIPT_POLLING_FAILED_ERROR } as const;
    default: {
      if (reping >= repingLimit) return { success: false, error: DAILY_YOUTUBE_QUEUE_MAX_REPING_LIMIT_REACHED_ERROR } as const;
      await new Promise((resolve) => setTimeout(resolve, repingDelay));
      return getYoutubeTranscriptPolled(request, repingLimit, repingDelay, reping + 1);
    }
  }
}

export default handler;
