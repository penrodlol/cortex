import handler from '@tanstack/react-start/server-entry';

export default {
  fetch: handler.fetch,
  async scheduled(event: ScheduledEvent, _env: Env, _ctx: ExecutionContext): Promise<void> {
    console.log('Cron triggered:', event.cron);
  },
};
