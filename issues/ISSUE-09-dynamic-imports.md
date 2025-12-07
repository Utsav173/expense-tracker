# Dynamic Import for Heavy Libraries

**Description**
`react-pdf` and `xlsx` are included in the main bundle. These are heavy libraries that are likely only used in specific parts of the application (e.g., viewing statements or exporting data).

**Affected Files**
- `src/components/*` (wherever these are used)

**Proposed Changes**
1. Identify usage of `react-pdf` and `xlsx`.
2. Use `next/dynamic` or dynamic `import()` to load these modules only when needed.

**Labels**
- performance
- bundle-size
