import { useState, useCallback, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { transactionGetAll } from '@/lib/endpoints/transactions';
import { useDebounce } from 'use-debounce';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { TransactionsResponse } from '@/lib/types';

interface Filters {
  accountId?: string;
  searchQuery: string;
  categoryId?: string;
  isIncome?: boolean;
  dateRange?: DateRange;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface UseTransactionsReturn {
  transactionsData: TransactionsResponse | undefined;
  isLoading: boolean;
  isError: boolean;
  error: any;
  refetch: () => void;
  page: number;
  handlePageChange: (newPage: number) => void;
  filters: Filters;
  debouncedSearchQuery: string;
  setSearchQuery: (value: string) => void;
  handleAccountChange: (value: string) => void;
  handleCategoryChange: (value: string) => void;
  handleIncomeTypeChange: (value: string | undefined) => void;
  handleDateRangeSelect: (range: DateRange | undefined) => void;
  handleClearDateRange: () => void;
  handleSort: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  resetFilters: () => void;
}

export const useTransactions = (
  initialAccountId?: string,
  initialPage: number = 1
): UseTransactionsReturn => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Memoize initial filter state from URL params
  const initialFilters = useMemo(
    () => ({
      accountId: searchParams.get('accountId') || initialAccountId,
      searchQuery: searchParams.get('q') || '',
      categoryId: searchParams.get('categoryId') || undefined,
      isIncome:
        searchParams.get('isIncome') === 'true'
          ? true
          : searchParams.get('isIncome') === 'false'
            ? false
            : undefined,
      dateRange:
        searchParams.get('dateFrom') && searchParams.get('dateTo')
          ? {
              from: parseISO(searchParams.get('dateFrom')!),
              to: parseISO(searchParams.get('dateTo')!)
            }
          : undefined,
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc'
    }),
    [searchParams, initialAccountId]
  );

  const [page, setPage] = useState(
    searchParams.get('page') ? Number(searchParams.get('page')) : initialPage
  );
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [debouncedSearchQuery] = useDebounce(filters.searchQuery, 600);

  const updateURL = useCallback(
    (newParams: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());

      // Preserve existing params that aren't being updated
      Object.entries(newParams).forEach(([key, value]) => {
        if (value === undefined || value === '') {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });

      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  const queryKey = useMemo(
    () => [
      'transactions',
      page,
      filters.accountId,
      debouncedSearchQuery,
      filters.categoryId,
      filters.isIncome,
      filters.dateRange,
      filters.sortBy,
      filters.sortOrder
    ],
    [
      page,
      filters.accountId,
      debouncedSearchQuery,
      filters.categoryId,
      filters.isIncome,
      filters.dateRange,
      filters.sortBy,
      filters.sortOrder
    ]
  );

  const {
    data: transactionsData,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey,
    queryFn: () => {
      const duration =
        filters.dateRange?.from && filters.dateRange.to
          ? `${format(filters.dateRange.from, 'yyyy-MM-dd')},${format(filters.dateRange.to, 'yyyy-MM-dd')}`
          : undefined;

      return transactionGetAll({
        accountId: filters.accountId === 'all' ? '' : filters.accountId,
        duration,
        page,
        pageSize: 10,
        q: debouncedSearchQuery,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        categoryId: filters.categoryId === 'all' ? '' : filters.categoryId,
        isIncome: filters.isIncome
      });
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
    enabled: !filters.dateRange || (!!filters.dateRange.from && !!filters.dateRange.to)
  });

  const handlePageChange = useCallback(
    (newPage: number) => {
      setPage(newPage);
      updateURL({ page: String(newPage) });
    },
    [updateURL]
  );

  const setSearchQuery = useCallback(
    (value: string) => {
      setFilters((prev) => ({ ...prev, searchQuery: value }));
      updateURL({ q: value || undefined, page: undefined });
    },
    [updateURL]
  );

  const handleAccountChange = useCallback(
    (value: string) => {
      const newAccountId = value === 'all' ? undefined : value;
      setFilters((prev) => ({ ...prev, accountId: newAccountId }));
      updateURL({ accountId: newAccountId, page: undefined });
    },
    [updateURL]
  );

  const handleCategoryChange = useCallback(
    (value: string) => {
      const newCategoryId = value === 'all' ? undefined : value;
      setFilters((prev) => ({ ...prev, categoryId: newCategoryId }));
      updateURL({ categoryId: newCategoryId, page: undefined });
    },
    [updateURL]
  );

  const handleIncomeTypeChange = useCallback(
    (value: string | undefined) => {
      const newIsIncome = value === 'all' ? undefined : value === 'true';
      setFilters((prev) => ({ ...prev, isIncome: newIsIncome }));
      updateURL({
        isIncome: newIsIncome === undefined ? undefined : String(newIsIncome),
        page: undefined
      });
    },
    [updateURL]
  );

  const handleDateRangeSelect = useCallback(
    (range: DateRange | undefined) => {
      if (range?.from && range.to) {
        const startDate = new Date(range.from);
        const endDate = new Date(range.to);

        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);

        if (startDate <= endDate) {
          setFilters((prev) => ({ ...prev, dateRange: { from: startDate, to: endDate } }));
          updateURL({
            dateFrom: format(startDate, 'yyyy-MM-dd'),
            dateTo: format(endDate, 'yyyy-MM-dd'),
            page: undefined
          });
        }
      } else {
        setFilters((prev) => ({ ...prev, dateRange: undefined }));
        updateURL({ dateFrom: undefined, dateTo: undefined, page: undefined });
      }
    },
    [updateURL]
  );

  const handleClearDateRange = useCallback(() => {
    setFilters((prev) => ({ ...prev, dateRange: undefined }));
    updateURL({ dateFrom: undefined, dateTo: undefined, page: undefined });
  }, [updateURL]);

  const handleSort = useCallback(
    (sortBy: string, sortOrder: 'asc' | 'desc') => {
      setFilters((prev) => ({ ...prev, sortBy, sortOrder }));
      updateURL({ sortBy, sortOrder, page: undefined });
    },
    [updateURL]
  );

  const resetFilters = useCallback(() => {
    const defaultFilters: Filters = {
      accountId: initialAccountId,
      searchQuery: '',
      categoryId: undefined,
      isIncome: undefined,
      dateRange: undefined,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    };
    setFilters(defaultFilters);
    setPage(1);
    router.push(pathname, { scroll: false });
  }, [initialAccountId, pathname, router]);

  // Sync filters with URL params
  useEffect(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  return {
    transactionsData,
    isLoading,
    isError,
    error,
    refetch,
    page,
    handlePageChange,
    filters,
    debouncedSearchQuery,
    setSearchQuery,
    handleAccountChange,
    handleCategoryChange,
    handleIncomeTypeChange,
    handleDateRangeSelect,
    handleClearDateRange,
    handleSort,
    resetFilters
  };
};
