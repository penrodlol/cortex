import tanstack from '@tanstack/react-start/server-entry';
import queue, { createQueueEventBody } from './queue';
import scheduled from './scheduled';

export default {
  fetch: tanstack.fetch as ExportedHandler['fetch'],
  scheduled,
  queue,
} satisfies ExportedHandler<Env, ReturnType<typeof createQueueEventBody>>;
