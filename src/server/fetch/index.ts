import tanstack from '@tanstack/react-start/server-entry';
import { withCacheControl } from '../utils/cache';
import { logError } from '../utils/logger';
import bot from './src/bot';

export const FETCH_ERROR = 'Error Processing Fetch';

const handler: ExportedHandler<Env>['fetch'] = async (request, env) => {
  try {
    switch (new URL(request.url).pathname) {
      case '/.well-known/http-message-signatures-directory':
        return bot(request, env);
      default:
        return withCacheControl(await tanstack.fetch(request));
    }
  } catch (error) {
    logError(FETCH_ERROR, { error, request });
    return new Response(FETCH_ERROR, { status: 500 });
  }
};

export default handler;
