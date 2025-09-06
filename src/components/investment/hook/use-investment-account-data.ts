import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import {
  investmentAccountGetPerformance,
  investmentAccountGetSummary
} from '@/lib/endpoints/investmentAccount';
import type { InvestmentAccountAPI } from '@/lib/api/api-types';

interface UseInvestmentAccountDataProps {
  accountId: string;
  oldestInvestmentDate: Date | undefined;
}

export function useInvestmentAccountData({
  accountId,
  oldestInvestmentDate
}: UseInvestmentAccountDataProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>(undefined);

  const { data: summary, isLoading: isLoadingSummary } =
    useQuery<InvestmentAccountAPI.GetSummaryResponse>({
      queryKey: ['investmentAccountSummary', accountId],
      queryFn: () => investmentAccountGetSummary(accountId),
      enabled: !!accountId,
      retry: false,
      staleTime: 5 * 60 * 1000
    });

  const { data: performanceData, isLoading: isLoadingChart } = useQuery<any>({
    queryKey: ['investmentAccountPerformance', accountId, selectedTimeRange, customDateRange],
    queryFn: () => {
      const periodMap: Record<string, '7d' | '30d' | '90d' | '1y'> = {
        '7d': '7d',
        '30d': '30d',
        '90d': '90d',
        '1y': '1y'
      };

      if (selectedTimeRange === 'all') {
        return investmentAccountGetPerformance(accountId, {
          startDate: oldestInvestmentDate ? format(oldestInvestmentDate, 'yyyy-MM-dd') : undefined,
          endDate: format(new Date(), 'yyyy-MM-dd')
        });
      }
      if (selectedTimeRange === 'custom' && customDateRange?.from) {
        return investmentAccountGetPerformance(accountId, {
          startDate: format(customDateRange.from, 'yyyy-MM-dd'),
          endDate: customDateRange.to ? format(customDateRange.to, 'yyyy-MM-dd') : undefined
        });
      }
      const period = periodMap[selectedTimeRange];
      return investmentAccountGetPerformance(accountId, { period });
    },
    staleTime: 5 * 60 * 1000
  });

  const performanceMetrics = useMemo(() => {
    if (!summary) return null;
    const totalGain = (summary.totalvalue || 0) - (summary.totalinvestment || 0);
    const totalReturn =
      summary.totalinvestment > 0 ? (totalGain / summary.totalinvestment) * 100 : 0;
    return {
      totalGain,
      totalReturn,
      totalValue: summary.totalvalue || 0,
      totalInvestment: summary.totalinvestment || 0
    };
  }, [summary]);

  return {
    summary,
    performanceData,
    performanceMetrics,
    isLoadingSummary,
    isLoadingChart,
    selectedTimeRange,
    setSelectedTimeRange,
    customDateRange,
    setCustomDateRange
  };
}
