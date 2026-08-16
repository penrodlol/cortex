import { Client, type ClientConfig, OAuth1 } from '@xdevplatform/xdk';
import { env } from 'cloudflare:workers';

export default new Client({
  oauth1: new OAuth1({
    accessToken: env.X_ACCESS_TOKEN,
    accessTokenSecret: env.X_ACCESS_TOKEN_SECRET,
    apiKey: env.X_API_KEY,
    apiSecret: env.X_API_SECRET_KEY,
    callback: '',
  }),
} satisfies ClientConfig);
