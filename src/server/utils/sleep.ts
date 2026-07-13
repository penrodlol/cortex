import { env } from 'cloudflare:workers';
import { z } from 'zod';

export const INVALID_SLEEP_LIMIT_ERROR = 'Invalid Sleep Limit';

export function sleep(ms?: number): Promise<void> {
  const sleepLimit = z.coerce.number().int().nonnegative().safeParse(env.CLOUDFLARE_DAILY_SLEEP_LIMIT);
  if (!sleepLimit.success) throw new Error(`${INVALID_SLEEP_LIMIT_ERROR}: ${z.prettifyError(sleepLimit.error)}`);
  return new Promise((resolve) => setTimeout(resolve, ms ?? sleepLimit.data));
}
