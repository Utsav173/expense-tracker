'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { accountGetById, accountGetCustomAnalytics } from '@/lib/endpoints/accounts';
import { transactionGetIncomeExpenseChart, transactionGetAll } from '@/lib/endpoints/transactions';
import { categoryGetAll } from '@/lib/endpoints/category';
import { format } from 'date-fns';
import { useAccountFilterState } from './useAccountFilterState';
import { usePagination } from '@/hooks/usePagination';
import { useCallback, useMemo } from 'react';

interface SearchParams {
  q?: string;
  page?: string;
  sortBy?: string;
  sortOrder?: string;
  categoryId?: string;
  isIncome?: string;
  dateFrom?: string;
  dateTo?: string;
}

interface QueryKeys {
  transactions: any[];
  account: string[];
  analytics: any[];
  chart: any[];
  spendingChart: any[];
}

export const useAccountDetails = (id: string, searchParams: SearchParams) => {
  const {
    filters,
    setSearchQuery,
    handleCategoryChange,
    handleIncomeTypeChange,
    handleDateRangeSelect,
    handleClearDateRange,
    handleSort,
    updateURL
  } = useAccountFilterState();

  const queryClient = useQueryClient();
  const { page, handlePageChange } = usePagination(Number(searchParams.page) || 1, updateURL);

  const queryKeys = useMemo<QueryKeys>(
    () => ({
      transactions: [
        'accountTransactions',
        id,
        {
          dateRange: filters.dateRange,
          page,
          q: filters.debouncedSearchQuery,
          sortBy: filters.sortBy,
          sortOrder: filters.sortOrder,
          categoryId: filters.categoryId,
          isIncome: filters.isIncome
        }
      ],
      account: ['account', id],
      analytics: [
        'customAnalytics',
        id,
        {
          dateRange: filters.dateRange
        }
      ],
      chart: [
        'incomeExpenseChart',
        id,
        {
          dateRange: filters.dateRange
        }
      ],
      spendingChart: [
        'spendingChart',
        id,
        {
          dateRange: filters.dateRange
        }
      ]
    }),
    [id, filters, page]
  );

  const refetchData = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions, refetchType: 'all' }),
      queryClient.invalidateQueries({ queryKey: queryKeys.account, refetchType: 'all' }),
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics, refetchType: 'all' }),
      queryClient.invalidateQueries({ queryKey: queryKeys.chart, refetchType: 'all' }),
      queryClient.invalidateQueries({ queryKey: queryKeys.spendingChart, refetchType: 'all' })
    ]);
  }, [queryClient, queryKeys]);

  const duration = useMemo(
    () =>
      filters.dateRange?.from && filters.dateRange.to
        ? `${format(filters.dateRange.from, 'yyyy-MM-dd')},${format(filters.dateRange.to, 'yyyy-MM-dd')}`
        : 'thisMonth',
    [filters.dateRange]
  );

  const {
    data: account,
    isLoading: isAccountLoading,
    error: accountError
  } = useQuery({
    queryKey: queryKeys.account,
    queryFn: () => accountGetById(id),
    retry: false
  });

  const {
    data: customAnalytics,
    isLoading: isAnalyticsLoading,
    error: analyticsError
  } = useQuery({
    queryKey: queryKeys.analytics,
    queryFn: () => accountGetCustomAnalytics(id, { duration }),
    enabled: !!id
  });

  const {
    data: chartData,
    isLoading: isChartLoading,
    error: chartError
  } = useQuery({
    queryKey: queryKeys.chart,
    queryFn: () =>
      transactionGetIncomeExpenseChart({
        accountId: id,
        duration
      }),
    enabled: !!id
  });

  const {
    data: transactionsData,
    isLoading: isTransactionLoading,
    error: transactionError,
    refetch: refetchTransactions
  } = useQuery({
    queryKey: queryKeys.transactions,
    queryFn: () =>
      transactionGetAll({
        accountId: id,
        duration,
        page,
        pageSize: 10,
        q: filters.debouncedSearchQuery,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        categoryId: filters.categoryId === 'all' ? '' : filters.categoryId,
        isIncome: filters.isIncome
      })
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryGetAll
  });

  const handleResetFilters = useCallback(() => {
    setSearchQuery('');
    handleCategoryChange('all');
    handleIncomeTypeChange('all');
    handleClearDateRange();
    handleSort('date', 'desc');
    updateURL({});
  }, [
    setSearchQuery,
    handleCategoryChange,
    handleIncomeTypeChange,
    handleClearDateRange,
    handleSort,
    updateURL
  ]);

  return {
    account,
    isAccountLoading,
    accountError,
    customAnalytics,
    isAnalyticsLoading,
    analyticsError,
    chartData,
    isChartLoading,
    chartError,
    transactionsData,
    isTransactionLoading,
    transactionError,
    refetchTransactions,
    filters,
    setSearchQuery,
    handleCategoryChange,
    handleIncomeTypeChange,
    handleDateRangeSelect,
    handleClearDateRange,
    handleSort,
    updateURL,
    page,
    handlePageChange,
    categories,
    handleResetFilters,
    refetchData,
    duration
  };
};
