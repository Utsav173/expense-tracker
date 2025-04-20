'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { accountGetDashboard, accountGetDropdown } from '@/lib/endpoints/accounts';
import { goalGetAll } from '@/lib/endpoints/goal';
import { budgetGetSummary } from '@/lib/endpoints/budget';
import { getOutstandingDebts } from '@/lib/endpoints/debt';
import {
  investmentGetPortfolioSummary,
  investmentGetPortfolioHistorical
} from '@/lib/endpoints/investment';
import { transactionGetCategoryChart } from '@/lib/endpoints/transactions';
import {
  AccountDropdown,
  BudgetSummaryItem,
  DashboardData,
  DebtWithDetails,
  PortfolioSummary,
  SavingGoal,
  User
} from '@/lib/types';

interface UseDashboardDataOptions {
  timeRangeOption: string;
  customDateRange?: DateRange;
  user?: User | null;
}

interface CombinedDashboardData {
  dashboardSummary: DashboardData | null;
  goals: SavingGoal[] | null;
  accountsDropdown: AccountDropdown[] | null;
  budgetSummary: BudgetSummaryItem[] | null;
  outstandingDebts: DebtWithDetails[] | null;
  investmentSummary: PortfolioSummary | null;
  investmentHistory: { date: string; value: number }[] | null;
  spendingBreakdown: { name: string[]; totalIncome: number[]; totalExpense: number[] } | null;
  accountIdToCurrencyMap: Map<string, string>;
}

const mapTimeRangeToPeriod = (timeRangeOption: string): '7d' | '30d' | '90d' | '1y' => {
  switch (timeRangeOption) {
    case 'thisWeek':
      return '7d';
    case 'thisMonth':
    case '30d':
      return '30d';
    case '3m':
    case '90d':
      return '90d';
    case 'ytd':
    case '12m':
    case 'thisYear':
    case 'all':
    case 'custom':
      return '1y';
    default:
      return '30d';
  }
};

export const useDashboardData = ({
  timeRangeOption,
  customDateRange,
  user
}: UseDashboardDataOptions): {
  data: CombinedDashboardData | null;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
} => {
  const queryClient = useQueryClient();

  const durationParamForSpecificEndpoints = useMemo(() => {
    if (timeRangeOption === 'custom' && customDateRange?.from && customDateRange?.to) {
      return `${format(customDateRange.from, 'yyyy-MM-dd')},${format(
        customDateRange.to,
        'yyyy-MM-dd'
      )}`;
    }
    return timeRangeOption === 'custom' ? 'all' : timeRangeOption;
  }, [timeRangeOption, customDateRange]);

  const investmentHistoryPeriod = useMemo(
    () => mapTimeRangeToPeriod(timeRangeOption),
    [timeRangeOption]
  );

  const currentMonth = useMemo(() => new Date().getMonth() + 1, []);
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  const dashboardSummaryQuery = useQuery({
    queryKey: ['dashboardData'],
    queryFn: () => accountGetDashboard(),
    enabled: !!user,
    staleTime: 5 * 60 * 1000
  });

  const goalsQuery = useQuery({
    queryKey: ['goalsDashboard'],
    queryFn: () => goalGetAll({ page: 1, limit: 5 }),
    enabled: !!user,
    staleTime: 15 * 60 * 1000
  });

  const accountsDropdownQuery = useQuery({
    queryKey: ['accountsDropdownDashboard'],
    queryFn: accountGetDropdown,
    enabled: !!user,
    staleTime: 30 * 60 * 1000
  });

  const budgetSummaryQuery = useQuery({
    queryKey: ['budgetSummaryDashboard', currentMonth, currentYear],
    queryFn: () => budgetGetSummary(currentMonth, currentYear),
    enabled: !!user,
    staleTime: 10 * 60 * 1000
  });

  const outstandingDebtsQuery = useQuery({
    queryKey: ['outstandingDebtsDashboard'],
    queryFn: () => getOutstandingDebts(),
    enabled: !!user,
    staleTime: 10 * 60 * 1000
  });

  const investmentSummaryQuery = useQuery({
    queryKey: ['investmentPortfolioSummaryDashboard'],
    queryFn: () => investmentGetPortfolioSummary(),
    enabled: !!user,
    staleTime: 15 * 60 * 1000
  });

  const investmentHistoryQuery = useQuery({
    queryKey: ['investmentPortfolioHistoricalDashboard', investmentHistoryPeriod],
    queryFn: () => investmentGetPortfolioHistorical({ period: investmentHistoryPeriod }),
    enabled: !!user && (investmentSummaryQuery.data?.numberOfHoldings ?? 0) > 0,
    staleTime: 60 * 60 * 1000
  });

  const spendingBreakdownQuery = useQuery({
    queryKey: ['spendingBreakdown', durationParamForSpecificEndpoints],
    queryFn: () => transactionGetCategoryChart({ duration: durationParamForSpecificEndpoints }),
    enabled: !!user,
    staleTime: 5 * 60 * 1000
  });

  const isLoading =
    dashboardSummaryQuery.isLoading ||
    goalsQuery.isLoading ||
    accountsDropdownQuery.isLoading ||
    budgetSummaryQuery.isLoading ||
    outstandingDebtsQuery.isLoading ||
    investmentSummaryQuery.isLoading ||
    ((investmentSummaryQuery.data?.numberOfHoldings ?? 0) > 0 &&
      investmentHistoryQuery.isLoading) ||
    spendingBreakdownQuery.isLoading;

  const isFetching =
    dashboardSummaryQuery.isFetching ||
    goalsQuery.isFetching ||
    accountsDropdownQuery.isFetching ||
    budgetSummaryQuery.isFetching ||
    outstandingDebtsQuery.isFetching ||
    investmentSummaryQuery.isFetching ||
    investmentHistoryQuery.isFetching ||
    spendingBreakdownQuery.isFetching;

  const error =
    dashboardSummaryQuery.error ||
    goalsQuery.error ||
    accountsDropdownQuery.error ||
    budgetSummaryQuery.error ||
    outstandingDebtsQuery.error ||
    investmentSummaryQuery.error ||
    investmentHistoryQuery.error ||
    spendingBreakdownQuery.error;

  const accountIdToCurrencyMap = useMemo(() => {
    const map = new Map<string, string>();
    accountsDropdownQuery.data?.forEach((acc) => {
      if (acc?.id && acc.currency) {
        map.set(acc.id, acc.currency);
      }
    });
    return map;
  }, [accountsDropdownQuery.data]);

  const combinedData = useMemo((): CombinedDashboardData | null => {
    if (
      isLoading ||
      !dashboardSummaryQuery.data ||
      !accountsDropdownQuery.data ||
      !goalsQuery.data
    ) {
      return null;
    }
    return {
      dashboardSummary: dashboardSummaryQuery.data,
      goals: goalsQuery.data?.data ?? [],
      accountsDropdown: accountsDropdownQuery.data,
      budgetSummary: budgetSummaryQuery.data ?? [],
      outstandingDebts: outstandingDebtsQuery.data?.data ?? [],
      investmentSummary: investmentSummaryQuery.data ?? null,
      investmentHistory: investmentHistoryQuery.data?.data ?? [],
      spendingBreakdown: spendingBreakdownQuery.data ?? null,
      accountIdToCurrencyMap: accountIdToCurrencyMap
    };
  }, [
    isLoading,
    dashboardSummaryQuery.data,
    goalsQuery.data,
    accountsDropdownQuery.data,
    budgetSummaryQuery.data,
    outstandingDebtsQuery.data,
    investmentSummaryQuery.data,
    investmentHistoryQuery.data,
    spendingBreakdownQuery.data,
    accountIdToCurrencyMap
  ]);

  const refetch = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
    await queryClient.invalidateQueries({ queryKey: ['goalsDashboard'] });
    await queryClient.invalidateQueries({ queryKey: ['accountsDropdownDashboard'] });
    await queryClient.invalidateQueries({
      queryKey: ['budgetSummaryDashboard', currentMonth, currentYear]
    });
    await queryClient.invalidateQueries({ queryKey: ['outstandingDebtsDashboard'] });
    await queryClient.invalidateQueries({ queryKey: ['investmentPortfolioSummaryDashboard'] });
    await queryClient.invalidateQueries({
      queryKey: ['investmentPortfolioHistoricalDashboard', investmentHistoryPeriod]
    });
    await queryClient.invalidateQueries({
      queryKey: ['spendingBreakdown', durationParamForSpecificEndpoints]
    });
  }, [
    queryClient,
    currentMonth,
    currentYear,
    investmentHistoryPeriod,
    durationParamForSpecificEndpoints
  ]);

  return {
    data: combinedData,
    isLoading,
    isFetching,
    isError: !!error,
    error: error as Error | null,
    refetch
  };
};
