import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';
import { neon } from '@neondatabase/serverless';

export const db = drizzle(neon(process.env.DATABASE_URL!), { schema: schema, logger: false });
