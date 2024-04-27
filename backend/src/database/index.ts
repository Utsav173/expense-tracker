import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// for development
const queryClient = postgres(process.env.DATABASE_URL!, { max: 1 });
export const db = drizzle(queryClient, { schema: schema, logger: true });

// for production
// import { neon } from '@neondatabase/serverless';
// import { drizzle } from 'drizzle-orm/neon-http';
// const sql = neon(process.env.DATABASE_URL!, { max: 1 });
// export const db = drizzle(sql);
