# Switch from Axios to Fetch for API Requests

**Description**
The application uses `axios` in `src/lib/api-client.ts`. While `axios` is a great library, Next.js (especially version 16) has deep integration with the native `fetch` API, including caching, revalidation, and request deduplication, especially when used in Server Components.

Even for client-side requests, using `fetch` removes the 10kb+ `axios` dependency.

**Affected Files**
- `src/lib/api-client.ts`
- Usage throughout the app

**Proposed Changes**
1. Refactor `src/lib/api-client.ts` to use `fetch` (or a lightweight wrapper around `fetch`).
2. Ensure error handling matches the existing logic (redirects on 401/403).
3. Remove `axios` from `package.json`.

**Labels**
- refactor
- performance
- nextjs
