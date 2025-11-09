'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  investmentAccountGetById,
  investmentAccountGetSummary,
  investmentAccountGetPerformance
} from '@/lib/endpoints/investmentAccount';
import { investmentGetAll } from '@/lib/endpoints/investment';
import { useUrlState } from '@/hooks/useUrlState';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import type { InvestmentAccountAPI, InvestmentAPI } from '@/lib/api/api-types';

// Define the shape of the context data
interface InvestmentAccountDetailsContextType {
  accountId: string;
  account?: InvestmentAccountAPI.GetByIdResponse;
  isAccountLoading: boolean;
  accountError?: Error | null;
  summary?: InvestmentAccountAPI.GetSummaryResponse;
  isSummaryLoading: boolean;
  performanceData?: any; // Define proper type
  isPerformanceLoading: boolean;
  investments?: { data: InvestmentAPI.Investment[]; pagination: any };
  isInvestmentsLoading: boolean;
  refetchInvestments: () => void;
  performanceMetrics: {
    totalGain: number;
    totalReturn: number;
    totalValue: number;
    totalInvestment: number;
    totaldividend: number;
  };
  // URL state for table
  state: any;
  setState: (newState: any) => void;
  handlePageChange: (page: number) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  // Time range state for chart
  selectedTimeRange: string;
  setSelectedTimeRange: (range: string) => void;
  customDateRange?: DateRange;
  setCustomDateRange: (range?: DateRange) => void;
}

const InvestmentAccountDetailsContext = createContext<
  InvestmentAccountDetailsContextType | undefined
>(undefined);

export const useInvestmentAccountDetails = () => {
  const context = useContext(InvestmentAccountDetailsContext);
  if (!context) {
    throw new Error(
      'useInvestmentAccountDetails must be used within an InvestmentAccountDetailsProvider'
    );
  }
  return context;
};

const initialUrlState = {
  page: 1,
  sortBy: 'purchaseDate',
  sortOrder: 'desc' as 'asc' | 'desc',
  q: ''
};

export const InvestmentAccountDetailsProvider = ({
  children,
  accountId
}: {
  children: React.ReactNode;
  accountId: string;
}) => {
  const { state, setState, handlePageChange, searchQuery, setSearchQuery } =
    useUrlState(initialUrlState);
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>(undefined);

  const {
    data: account,
    isLoading: isAccountLoading,
    error: accountError
  } = useQuery({
    queryKey: ['investmentAccount', accountId],
    queryFn: () => investmentAccountGetById(accountId),
    enabled: !!accountId,
    staleTime: 5 * 60 * 1000
  });

  const { data: summary, isLoading: isSummaryLoading } = useQuery({
    queryKey: ['investmentAccountSummary', accountId],
    queryFn: () => investmentAccountGetSummary(accountId),
    enabled: !!accountId,
    staleTime: 5 * 60 * 1000
  });

  const oldestInvestmentDate = useMemo(
    () => (account?.oldestInvestmentDate ? new Date(account.oldestInvestmentDate) : undefined),
    [account]
  );

  const { data: performanceData, isLoading: isPerformanceLoading } = useQuery({
    queryKey: [
      'investmentAccountPerformance',
      accountId,
      selectedTimeRange,
      customDateRange,
      oldestInvestmentDate
    ],
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
    staleTime: 5 * 60 * 1000,
    enabled: !!accountId
  });

  const {
    data: investments,
    isLoading: isInvestmentsLoading,
    refetch: refetchInvestments
  } = useQuery({
    queryKey: ['investments', accountId, state.page, state.q, state.sortBy, state.sortOrder],
    queryFn: () =>
      investmentGetAll(accountId, {
        page: state.page,
        limit: 10,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder,
        q: state.q
      }),
    enabled: !!accountId,
    retry: false
  });

  const performanceMetrics = useMemo(() => {
    if (!summary) {
      return {
        totalGain: 0,
        totalReturn: 0,
        totalValue: 0,
        totalInvestment: 0,
        totaldividend: 0
      };
    }
    const totalGain = (summary.totalvalue || 0) - (summary.totalInvestment || 0);
    const totalReturn =
      summary.totalInvestment > 0 ? (totalGain / summary.totalInvestment) * 100 : 0;
    return {
      totalGain,
      totalReturn,
      totalValue: summary.totalvalue || 0,
      totalInvestment: summary.totalInvestment || 0,
      totaldividend: summary.totaldividend || 0
    };
  }, [summary]);

  const value = {
    accountId,
    account,
    isAccountLoading,
    accountError: accountError as Error | null,
    summary,
    isSummaryLoading,
    performanceData,
    isPerformanceLoading,
    investments,
    isInvestmentsLoading,
    refetchInvestments,
    performanceMetrics,
    state,
    setState,
    handlePageChange,
    searchQuery,
    setSearchQuery,
    selectedTimeRange,
    setSelectedTimeRange,
    customDateRange,
    setCustomDateRange
  };

  return (
    <InvestmentAccountDetailsContext.Provider value={value}>
      {children}
    </InvestmentAccountDetailsContext.Provider>
  );
};
