import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db } from '.';

// for migrations
migrate(db, { migrationsFolder: './drizzle' })
  .then(() => console.log('migrations done'))
  .catch((e) => console.error(e));
