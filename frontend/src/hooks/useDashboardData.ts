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

export const useDashboardData = ({
  timeRangeOption,
  customDateRange,
  user
}: UseDashboardDataOptions) => {
  const queryClient = useQueryClient();

  const queryParams = useMemo(() => {
    const params: { timeRange?: string; startDate?: string; endDate?: string } = {};
    if (timeRangeOption === 'custom' && customDateRange?.from && customDateRange?.to) {
      params.timeRange = 'custom';
      params.startDate = format(customDateRange.from, 'yyyy-MM-dd');
      params.endDate = format(customDateRange.to, 'yyyy-MM-dd');
    } else if (timeRangeOption !== 'custom' && timeRangeOption !== 'all') {
      params.timeRange = timeRangeOption;
    } else {
      // No timeRange param needed for 'all' or default case for the dashboard endpoint
    }

    return params;
  }, [timeRangeOption, customDateRange]);

  const durationParamForSpecificEndpoints = useMemo(() => {
    if (timeRangeOption === 'custom' && queryParams.startDate && queryParams.endDate) {
      return `${queryParams.startDate},${queryParams.endDate}`;
    }
    return timeRangeOption === 'custom' ? 'all' : timeRangeOption;
  }, [timeRangeOption, queryParams]);

  const dashboardSummaryQuery = useQuery({
    queryKey: ['dashboardData', queryParams.timeRange, queryParams.startDate, queryParams.endDate],
    queryFn: () => accountGetDashboard(queryParams), // Pass the correct object
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
    queryKey: ['budgetSummaryDashboard', durationParamForSpecificEndpoints],
    queryFn: () => {
      let month = new Date().getMonth() + 1;
      let year = new Date().getFullYear();
      if (timeRangeOption === 'custom' && customDateRange?.from) {
        month = customDateRange.from.getMonth() + 1;
        year = customDateRange.from.getFullYear();
      } else if (timeRangeOption === 'thisYear') {
        month = new Date().getMonth() + 1;
        year = new Date().getFullYear();
      } else if (timeRangeOption === 'thisMonth') {
        month = new Date().getMonth() + 1;
        year = new Date().getFullYear();
      }
      return budgetGetSummary(month, year);
    },
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
    queryKey: ['investmentPortfolioHistoricalDashboard', '30d'],
    queryFn: () => investmentGetPortfolioHistorical({ period: '30d' }),
    // Use optional chaining AND nullish coalescing for safety
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
    // Use optional chaining AND nullish coalescing for safety here too
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
    if (!dashboardSummaryQuery.data || !accountsDropdownQuery.data || !goalsQuery.data) {
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
    await queryClient.invalidateQueries({ queryKey: ['budgetSummaryDashboard'] });
    await queryClient.invalidateQueries({ queryKey: ['outstandingDebtsDashboard'] });
    await queryClient.invalidateQueries({ queryKey: ['investmentPortfolioSummaryDashboard'] });
    await queryClient.invalidateQueries({ queryKey: ['investmentPortfolioHistoricalDashboard'] });
    await queryClient.invalidateQueries({ queryKey: ['spendingBreakdown'] });
  }, [queryClient]);

  return {
    data: combinedData,
    isLoading,
    isFetching,
    isError: !!error,
    error: error as Error | null,
    refetch
  };
};
