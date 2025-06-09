import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { migrate } from 'drizzle-orm/neon-http/migrator';
import { config } from '../config';

const sql = neon(config.DATABASE_URL_NEW!);

const db = drizzle(sql);

migrate(db, { migrationsFolder: './drizzle' })
  .then(() => console.log('migrations done'))
  .catch((e) => console.error(e));

// // // <---- for local
// import { drizzle } from 'drizzle-orm/postgres-js';
// import { migrate } from 'drizzle-orm/postgres-js/migrator';
// import postgres from 'postgres';
// import { config } from '../config';

// const migrationClient = postgres(config.DATABASE_URL_NEW, { max: 1 });
// const db = drizzle(migrationClient);

// migrate(db, { migrationsFolder: './drizzle' })
//   .then(() => console.log('Migrations complete!'))
//   .catch((e) => {
//     console.error('Migration failed:', e);
//     process.exit(1);
//   })
//   .finally(() => {
//     migrationClient.end();
//   });
