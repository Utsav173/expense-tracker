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
  // List of APIs to try in order
  const APIs = [
    {
      url: 'https://www.frankfurter.app/currencies',
      transform: (data: any) => Object.entries(data).map(([code, name]) => ({ code, name }))
    },
    {
      url: 'https://open.er-api.com/v6/latest/USD',
      transform: (data: { rates: { [key: string]: number } }) =>
        Object.keys(data.rates).map((code) => ({
          code,
          name: COMMON_CURRENCIES[code] || code
        }))
    }
  ];

  // Try each API in sequence until one works
  for (const api of APIs) {
    try {
      const response = await fetch(api.url);
      if (!response.ok) continue;

      const data: any = await response.json();
      return api.transform(data) as { code: string; name: string }[];
    } catch (error) {
      console.warn(`API attempt failed:`, error);
      continue;
    }
  }

  // Fallback to common currencies if all APIs fail
  return Object.entries(COMMON_CURRENCIES).map(([code, name]) => ({
    code,
    name
  }));
};
