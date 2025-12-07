# Verify `theme-toggle.tsx` View Transition

**Description**
`src/components/theme-toggle.tsx` uses `document.startViewTransition`. This is a modern API and might not be supported in all browsers (e.g., Firefox support is recent/partial).

**Affected Files**
- `src/components/theme-toggle.tsx`

**Proposed Changes**
1. Ensure the fallback `setTheme(newTheme)` is robust (it seems to be handled).
2. Consider adding a check or polyfill if broader support is needed, or just accept it as a progressive enhancement.

**Labels**
- browser-compatibility
- ui
