# Refactor `dashboard-controls.tsx` Styles

**Description**
`src/components/dashboard/dashboard-controls.tsx` contains complex inline Tailwind classes and conditional logic that makes it hard to read.

**Affected Files**
- `src/components/dashboard/dashboard-controls.tsx`

**Proposed Changes**
1. Extract complex class strings into variables or use `cva` (class-variance-authority) if there are variants.
2. Break down the component if it grows larger.

**Labels**
- refactor
- ui
