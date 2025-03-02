import { useQuery } from '@tanstack/react-query';
import { accountGetById, accountGetCustomAnalytics } from '@/lib/endpoints/accounts';
import { transactionGetIncomeExpenseChart, transactionGetAll } from '@/lib/endpoints/transactions';
import { categoryGetAll } from '@/lib/endpoints/category';
import { format } from 'date-fns';
import { useAccountFilterState } from './useAccountFilterState';
import { usePagination } from '@/hooks/usePagination';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

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

export const useAccountDetails = (
  id: string,
  searchParams: SearchParams,
  router: AppRouterInstance
) => {
  const {
    filters,
    setSearchQuery,
    handleCategoryChange,
    handleIncomeTypeChange,
    handleDateRangeSelect,
    handleClearDateRange,
    handleSort,
    updateURL
  } = useAccountFilterState(searchParams, router, id);

  const { page, handlePageChange } = usePagination(Number(searchParams.page) || 1, updateURL);

  // Queries
  const {
    data: account,
    isLoading: isAccountLoading,
    isError: isAccountError,
    error: accountError
  } = useQuery({
    queryKey: ['account', id],
    queryFn: () => accountGetById(id),
    retry: false
  });

  const {
    data: customAnalytics,
    isLoading: isAnalyticsLoading,
    isError: isAnalyticsError,
    error: analyticsError
  } = useQuery({
    queryKey: ['customAnalytics', id, filters.dateRange],
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
    isError: isChartError,
    error: chartError
  } = useQuery({
    queryKey: ['incomeExpenseChart', id, filters.dateRange],
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
    isError: isTransactionError,
    error: transactionError,
    refetch: refetchTransactions
  } = useQuery({
    queryKey: [
      'accountTransactions',
      id,
      {
        dateRange: filters.dateRange,
        page,
        q: filters.debouncedSearchQuery, // Use the debounced query
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        categoryId: filters.categoryId,
        isIncome: filters.isIncome
      }
    ],
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
    handleResetFilters
  };
};
