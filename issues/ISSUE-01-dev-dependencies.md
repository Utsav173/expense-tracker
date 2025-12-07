# Move `devDependencies` to the correct section

**Description**
The `package.json` file currently lists `eslint-plugin-mdx` and `prettier-plugin-tailwindcss` under `dependencies`. These are development tools and should be moved to `devDependencies` to reduce the production install size and keep the dependency tree clean.

**Affected Files**
- `package.json`

**Proposed Changes**
1. Move `eslint-plugin-mdx` to `devDependencies`.
2. Move `prettier-plugin-tailwindcss` to `devDependencies`.

**Labels**
- chore
- dependencies
- optimization
