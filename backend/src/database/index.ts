import * as schema from './schema';
import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema: schema, logger: false });

// for local
// import { drizzle } from 'drizzle-orm/postgres-js/driver';
// export const db = drizzle(process.env.DATABASE_URL as string, { schema: schema, logger: false });
