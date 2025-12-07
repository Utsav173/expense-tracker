# Review Duplicate Analytics Setup

**Description**
`src/app/layout.tsx` contains:
1. `<GoogleAnalytics gaId='GTM-NRXZ2WPR' />` from `@next/third-parties/google`.
2. A manual `Script` injection for GTM (`https://www.googletagmanager.com/gtag/js?id=GTM-NRXZ2WPR`).
3. Another manual `Script` for `window.dataLayer` initialization.

This looks like duplicate initialization of Google Analytics/Tag Manager, which can lead to double-counting metrics or errors.

**Affected Files**
- `src/app/layout.tsx`

**Proposed Changes**
1. Remove the manual `<Script>` tags if `<GoogleAnalytics>` covers the requirement.
2. Alternatively, if GTM (Google Tag Manager) is specifically needed (container ID usually starts with `GTM-`), use `<GoogleTagManager>` from `@next/third-parties/google` instead of `GoogleAnalytics` (which usually takes `G-` or `UA-` IDs).
3. The ID `GTM-NRXZ2WPR` looks like a Tag Manager ID, so `GoogleTagManager` component should likely be used, and the manual scripts removed.

**Labels**
- bug
- analytics
