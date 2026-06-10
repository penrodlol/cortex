import { logError } from '../utils/logger';
import dailyScheduled from './src/daily.scheduled';

export const SCHEDULED_HANDLER_ERROR = 'Error Processing Scheduled';
export const SCHEDULED_HANDLER_NO_HANDLER = 'No Handler for Scheduled';

const scheduled: ExportedHandler<Env>['scheduled'] = async (event, env) => {
  try {
    switch (event.cron) {
      case '0 5 * * *':
        return dailyScheduled(env);
      default:
        throw new Error(`${SCHEDULED_HANDLER_NO_HANDLER}: ${event.cron}`);
    }
  } catch (error) {
    logError(SCHEDULED_HANDLER_ERROR, { error, event });
  }
};

export default scheduled;
