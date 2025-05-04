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
    return `${currencyCode} 0.00`;
  }

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
    }).format(numAmount);
  } catch (error) {
    console.error(`Error formatting currency (${currencyCode}, ${locale}):`, error);

    return `${currencyCode} ${numAmount.toFixed(2)}`;
  }
}
