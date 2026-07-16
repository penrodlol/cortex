import type { DailyArticleScheduledBody } from '../scheduled/src/daily-article.scheduled';
import type { DailyYoutubeScheduledBody } from '../scheduled/src/daily-youtube.scheduled';
import { logError } from '../utils/logger';
import dailyArticleQueue from './src/daily-article.queue';
import dailyYoutubeQueue from './src/daily-youtube.queue';

export type QueueEventType = 'daily-article' | 'daily-youtube';
export const createQueueEventBody = <D extends unknown, T extends QueueEventType>(type: T, data: D) => ({ type, data });

export const QUEUE_HANDLER_NO_HANDLER_ERROR = 'No Handler for Queue Event';
export const QUEUE_HANDLER_ERROR = 'Error Processing Queue';

const handler: ExportedHandler<Env, ReturnType<typeof createQueueEventBody>>['queue'] = async (batch, env) => {
  try {
    await Promise.all(
      batch.messages.map((message) => {
        switch (message.body.type) {
          case 'daily-article':
            return dailyArticleQueue(env, message.body.data as DailyArticleScheduledBody);
          case 'daily-youtube':
            return dailyYoutubeQueue(env, message.body.data as DailyYoutubeScheduledBody);
          default:
            throw new Error(`${QUEUE_HANDLER_NO_HANDLER_ERROR}: ${message.body.type}`);
        }
      }),
    );
  } catch (error) {
    logError(QUEUE_HANDLER_ERROR, { error, batch });
  }
};

export default handler;
