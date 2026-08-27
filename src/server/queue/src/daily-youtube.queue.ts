import db, { youtubeVideo, type YoutubeVideo } from '#/db';
import supadata from '#/libs/supadata';
import type { TranscriptOrJobId } from '@supadata/js';
import { z } from 'zod';
import type { DailyYoutubeScheduledBody } from '../../scheduled/src/daily-youtube.scheduled';
import { executeWithRetry } from '../../utils/function';
import { logError, logInfo } from '../../utils/logger';
import { summarize } from '../../utils/prompt';
import { sleep } from '../../utils/sleep';

export const DAILY_YOUTUBE_QUEUE_INVALID_REPING_LIMIT_ERROR = 'Invalid Reping Limit';
export const DAILY_YOUTUBE_QUEUE_INVALID_REPING_DELAY_ERROR = 'Invalid Reping Delay';
export const DAILY_YOUTUBE_QUEUE_NO_JOB_ID_ERROR = 'No Job ID Found';
export const DAILY_YOUTUBE_QUEUE_COMPLETED_WITH_EMPTY_CONTENT_ERROR = 'Completed With Empty Content';
export const DAILY_YOUTUBE_QUEUE_TRANSCRIPT_POLLING_FAILED_ERROR = 'Transcript Polling Failed';
export const DAILY_YOUTUBE_QUEUE_MAX_REPING_LIMIT_REACHED_ERROR = 'Max Reping Limit Reached';
export const DAILY_YOUTUBE_QUEUE_ERROR = 'Daily Youtube Queue Error';
export const DAILY_YOUTUBE_QUEUE_COMPLETED = 'Daily Youtube Queue Completed';

const handler = async (env: Env, body: DailyYoutubeScheduledBody) => {
  const repingLimit = z.coerce.number().int().nonnegative().safeParse(env.CLOUDFLARE_DAILY_QUEUE_REPING_LIMIT);
  if (!repingLimit.success) throw new Error(DAILY_YOUTUBE_QUEUE_INVALID_REPING_LIMIT_ERROR, { cause: z.prettifyError(repingLimit.error) });

  const successful: Array<Omit<YoutubeVideo, 'id' | 'createdAt'>> = [];
  const failed: Array<Partial<YoutubeVideo> & { error: unknown }> = [];

  for (const item of body.items) {
    if (!item.snippet?.resourceId?.videoId || !item.snippet?.title || !item.snippet?.publishedAt || !item.snippet?.thumbnails?.high?.url)
      continue;

    const youtubeVideoId = item.snippet.resourceId.videoId;
    const youtubeVideoUrl = `https://www.youtube.com/watch?v=${youtubeVideoId}`;
    const youtubeVideoTranscript = await executeWithRetry(async () => {
      await sleep();
      return supadata.transcript({ url: youtubeVideoUrl, lang: 'en', text: true, mode: 'native' });
    });
    if (!youtubeVideoTranscript.success) {
      failed.push({ videoId: youtubeVideoId, title: item.snippet.title, error: youtubeVideoTranscript.error });
      continue;
    }

    const youtubeTranscriptPolledRequest = await getYoutubeTranscriptPolled(youtubeVideoTranscript.data, repingLimit.data);
    if (!youtubeTranscriptPolledRequest.success) {
      failed.push({ videoId: youtubeVideoId, title: item.snippet.title, error: youtubeTranscriptPolledRequest.error });
      continue;
    }

    const youtubeTranscriptSummary = await executeWithRetry(async () => {
      await sleep();
      return summarize(env, 'daily_youtube_queue_ai_response', youtubeTranscriptPolledRequest.data);
    });
    if (!youtubeTranscriptSummary.success) {
      failed.push({ videoId: youtubeVideoId, title: item.snippet.title, error: youtubeTranscriptSummary.error });
      continue;
    }

    successful.push({
      videoId: youtubeVideoId,
      title: item.snippet.title,
      thumbnailUrl: item.snippet.thumbnails.high.url,
      summary: youtubeTranscriptSummary.data,
      pubDate: new Date(item.snippet.publishedAt).getTime(),
      youtubeChannelId: body.id,
    });
  }

  if (successful.length) {
    const youtubeVideos = await executeWithRetry(() => db.insert(youtubeVideo).values(successful).onConflictDoNothing());
    if (!youtubeVideos.success) logError(DAILY_YOUTUBE_QUEUE_ERROR, youtubeVideos.error);
  }
  if (failed.length) logError(DAILY_YOUTUBE_QUEUE_ERROR, { failed });

  logInfo(DAILY_YOUTUBE_QUEUE_COMPLETED, { successful: successful.length, failed: failed.length });
};

async function getYoutubeTranscriptPolled(request: TranscriptOrJobId, repingLimit: number, reping = 0) {
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
      await sleep();
      return getYoutubeTranscriptPolled(request, repingLimit, reping + 1);
    }
  }
}

export default handler;
