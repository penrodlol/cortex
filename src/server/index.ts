import fetch from './fetch';
import queue, { createQueueEventBody } from './queue';
import scheduled from './scheduled';

export default { fetch, scheduled, queue } satisfies ExportedHandler<Env, ReturnType<typeof createQueueEventBody>>;
