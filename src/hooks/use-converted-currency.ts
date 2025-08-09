import { useQuery } from '@tanstack/react-query';
import { convertCurrency } from '@/lib/endpoints/currency';
import { useAuth } from '@/components/providers/auth-provider';

export const useConvertedCurrency = (amount: number, fromCurrency: string) => {
  const { session } = useAuth();
  const toCurrency = session?.user?.preferredCurrency || 'INR';

  return useQuery({
    queryKey: ['convert', amount, fromCurrency, toCurrency],
    queryFn: () => convertCurrency(amount, fromCurrency, toCurrency),
    enabled:
      !!fromCurrency && fromCurrency.toUpperCase() !== toCurrency.toUpperCase() && amount > 0,
    staleTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: false,
    retry: 1
  });
};
