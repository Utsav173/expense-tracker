import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { migrate } from 'drizzle-orm/neon-http/migrator';

const sql = neon(process.env.DATABASE_URL!);

const db = drizzle(sql);

// for migrations
migrate(db, { migrationsFolder: './drizzle' })
  .then(() => console.log('migrations done'))
  .catch((e) => console.error(e));
