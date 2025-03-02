import { useState, useCallback, useEffect, useRef } from 'react';
import { DateRange } from 'react-day-picker';
import { parseISO, format } from 'date-fns';
import { useDebounce } from 'use-debounce';
import { useRouter, useSearchParams } from 'next/navigation';

interface CategoryFilters {
  searchQuery: string;
  debouncedSearchQuery: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  categoryId?: string;
  isIncome?: boolean;
  dateRange?: DateRange;
  tempDateRange?: DateRange;
}

export const useAccountFilterState = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isInitialMount = useRef(true);

  const initialSearchParams = {
    q: searchParams.get('q') || '',
    sortBy: searchParams.get('sortBy') || 'createdAt',
    sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
    categoryId: searchParams.get('categoryId') || undefined,
    isIncome:
      searchParams.get('isIncome') === 'true'
        ? true
        : searchParams.get('isIncome') === 'false'
          ? false
          : undefined,
    dateFrom: searchParams.get('dateFrom') || undefined,
    dateTo: searchParams.get('dateTo') || undefined
  };

  const [filters, setFilters] = useState<CategoryFilters>({
    searchQuery: initialSearchParams.q,
    debouncedSearchQuery: initialSearchParams.q,
    sortBy: initialSearchParams.sortBy,
    sortOrder: initialSearchParams.sortOrder,
    categoryId: initialSearchParams.categoryId,
    isIncome: initialSearchParams.isIncome,
    dateRange:
      initialSearchParams.dateFrom && initialSearchParams.dateTo
        ? { from: parseISO(initialSearchParams.dateFrom), to: parseISO(initialSearchParams.dateTo) }
        : undefined,
    tempDateRange:
      initialSearchParams.dateFrom && initialSearchParams.dateTo
        ? { from: parseISO(initialSearchParams.dateFrom), to: parseISO(initialSearchParams.dateTo) }
        : undefined
  });

  const [debouncedSearchQuery] = useDebounce(filters.searchQuery, 300);

  // Update the debounced search query in the filters whenever it changes
  useEffect(() => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      debouncedSearchQuery: debouncedSearchQuery
    }));
  }, [debouncedSearchQuery]);

  const updateURL = useCallback(
    (params: any) => {
      const currentParams = new URLSearchParams(window.location.search);
      Object.keys(params).forEach((key) => {
        const param = key as keyof typeof params;
        if (params[param] === undefined || params[param] === null || params[param] === '') {
          currentParams.delete(param.toString());
        } else {
          currentParams.set(param.toString(), params[param]);
        }
      });

      const newUrl = `${window.location.pathname}?${currentParams.toString()}`;
      router.replace(newUrl, { scroll: false });
    },
    [router]
  );

  // Update URL when debounced search query changes
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    updateURL({ q: filters.debouncedSearchQuery || undefined, page: undefined });
  }, [filters.debouncedSearchQuery, updateURL]);

  // Update filters when URL changes
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const newQ = searchParams.get('q') || '';
    const newSortBy = searchParams.get('sortBy') || 'createdAt';
    const newSortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc';
    const newCategoryId = searchParams.get('categoryId') || undefined;
    const newIsIncome =
      searchParams.get('isIncome') === 'true'
        ? true
        : searchParams.get('isIncome') === 'false'
          ? false
          : undefined;

    const newDateFrom = searchParams.get('dateFrom') || undefined;
    const newDateTo = searchParams.get('dateTo') || undefined;
    const newDateRange =
      newDateFrom && newDateTo
        ? { from: parseISO(newDateFrom), to: parseISO(newDateTo) }
        : undefined;
    const newTempDateRange =
      newDateFrom && newDateTo
        ? { from: parseISO(newDateFrom), to: parseISO(newDateTo) }
        : undefined;

    // Check if actual changes
    if (
      filters.searchQuery !== newQ ||
      filters.sortBy !== newSortBy ||
      filters.sortOrder !== newSortOrder ||
      filters.categoryId !== newCategoryId ||
      filters.isIncome !== newIsIncome ||
      !isDateRangesEqual(filters.dateRange, newDateRange)
    ) {
      setFilters({
        searchQuery: newQ,
        debouncedSearchQuery: newQ,
        sortBy: newSortBy,
        sortOrder: newSortOrder,
        categoryId: newCategoryId,
        isIncome: newIsIncome,
        dateRange: newDateRange,
        tempDateRange: newTempDateRange
      });
    }
  }, [searchParams, filters]);

  const setSearchQuery = (value: string) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      searchQuery: value
    }));
  };

  const handleCategoryChange = (value: string) => {
    const newCategoryId = value === 'all' ? undefined : value;
    setFilters((prevFilters) => ({
      ...prevFilters,
      categoryId: newCategoryId
    }));
    updateURL({ categoryId: newCategoryId, page: undefined });
  };

  const handleIncomeTypeChange = (value: string) => {
    const newIsIncome = value === 'all' ? undefined : value === 'true';
    setFilters((prevFilters) => ({
      ...prevFilters,
      isIncome: newIsIncome
    }));
    updateURL({
      isIncome: newIsIncome === undefined ? undefined : String(newIsIncome),
      page: undefined
    }); // Reset page
  };

  const handleDateRangeSelect = (range: DateRange | undefined) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      tempDateRange: range
    }));
    if (range?.from && range.to) {
      setFilters((prevFilters) => ({
        ...prevFilters,
        dateRange: range
      }));
      updateURL({
        dateFrom: format(range.from, 'yyyy-MM-dd'),
        dateTo: format(range.to, 'yyyy-MM-dd'),
        page: undefined // Reset page
      });
    }
  };

  const handleClearDateRange = () => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      dateRange: undefined,
      tempDateRange: undefined
    }));
    updateURL({ dateFrom: undefined, dateTo: undefined, page: undefined });
  };

  const handleSort = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      sortBy,
      sortOrder
    }));
    updateURL({ sortBy, sortOrder, page: undefined });
  };

  return {
    filters,
    setSearchQuery,
    handleCategoryChange,
    handleIncomeTypeChange,
    handleDateRangeSelect,
    handleClearDateRange,
    handleSort,
    updateURL
  };
};

// Helper function to check if date ranges are equal
function isDateRangesEqual(range1: DateRange | undefined, range2: DateRange | undefined) {
  if (range1 === range2) return true;
  if (!range1 || !range2) return false;
  return (
    range1.from?.getTime() === range2.from?.getTime() &&
    range1.to?.getTime() === range2.to?.getTime()
  );
}
