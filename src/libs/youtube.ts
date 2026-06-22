import { youtube } from '@googleapis/youtube';
import { env } from 'cloudflare:workers';

export default youtube({ auth: env.YOUTUBE_API_KEY, version: 'v3', fetchImplementation: fetch });
