import { z } from 'zod';
import type { DailyArticleScheduledBody } from '../scheduled/src/daily-article.scheduled';
import type { DailyYoutubeScheduledBody } from '../scheduled/src/daily-youtube.scheduled';
import { logError } from '../utils/logger';
import dailyArticleQueue from './src/daily-article.queue';
import dailyYoutubeQueue from './src/daily-youtube.queue';

export type QueueEventType = 'daily-article' | 'daily-youtube';
export const createQueueEventBody = <D extends unknown, T extends QueueEventType>(type: T, data: D) => ({ type, data });

export const QUEUE_HANDLER_ERROR = 'Error Processing Queue';
export const QUEUE_HANDLER_INVALID_RETRY_LIMIT_ERROR = 'Invalid Retry Limit';

const queue: ExportedHandler<Env, ReturnType<typeof createQueueEventBody>>['queue'] = async (batch, env) => {
  try {
    const retryLimit = z.coerce.number().int().nonnegative().safeParse(env.CLOUDFLARE_DAILY_QUEUE_RETRY_LIMIT);
    if (!retryLimit.success) {
      logError(QUEUE_HANDLER_INVALID_RETRY_LIMIT_ERROR, z.prettifyError(retryLimit.error));
      return;
    }

    await Promise.all(
      batch.messages.map((message) => {
        switch (message.body.type) {
          case 'daily-article':
            return dailyArticleQueue(env, message.body.data as DailyArticleScheduledBody, retryLimit.data);
          case 'daily-youtube':
            return dailyYoutubeQueue(env, message.body.data as DailyYoutubeScheduledBody, retryLimit.data);
          default:
            throw new Error(`No handler for queue event type: ${message.body.type}`);
        }
      }),
    );
  } catch (error) {
    logError(QUEUE_HANDLER_ERROR, { error, batch });
  }
};

export default queue;
