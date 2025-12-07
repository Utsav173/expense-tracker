# Optimize `radix-ui` Imports

**Description**
`package.json` includes both the main `radix-ui` package and individual `@radix-ui/*` packages (e.g., `@radix-ui/react-checkbox`, `@radix-ui/react-dialog`).

The `radix-ui` package is often a meta-package or unnecessary if individual primitives are installed. This might lead to version mismatches or duplicate code if not carefully managed.

**Affected Files**
- `package.json`

**Proposed Changes**
1. Check if `radix-ui` (the main package) is actually used in the code.
2. If not used, remove it and rely only on the individual `@radix-ui/*` packages to ensure tree-shaking and minimal bundle size.

**Labels**
- optimization
- dependencies
