/**
 * Formats a number as currency according to locale and currency code.
 * @param amount - The number to format.
 * @param currencyCode - The 3-letter ISO currency code (defaults to INR).
 * @param locale - The locale string (defaults to en-IN).
 * @returns Formatted currency string.
 */
export function formatCurrency(
  amount: number | null | undefined,
  currencyCode: string = 'INR',
  locale: string = 'en-IN',
): string {
  const numAmount = Number(amount);
  if (isNaN(numAmount)) {
    // Handle cases where amount might be null, undefined, or NaN
    return `${currencyCode} 0.00`; // Or return 'N/A', or handle as needed
  }

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      // Adjust fraction digits as needed, e.g., some currencies don't use decimals
      // minimumFractionDigits: 2,
      // maximumFractionDigits: 2,
    }).format(numAmount);
  } catch (error) {
    console.error(`Error formatting currency (${currencyCode}, ${locale}):`, error);
    // Fallback for invalid codes or environments without full Intl support
    return `${currencyCode} ${numAmount.toFixed(2)}`;
  }
}
