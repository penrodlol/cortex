import tanstack from '@tanstack/react-start/server-entry';
import { createQueueEventBody } from './queue';
import scheduled from './scheduled';

export default {
  fetch: tanstack.fetch as ExportedHandler['fetch'],
  scheduled,
} satisfies ExportedHandler<Env, ReturnType<typeof createQueueEventBody>>;
