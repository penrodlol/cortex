import { Supadata } from '@supadata/js';
import { env } from 'cloudflare:workers';

export default new Supadata({ apiKey: env.SUPADATA_API_KEY });
