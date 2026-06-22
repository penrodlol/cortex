import { z } from 'zod';
import { logError } from '../utils/logger';
import dailyArticleScheduled from './src/daily-article.scheduled';
import dailyYoutubeScheduled from './src/daily-youtube.scheduled';

export const SCHEDULED_HANDLER_PUBLISHED_DAYS_LIMIT_ERROR = 'Invalid Published Days Limit';
export const SCHEDULED_HANDLER_ERROR = 'Error Processing Scheduled';
export const SCHEDULED_HANDLER_NO_HANDLER = 'No Handler for Scheduled';

const scheduled: ExportedHandler<Env>['scheduled'] = async (event, env) => {
  try {
    const daysAgo = z.coerce
      .number()
      .int()
      .positive()
      .transform((value) => Math.floor(Date.now() / 1000) - value * 24 * 60 * 60)
      .safeParse(env.CLOUDFLARE_DAILY_SCHEDULED_PUBLISHED_DAYS_LIMIT);
    if (!daysAgo.success) {
      logError(SCHEDULED_HANDLER_PUBLISHED_DAYS_LIMIT_ERROR, z.prettifyError(daysAgo.error));
      return;
    }

    switch (event.cron) {
      case '0 5 * * *': {
        await Promise.all([dailyArticleScheduled(env, daysAgo.data), dailyYoutubeScheduled(env, daysAgo.data)]);
        break;
      }
      default:
        throw new Error(`${SCHEDULED_HANDLER_NO_HANDLER}: ${event.cron}`);
    }
  } catch (error) {
    logError(SCHEDULED_HANDLER_ERROR, { error, event });
  }
};

export default scheduled;
