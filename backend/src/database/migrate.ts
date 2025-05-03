import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { migrate } from 'drizzle-orm/neon-http/migrator';
import { config } from '../config';

const sql = neon(config.DATABASE_URL_NEW!);

const db = drizzle(sql);

// // <---- for local
// import { drizzle } from 'drizzle-orm/postgres-js/driver';
// import { migrate } from 'drizzle-orm/postgres-js/migrator';
// import * as schema from './schema';

// const db = drizzle(config.DATABASE_URL_NEW as string, { schema: schema, logger: false });

// for migrations
migrate(db, { migrationsFolder: './drizzle' })
  .then(() => console.log('migrations done'))
  .catch((e) => console.error(e));
