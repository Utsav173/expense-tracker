# Internationalize Currency Formatting

**Description**
`src/lib/utils.ts` contains a `formatCurrency` function that hardcodes `en-IN` (Indian English) and `INR` as the default.

```typescript
return new Intl.NumberFormat('en-IN', options).format(numAmount);
```

While this might be the target market, a robust application should handle different locales and currencies, or at least respect the user's browser settings or profile preferences.

**Affected Files**
- `src/lib/utils.ts`

**Proposed Changes**
1. Accept `locale` as an argument (defaulting to `en-US` or user's locale).
2. Allow configuration of the currency via a context or settings hook.

**Labels**
- internationalization
- enhancement
