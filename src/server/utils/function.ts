import { env } from 'cloudflare:workers';
import { z } from 'zod';
import { sleep } from './sleep';

export type ExecuteWithRetryResult<T> = { success: true; data: T } | { success: false; error: unknown };

export const INVALID_RETRY_LIMIT_ERROR = 'Invalid Retry Limit';
export const RETRY_LIMIT_EXCEEDED_ERROR = 'Retry limit exceeded';

export async function executeWithRetry<T>(fn: () => Promise<T>): Promise<ExecuteWithRetryResult<T>> {
  const retryLimit = z.coerce.number().int().nonnegative().safeParse(env.CLOUDFLARE_DAILY_RETRY_LIMIT);
  if (!retryLimit.success)
    return { success: false, error: new Error(`${INVALID_RETRY_LIMIT_ERROR}: ${z.prettifyError(retryLimit.error)}`) };

  let retry = 0;

  while (retry < retryLimit.data) {
    try {
      const data = await fn();
      return { success: true, data };
    } catch (error) {
      retry++;
      await sleep();
      if (retry >= retryLimit.data) return { success: false, error };
    }
  }

  return { success: false, error: new Error(RETRY_LIMIT_EXCEEDED_ERROR) };
}
