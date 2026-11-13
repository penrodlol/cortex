import { setResponseHeader } from '@tanstack/react-start/server';
import { cache, env } from 'cloudflare:workers';
import { executeWithRetry } from './function';
import { logError } from './logger';

export const CACHE_PURGE_ERROR = 'Error Purging Cache';

export function withCacheControl(response: Response) {
  if (response.headers.has('Cache-Control')) return response;
  const headers = new Headers(response.headers);
  headers.set('Cache-Control', env.CLOUDFLARE_DEFAULT_CACHE_CONTROL);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

export function setCacheHeaders() {
  setResponseHeader('Cache-Control', env.CLOUDFLARE_CACHE_CONTROL);
  setResponseHeader('Cloudflare-CDN-Cache-Control', env.CLOUDFLARE_CDN_CACHE_CONTROL);
}

export async function purgeCache() {
  const response = await executeWithRetry(async () => {
    const purge = await cache.purge({ purgeEverything: true });
    if (!purge.success) throw new Error(CACHE_PURGE_ERROR, { cause: purge.errors });
    return purge;
  });
  if (!response.success) logError(CACHE_PURGE_ERROR, response.error);
}
