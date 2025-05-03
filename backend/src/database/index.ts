import * as schema from './schema';
import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { config } from '../config';
const pool = new Pool({ connectionString: config.DATABASE_URL_NEW });
export const db = drizzle({ client: pool, schema: schema, logger: false });

// for local
// import { drizzle } from 'drizzle-orm/postgres-js/driver';
// export const db = drizzle(config.DATABASE_URL_NEW as string, { schema: schema, logger: false });
