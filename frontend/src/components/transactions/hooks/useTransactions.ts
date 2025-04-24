import { useState, useCallback, useEffect } from 'react';
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

  const [page, setPage] = useState(initialPage);
  const [filters, setFilters] = useState<Filters>({
    accountId: initialAccountId,
    searchQuery: '',
    categoryId: undefined,
    isIncome: undefined,
    dateRange: undefined,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  const [debouncedSearchQuery] = useDebounce(filters.searchQuery, 600);

  const {
    data: transactionsData,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: [
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
    queryFn: () => {
      const duration = filters.dateRange?.from && filters.dateRange.to
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

  const updateURL = useCallback(
    (params: Partial<Record<string, string | undefined>>) => {
      const currentParams = new URLSearchParams(searchParams.toString());

      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          currentParams.set(key, value);
        } else {
          currentParams.delete(key);
        }
      });

      const newUrl = `${pathname}?${currentParams.toString()}`;
      router.push(newUrl, { scroll: false });
    },
    [router, pathname, searchParams]
  );
  const handlePageChange = useCallback(
    (newPage: number) => {
      setPage(newPage);
      updateURL({ page: newPage > 1 ? String(newPage) : undefined });
    },
    [updateURL]
  );

  const setSearchQuery = (value: string) => {
    setFilters((prevFilters) => ({ ...prevFilters, searchQuery: value }));
  };

  const handleCategoryChange = (value: string) => {
    const categoryId = value === 'all' ? undefined : value;
    setFilters((prevFilters) => ({ ...prevFilters, categoryId }));
    updateURL({ categoryId, page: undefined });
  };

  const handleIncomeTypeChange = (value: string | undefined) => {
    const isIncome = value === 'all' ? undefined : value === 'true';
    setFilters((prevFilters) => ({ ...prevFilters, isIncome }));
    updateURL({ isIncome: isIncome === undefined ? undefined : String(isIncome), page: undefined });
  };

  const handleDateRangeSelect = (range: DateRange | undefined) => {
    if ((range?.from && range.to) || !range) {
      if (range?.from && range.to) {
        const startDate = new Date(range.from);
        const endDate = new Date(range.to);
        
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);
        
        if (startDate <= endDate) {
          setFilters((prevFilters) => ({ ...prevFilters, dateRange: { from: startDate, to: endDate } }));
          updateURL({
            dateFrom: format(startDate, 'yyyy-MM-dd'),
            dateTo: format(endDate, 'yyyy-MM-dd'),
            page: undefined
          });
        }
      } else {
        setFilters((prevFilters) => ({ ...prevFilters, dateRange: undefined }));
        updateURL({ dateFrom: undefined, dateTo: undefined, page: undefined });
      }
    }
  };

  const handleClearDateRange = () => {
    setFilters((prevFilters) => ({ ...prevFilters, dateRange: undefined }));
    updateURL({ dateFrom: undefined, dateTo: undefined, page: undefined });
  };

  const handleSort = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    setFilters((prevFilters) => ({ ...prevFilters, sortBy, sortOrder }));
    updateURL({ sortBy, sortOrder, page: undefined });
  };

  const resetFilters = () => {
    setFilters({
      accountId: initialAccountId,
      searchQuery: '',
      categoryId: undefined,
      isIncome: undefined,
      dateRange: undefined,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
    setPage(1);
    router.push(pathname, { scroll: false });
  };

  useEffect(() => {
    const urlPage = searchParams.get('page') ? Number(searchParams.get('page')) : 1;
    const urlQ = searchParams.get('q') || '';
    const urlCategoryId = searchParams.get('categoryId') || undefined;
    const urlIsIncome =
      searchParams.get('isIncome') === 'true'
        ? true
        : searchParams.get('isIncome') === 'false'
          ? false
          : undefined;
    const urlDateFrom = searchParams.get('dateFrom');
    const urlDateTo = searchParams.get('dateTo');
    const urlSortBy = searchParams.get('sortBy') || 'createdAt';
    const urlSortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc';

    const newDateRange =
      urlDateFrom && urlDateTo
        ? {
            from: parseISO(urlDateFrom),
            to: parseISO(urlDateTo)
          }
        : undefined;

    setFilters({
      accountId: initialAccountId,
      searchQuery: urlQ,
      categoryId: urlCategoryId,
      isIncome: urlIsIncome,
      dateRange: newDateRange,
      sortBy: urlSortBy,
      sortOrder: urlSortOrder
    });
    setPage(urlPage);
  }, [searchParams, initialAccountId]);

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
    handleCategoryChange,
    handleIncomeTypeChange,
    handleDateRangeSelect,
    handleClearDateRange,
    handleSort,
    resetFilters
  };
};
