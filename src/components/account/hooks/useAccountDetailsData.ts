'use client';

import { useQuery } from '@tanstack/react-query';
import { accountGetById, accountGetCustomAnalytics } from '@/lib/endpoints/accounts';
import { transactionGetIncomeExpenseChart, transactionGetAll } from '@/lib/endpoints/transactions';
import { categoryGetAll } from '@/lib/endpoints/category';
import { format } from 'date-fns';
import { useUrlState } from '@/hooks/useUrlState';
import { useCallback, useMemo, useState, useEffect } from 'react';
import { useDebounce } from 'use-debounce';
import { DateRange } from 'react-day-picker';

interface SearchParams {
  q?: string;
  page?: string;
  sortBy?: string;
  sortOrder?: string;
  categoryId?: string;
  isIncome?: string;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: string;
  maxAmount?: string;
  type?: string;
}

export const useAccountDetailsData = (id: string, searchParams: SearchParams) => {
  const { state, setState, handlePageChange } = useUrlState({
    page: 1,
    q: searchParams.q || '',
    sortBy: searchParams.sortBy || 'createdAt',
    sortOrder: (searchParams.sortOrder as 'asc' | 'desc') || 'desc',
    categoryId: searchParams.categoryId,
    isIncome:
      searchParams.isIncome === 'true'
        ? true
        : searchParams.isIncome === 'false'
          ? false
          : undefined,
    dateFrom: searchParams.dateFrom,
    dateTo: searchParams.dateTo,
    minAmount: searchParams.minAmount ? Number(searchParams.minAmount) : undefined,
    maxAmount: searchParams.maxAmount ? Number(searchParams.maxAmount) : undefined,
    type: (searchParams.type as 'all' | 'recurring' | 'normal') || 'all'
  });

  const [searchQuery, setSearchQuery] = useState(state.q);
  const [debouncedSearchQuery] = useDebounce(searchQuery, 600);

  useEffect(() => {
    setState({ q: debouncedSearchQuery, page: 1 });
  }, [debouncedSearchQuery, setState]);

  const dateRange = useMemo(
    () =>
      state.dateFrom && state.dateTo
        ? { from: new Date(state.dateFrom), to: new Date(state.dateTo) }
        : undefined,
    [state.dateFrom, state.dateTo]
  );

  const duration = useMemo(
    () =>
      dateRange?.from && dateRange.to
        ? `${format(dateRange.from, 'yyyy-MM-dd')},${format(dateRange.to, 'yyyy-MM-dd')}`
        : 'thisMonth',
    [dateRange]
  );

  const {
    data: account,
    isLoading: isAccountLoading,
    error: accountError,
    refetch: refetchAccount
  } = useQuery({
    queryKey: ['account', id],
    queryFn: () => accountGetById(id),
    retry: false
  });

  const {
    data: customAnalytics,
    isLoading: isAnalyticsLoading,
    refetch: refetchAnalytics
  } = useQuery({
    queryKey: ['customAnalytics', id, duration],
    queryFn: () => accountGetCustomAnalytics(id, { duration }),
    enabled: !!id
  });

  const {
    data: chartData,
    isLoading: isChartLoading,
    refetch: refetchChart
  } = useQuery({
    queryKey: ['incomeExpenseChart', id, duration],
    queryFn: () => transactionGetIncomeExpenseChart({ accountId: id, duration }),
    enabled: !!id
  });

  const {
    data: transactionsData,
    isLoading: isTransactionLoading,
    error: transactionError,
    refetch: refetchTransactions
  } = useQuery({
    queryKey: [
      'accountTransactions',
      id,
      state.page,
      state.q,
      state.sortBy,
      state.sortOrder,
      state.categoryId,
      state.isIncome,
      state.dateFrom,
      state.dateTo,
      state.minAmount,
      state.maxAmount,
      state.type
    ],
    queryFn: ({ signal }) =>
      transactionGetAll({
        accountId: id,
        duration,
        page: state.page,
        limit: 10,
        q: state.q,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder,
        categoryId: state.categoryId,
        isIncome: state.isIncome?.toString(),
        minAmount: state.minAmount,
        maxAmount: state.maxAmount,
        type: state.type === 'all' ? undefined : state.type
      })
  });

  const { data: categories } = useQuery({
    queryKey: ['transaction-categories'],
    queryFn: () => categoryGetAll({ limit: 100, sortBy: 'name', sortOrder: 'asc', page: 1 })
  });

  const refetchData = useCallback(async () => {
    await Promise.all([
      refetchAccount(),
      refetchAnalytics(),
      refetchChart(),
      refetchTransactions()
    ]);
  }, [refetchAccount, refetchAnalytics, refetchChart, refetchTransactions]);

  const handleSort = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    setState({ sortBy, sortOrder, page: 1 });
  };

  const handleCategoryChange = (categoryId: string) => {
    setState({ categoryId: categoryId === 'all' ? undefined : categoryId, page: 1 });
  };

  const handleIncomeTypeChange = (type: string) => {
    setState({
      isIncome: type === 'all' ? undefined : type === 'true',
      page: 1
    });
  };

  const handleDateRangeSelect = (range?: DateRange) => {
    setState({
      dateFrom: range?.from?.toISOString(),
      dateTo: range?.to?.toISOString(),
      page: 1
    });
  };

  const handleClearDateRange = () => {
    setState({ dateFrom: undefined, dateTo: undefined, page: 1 });
  };

  const handleAmountChange = (min?: number, max?: number) => {
    setState({ minAmount: min, maxAmount: max, page: 1 });
  };

  const handleTypeChange = (type: 'all' | 'recurring' | 'normal') => {
    setState({ type, page: 1 });
  };

  const handleResetFilters = useCallback(() => {
    setSearchQuery('');
    setState({
      q: '',
      page: 1,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      categoryId: undefined,
      isIncome: undefined,
      dateFrom: undefined,
      dateTo: undefined,
      minAmount: undefined,
      maxAmount: undefined,
      type: 'all'
    });
  }, [setState]);

  return {
    account,
    isAccountLoading,
    accountError,
    customAnalytics,
    isAnalyticsLoading,
    chartData,
    isChartLoading,
    transactionsData,
    isTransactionLoading,
    transactionError,
    refetchData,
    filters: { ...state, searchQuery, debouncedSearchQuery: state.q, dateRange },
    page: state.page,
    handlePageChange,
    setSearchQuery,
    handleSort,
    handleCategoryChange,
    handleIncomeTypeChange,
    handleDateRangeSelect,
    handleClearDateRange,
    handleResetFilters,
    handleAmountChange,
    handleTypeChange,
    categories,
    duration,
    setState
  };
};
