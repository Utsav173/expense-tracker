'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { accountGetById, accountGetCustomAnalytics } from '@/lib/endpoints/accounts';
import { transactionGetIncomeExpenseChart, transactionGetAll } from '@/lib/endpoints/transactions';
import { categoryGetAll } from '@/lib/endpoints/category';
import { format } from 'date-fns';
import { useAccountFilterState } from './useAccountFilterState';
import { usePagination } from '@/hooks/usePagination';
import { useCallback } from 'react';

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

const createTransactionsQueryKey = (id: string, filters: any, page: number) => {
  return [
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
  ];
};

const createAccountDetailsQueryKey = (id: string) => {
  return ['account', id];
};

const createAnalyticsQueryKey = (id: string, filters: any) => {
  return [
    'customAnalytics',
    id,
    {
      dateRange: filters.dateRange
    }
  ];
};

const createIncomeExpenseChartQueryKey = (id: string, filters: any) => {
  return [
    'incomeExpenseChart',
    id,
    {
      dateRange: filters.dateRange
    }
  ];
};

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

  const transactionQueryKey = createTransactionsQueryKey(id, filters, page);
  const accountQueryKey = createAccountDetailsQueryKey(id);
  const analyticsQueryKey = createAnalyticsQueryKey(id, filters);
  const chartQueryKey = createIncomeExpenseChartQueryKey(id, filters);

  const refetchData = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: transactionQueryKey, refetchType: 'all' }),
      queryClient.invalidateQueries({ queryKey: accountQueryKey, refetchType: 'all' }),
      queryClient.invalidateQueries({ queryKey: analyticsQueryKey, refetchType: 'all' }),
      queryClient.invalidateQueries({ queryKey: chartQueryKey, refetchType: 'all' })
    ]);
  }, [queryClient, transactionQueryKey, accountQueryKey, analyticsQueryKey, chartQueryKey]);

  // Queries
  const {
    data: account,
    isLoading: isAccountLoading,
    error: accountError
  } = useQuery({
    queryKey: accountQueryKey,
    queryFn: () => accountGetById(id),
    retry: false
  });

  const {
    data: customAnalytics,
    isLoading: isAnalyticsLoading,
    error: analyticsError
  } = useQuery({
    queryKey: analyticsQueryKey,
    queryFn: () =>
      accountGetCustomAnalytics(id, {
        duration:
          filters.dateRange?.from && filters.dateRange.to
            ? `${format(filters.dateRange.from, 'yyyy-MM-dd')},${format(filters.dateRange.to, 'yyyy-MM-dd')}`
            : 'thisMonth'
      }),
    enabled: !!id
  });

  const {
    data: chartData,
    isLoading: isChartLoading,
    error: chartError
  } = useQuery({
    queryKey: chartQueryKey,
    queryFn: () =>
      transactionGetIncomeExpenseChart({
        accountId: id,
        duration:
          filters.dateRange?.from && filters.dateRange.to
            ? `${format(filters.dateRange.from, 'yyyy-MM-dd')},${format(filters.dateRange.to, 'yyyy-MM-dd')}`
            : 'thisMonth'
      }),
    enabled: !!id
  });

  const {
    data: transactionsData,
    isLoading: isTransactionLoading,
    error: transactionError,
    refetch: refetchTransactions
  } = useQuery({
    queryKey: transactionQueryKey,
    queryFn: () =>
      transactionGetAll({
        accountId: id,
        duration:
          filters.dateRange?.from && filters.dateRange.to
            ? `${format(filters.dateRange.from, 'yyyy-MM-dd')},${format(filters.dateRange.to, 'yyyy-MM-dd')}`
            : 'thisMonth',
        page,
        pageSize: 10,
        q: filters.debouncedSearchQuery, // Use the debounced query
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

  // Reset filters handler
  const handleResetFilters = () => {
    setSearchQuery('');
    handleCategoryChange('all');
    handleIncomeTypeChange('all');
    handleClearDateRange();
    handleSort('date', 'desc');
    updateURL({});
  };

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
    refetchData
  };
};
