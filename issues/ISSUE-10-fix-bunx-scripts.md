# Fix `bunx` Usage in Scripts

**Description**
The `package.json` scripts use `bunx` explicitly:

```json
"lint": "bunx eslint .",
"typecheck": "bunx tsc",
```

This enforces the use of Bun. If a developer is using Node.js (npm/yarn/pnpm), these scripts might fail or require Bun to be installed. It's better to rely on the package manager's execution context or just call the binary directly (npm/yarn/pnpm will find it in `.bin`).

**Affected Files**
- `package.json`

**Proposed Changes**
1. Change `bunx eslint .` to `eslint .`.
2. Change `bunx tsc` to `tsc`.

**Labels**
- compatibility
- dev-experience
