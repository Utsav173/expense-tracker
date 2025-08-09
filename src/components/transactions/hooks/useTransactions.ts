import { useState, useCallback, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { transactionGetAll } from '@/lib/endpoints/transactions';
import { useDebounce } from 'use-debounce';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { DateRange } from 'react-day-picker';
import type { TransactionAPI } from '@/lib/api/api-types';

interface Filters {
  accountId?: string;
  searchQuery: string;
  debouncedSearchQuery: string;
  categoryId?: string;
  isIncome?: boolean;
  dateRange?: DateRange;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  minAmount?: number;
  maxAmount?: number;
  type?: 'recurring' | 'normal' | 'all';
}

interface UseTransactionsReturn {
  transactionsData: TransactionAPI.GetTransactionsResponse | undefined;
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
  handleCategoryChange: (value: string | undefined) => void;
  handleIncomeTypeChange: (value: string | undefined) => void;
  handleDateRangeSelect: (range: DateRange | undefined) => void;
  handleClearDateRange: () => void;
  handleSort: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  resetFilters: () => void;
  handleAmountChange: (min?: number, max?: number) => void;
  handleTypeChange: (type: 'recurring' | 'normal' | 'all') => void;
}

export const useTransactions = (
  initialAccountId?: string,
  initialPage: number = 1
): UseTransactionsReturn => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const initialFilters = useMemo(
    () => ({
      accountId: searchParams.get('accountId') || initialAccountId,
      searchQuery: searchParams.get('q') || '',
      debouncedSearchQuery: searchParams.get('q') || '',
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
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
      minAmount: searchParams.get('minAmount') ? Number(searchParams.get('minAmount')) : undefined,
      maxAmount: searchParams.get('maxAmount') ? Number(searchParams.get('maxAmount')) : undefined,
      type: (searchParams.get('type') as 'recurring' | 'normal' | 'all') || 'all'
    }),
    [searchParams, initialAccountId]
  );

  const [page, setPage] = useState(
    searchParams.get('page') ? Number(searchParams.get('page')) : initialPage
  );
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [debouncedSearchQuery] = useDebounce(filters.searchQuery, 600);

  const updateURL = useCallback(
    (newParams: Record<string, string | number | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(newParams).forEach(([key, value]) => {
        if (value === undefined || value === '' || value === 'all') {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      });

      if (!('page' in newParams)) {
        params.delete('page');
      }
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  useEffect(() => {
    setFilters((prev) => ({ ...prev, debouncedSearchQuery }));
  }, [debouncedSearchQuery]);

  const queryKey = useMemo(
    () => [
      'transactions',
      page,
      filters.accountId,
      filters.debouncedSearchQuery,
      filters.categoryId,
      filters.isIncome,
      filters.dateRange,
      filters.sortBy,
      filters.sortOrder,
      filters.minAmount,
      filters.maxAmount,
      filters.type
    ],
    [
      page,
      filters.accountId,
      filters.debouncedSearchQuery,
      filters.categoryId,
      filters.isIncome,
      filters.dateRange,
      filters.sortBy,
      filters.sortOrder,
      filters.minAmount,
      filters.maxAmount,
      filters.type
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
          ? `${format(filters.dateRange.from, 'yyyy-MM-dd')},${format(
              filters.dateRange.to,
              'yyyy-MM-dd'
            )}`
          : undefined;

      return transactionGetAll({
        accountId: filters.accountId === 'all' ? undefined : filters.accountId,
        duration,
        page,
        limit: 10,
        q: filters.debouncedSearchQuery,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        categoryId: filters.categoryId === 'all' ? undefined : filters.categoryId,
        isIncome: filters.isIncome?.toString(),
        minAmount: filters.minAmount,
        maxAmount: filters.maxAmount,
        type: filters.type === 'all' ? undefined : filters.type
      });
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
    enabled: !filters.dateRange || (!!filters.dateRange.from && !!filters.dateRange.to)
  });

  const handlePageChange = useCallback(
    (newPage: number) => {
      setPage(newPage);
      updateURL({ page: newPage > 1 ? newPage : undefined });
    },
    [updateURL]
  );

  const setSearchQuery = useCallback((value: string) => {
    setFilters((prev) => ({ ...prev, searchQuery: value }));
  }, []);

  useEffect(() => {
    if (debouncedSearchQuery !== (searchParams.get('q') || '')) {
      updateURL({ q: debouncedSearchQuery || undefined, page: undefined });
    }
  }, [debouncedSearchQuery, searchParams, updateURL]);

  const handleAccountChange = useCallback(
    (value: string) => {
      const newAccountId = value === 'all' ? undefined : value;
      setFilters((prev) => ({ ...prev, accountId: newAccountId }));
      setPage(1);
      updateURL({ accountId: newAccountId, page: undefined });
    },
    [updateURL]
  );

  const handleCategoryChange = useCallback(
    (value: string | undefined) => {
      setFilters((prev) => ({ ...prev, categoryId: value }));
      setPage(1);
      updateURL({ categoryId: value, page: undefined });
    },
    [updateURL]
  );

  const handleIncomeTypeChange = useCallback(
    (value: string | undefined) => {
      const newIsIncome = value === 'all' ? undefined : value === 'true';
      setFilters((prev) => ({ ...prev, isIncome: newIsIncome }));
      setPage(1);
      updateURL({
        isIncome: newIsIncome === undefined ? undefined : String(newIsIncome),
        page: undefined
      });
    },
    [updateURL]
  );

  const handleDateRangeSelect = useCallback(
    (range: DateRange | undefined) => {
      let newDateRange: DateRange | undefined = undefined;
      let urlParams: { dateFrom?: string; dateTo?: string; page?: string } = { page: undefined };

      if (range?.from && range.to) {
        const startDate = new Date(range.from);
        const endDate = new Date(range.to);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        if (startDate <= endDate) {
          newDateRange = { from: startDate, to: endDate };
          urlParams.dateFrom = format(startDate, 'yyyy-MM-dd');
          urlParams.dateTo = format(endDate, 'yyyy-MM-dd');
        }
      } else {
        urlParams.dateFrom = undefined;
        urlParams.dateTo = undefined;
      }

      setFilters((prev) => ({ ...prev, dateRange: newDateRange }));
      setPage(1);
      updateURL(urlParams);
    },
    [updateURL]
  );

  const handleClearDateRange = useCallback(() => {
    setFilters((prev) => ({ ...prev, dateRange: undefined }));
    setPage(1);
    updateURL({ dateFrom: undefined, dateTo: undefined, page: undefined });
  }, [updateURL]);

  const handleSort = useCallback(
    (newSortBy: string, newSortOrder: 'asc' | 'desc') => {
      setFilters((prev) => ({ ...prev, sortBy: newSortBy, sortOrder: newSortOrder }));
      setPage(1);
      updateURL({ sortBy: newSortBy, sortOrder: newSortOrder, page: undefined });
    },
    [updateURL]
  );

  const handleAmountChange = useCallback(
    (min?: number, max?: number) => {
      setFilters((prev) => ({ ...prev, minAmount: min, maxAmount: max }));
      setPage(1);
      updateURL({ minAmount: min, maxAmount: max, page: undefined });
    },
    [updateURL]
  );

  const handleTypeChange = useCallback(
    (type: 'recurring' | 'normal' | 'all') => {
      setFilters((prev) => ({ ...prev, type }));
      setPage(1);
      updateURL({ type: type === 'all' ? undefined : type, page: undefined });
    },
    [updateURL]
  );

  const resetFilters = useCallback(() => {
    const defaultFilters: Filters = {
      accountId: initialAccountId,
      searchQuery: '',
      debouncedSearchQuery: '',
      categoryId: undefined,
      isIncome: undefined,
      dateRange: undefined,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      minAmount: undefined,
      maxAmount: undefined,
      type: 'all'
    };
    setFilters(defaultFilters);
    setPage(1);
    router.push(pathname, { scroll: false });
  }, [initialAccountId, pathname, router]);

  useEffect(() => {
    const urlPage = searchParams.get('page');
    const newPage = urlPage ? Number(urlPage) : 1;
    if (page !== newPage) {
      setPage(newPage);
    }
  }, [searchParams, page]);

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
    debouncedSearchQuery: filters.debouncedSearchQuery,
    setSearchQuery,
    handleAccountChange,
    handleCategoryChange,
    handleIncomeTypeChange,
    handleDateRangeSelect,
    handleClearDateRange,
    handleSort,
    resetFilters,
    handleAmountChange,
    handleTypeChange
  };
};
