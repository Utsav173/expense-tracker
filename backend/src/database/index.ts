import * as schema from './schema';
import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { config } from '../config';
const pool = new Pool({ connectionString: config.DATABASE_URL_NEW });
export const db = drizzle({ client: pool, schema: schema, logger: false });

// // --> for local
// import { drizzle } from 'drizzle-orm/postgres-js';
// import postgres from 'postgres';
// import { config } from '../config';

// // 1. Create the standard PostgreSQL client
// const client = postgres(config.DATABASE_URL_NEW);

// // 2. Create the base Drizzle instance. We name it `_db` because it's the "raw" instance.
// const _db = drizzle(client, { schema, logger: false });

// /**
//  * PROXY-BASED SOLUTION (Corrected for Type Safety)
//  * ------------------------------------------------
//  * PROBLEM: The `postgres` driver returns a plain array from `db.execute()`, while the
//  * `@neondatabase/serverless` driver returns an object `{ rows: [...] }`. The codebase
//  * expects the Neon structure, causing errors when running locally.
//  *
//  * SOLUTION: A Proxy intercepts calls to `db.execute`. It checks if the result is an array.
//  * If it is, we know it's from the local `postgres` driver, so we wrap it in `{ rows: result }`
//  * to mimic the Neon driver's response. This is type-safe and fixes the issue centrally.
//  */
// const handler = {
//   get(target: typeof _db, prop: keyof typeof _db, receiver: any) {
//     if (prop === 'execute') {
//       // Intercept the 'execute' method
//       return async (...args: [any]) => {
//         // Call the original `execute` method
//         const result = await target.execute(...args);

//         // TYPE-SAFE CHECK: If the result is an array, it's from the local driver.
//         if (Array.isArray(result)) {
//           // Wrap it to mimic the Neon response structure.
//           return { rows: result };
//         }

//         // If it's not a plain array, assume it's already in the correct format (like Neon's)
//         // or a different result type that doesn't need wrapping.
//         return result;
//       };
//     }
//     // For all other properties (like 'select', 'insert', etc.), just pass them through
//     return Reflect.get(target, prop, receiver);
//   },
// };

// // 3. Export the proxied `db` object. All application code will use this version.
// export const db = new Proxy(_db, handler) as typeof _db;
