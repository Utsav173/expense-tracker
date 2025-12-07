# Setup Test Runner (Jest/Vitest)

**Description**
The project currently lacks a test runner. There are no scripts for `test` in `package.json`, and no test configuration files (like `jest.config.js` or `vitest.config.ts`).

**Affected Files**
- `package.json`
- New config files

**Proposed Changes**
1. Install `vitest` (recommended for Vite/Bun/modern ecosystems) or `jest`.
2. Add `test` script to `package.json`.
3. Create a sample test file to verify the setup.

**Labels**
- testing
- infrastructure
