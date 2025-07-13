export const COMMON_CURRENCIES: Record<string, string> = {
  USD: 'US Dollar',
  EUR: 'Euro',
  GBP: 'British Pound',
  JPY: 'Japanese Yen',
  AUD: 'Australian Dollar',
  CAD: 'Canadian Dollar',
  CHF: 'Swiss Franc',
  CNY: 'Chinese Yuan',
  INR: 'Indian Rupee',
  NZD: 'New Zealand Dollar',
  SGD: 'Singapore Dollar',
  HKD: 'Hong Kong Dollar',
  AED: 'UAE Dirham',
  ZAR: 'South African Rand',
  THB: 'Thai Baht',
  SAR: 'Saudi Riyal',
  MYR: 'Malaysian Ringgit',
  IDR: 'Indonesian Rupiah',
  PKR: 'Pakistani Rupee',
  BRL: 'Brazilian Real'
};

export const fetchCurrencies = async (): Promise<{ code: string; name: string }[]> => {
  return Object.entries(COMMON_CURRENCIES).map(([code, name]) => ({
    code,
    name
  }));
};
