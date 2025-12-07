# Evaluate Redundant Animation Libraries

**Description**
The project currently depends on both `framer-motion` and `gsap` (plus `@gsap/react`). Both are powerful animation libraries. Using both increases the bundle size significantly.

**Affected Files**
- `package.json`
- `src/components/*` (need to check usage)

**Proposed Changes**
1. Audit the codebase to see where each library is used.
2. Standardize on one library if possible (likely `framer-motion` given the Next.js ecosystem, or `gsap` if complex timelines are needed).
3. Remove the unused library.

**Labels**
- performance
- refactor
- dependencies
