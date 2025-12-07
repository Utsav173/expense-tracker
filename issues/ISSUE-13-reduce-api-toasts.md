# Reduce API Client Chatty Toasts

**Description**
`src/lib/api-client.ts` triggers a success toast for every successful request if `successMessage` is present or if the API returns a message.

```typescript
const messageToShow = successMessage || responseData?.message;
if (messageToShow) {
  toast.success(messageToShow);
}
```

If the API returns a `message` field on standard GET requests (e.g. "Data fetched"), the user will be bombarded with toasts.

**Affected Files**
- `src/lib/api-client.ts`

**Proposed Changes**
1. Only show toast if `successMessage` is explicitly passed in the function call.
2. Or, ensure the backend only sends `message` when an actionable event occurred (create/update/delete), not for reads.
3. Default to *not* showing toasts for generic reads.

**Labels**
- user-experience
