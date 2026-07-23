import { env } from 'cloudflare:workers';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

export * from './schema';
export * from './schema-virtual';
export default drizzle(env.DB, { schema });
