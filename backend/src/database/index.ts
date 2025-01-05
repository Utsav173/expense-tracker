import { drizzle } from 'drizzle-orm/neon-http';
// import { drizzle } from 'drizzle-orm/postgres-js/driver';
import * as schema from './schema';
import { neon } from '@neondatabase/serverless';

// for deployment
export const db = drizzle(neon(process.env.DATABASE_URL!), { schema: schema, logger: false });

// for local
// export const db = drizzle(process.env.DATABASE_URL as string, { schema: schema, logger: false });
