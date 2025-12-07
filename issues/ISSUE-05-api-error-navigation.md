# Improve API Error Handling and Navigation

**Description**
In `src/lib/api-client.ts`, authentication errors (401/403) trigger a `window.location.href = '/auth/login'` redirect. This causes a full page reload, bypassing Next.js's client-side routing, which is slower and provides a worse user experience.

**Affected Files**
- `src/lib/api-client.ts`

**Proposed Changes**
1. Determine how to inject the Next.js `router` or `redirect` function into the API client, or return a specific error that the calling component/hook can handle to trigger navigation.
2. Note: Using `useRouter` inside a standard utility function isn't possible directly if it's not a hook.
3. Solution: Create a custom hook `useApiClient` that wraps the fetch logic and has access to `useRouter`, or use a global event emitter / context to handle auth errors and trigger navigation from a top-level component.

**Labels**
- user-experience
- refactor
