import apiClient from '@/lib/api/client';
import { apiEndpoints } from '@/lib/api/api-endpoints-request-types';

export const fetchCurrencies = async (): Promise<{ code: string; name: string }[]> => {
  const response = await apiClient<unknown, unknown, unknown, Record<string, string>>(
    apiEndpoints.currency.getSupported
  );
  return Object.entries(response).map(([code, name]) => ({ code: code.toUpperCase(), name }));
};

export const convertCurrency = async (
  amount: number,
  from: string,
  to: string
): Promise<{ convertedAmount: number; rate: number }> => {
  return apiClient(apiEndpoints.currency.convert, {
    query: { amount, from, to }
  });
};
