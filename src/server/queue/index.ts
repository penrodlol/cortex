import type { DailyScheduledBody } from '@/server/scheduled/src/daily.scheduled';
import dailyQueue from './src/daily.queue';

export type QueueEventType = 'daily';
export const createQueueEventBody = <D extends unknown, T extends QueueEventType>(type: T, data: D) => ({ type, data });

export const QUEUE_HANDLER_ERROR = 'Error Processing Queue';

const queue: ExportedHandler<Env, ReturnType<typeof createQueueEventBody>>['queue'] = async (batch, env) => {
  try {
    await Promise.all(
      batch.messages.map((message) => {
        switch (message.body.type) {
          case 'daily':
            return dailyQueue(env, message.body.data as DailyScheduledBody);
          default:
            throw new Error(`No handler for queue event type: ${message.body.type}`);
        }
      }),
    );
  } catch (error) {
    console.error({ message: QUEUE_HANDLER_ERROR, data: { error, batch } });
  }
};

export default queue;
