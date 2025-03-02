import { useState, useCallback, useEffect } from 'react';
import { DateRange } from 'react-day-picker';
import { parseISO, format } from 'date-fns';
import { useDebounce } from 'use-debounce';

interface CategoryFilters {
  searchQuery: string;
  debouncedSearchQuery: string; // Add this
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  categoryId?: string;
  isIncome?: boolean;
  dateRange?: DateRange;
  tempDateRange?: DateRange; // Keep this for the picker's internal state
}

export const useAccountFilterState = (initialSearchParams: any, router: any, accountId: string) => {
  const [filters, setFilters] = useState<CategoryFilters>({
    searchQuery: initialSearchParams.q || '',
    debouncedSearchQuery: initialSearchParams.q || '', // Initialize
    sortBy: initialSearchParams.sortBy || 'createdAt',
    sortOrder: (initialSearchParams.sortOrder as 'asc' | 'desc') || 'desc',
    categoryId: initialSearchParams.categoryId,
    isIncome:
      initialSearchParams.isIncome === 'true'
        ? true
        : initialSearchParams.isIncome === 'false'
          ? false
          : undefined,
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

  // Update filters from URL on initial load and when URL changes
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      searchQuery: initialSearchParams.q || '',
      debouncedSearchQuery: initialSearchParams.q || '', // Also update debounced
      sortBy: initialSearchParams.sortBy || 'createdAt',
      sortOrder: (initialSearchParams.sortOrder as 'asc' | 'desc') || 'desc',
      categoryId: initialSearchParams.categoryId,
      isIncome:
        initialSearchParams.isIncome === 'true'
          ? true
          : initialSearchParams.isIncome === 'false'
            ? false
            : undefined,
      dateRange:
        initialSearchParams.dateFrom && initialSearchParams.dateTo
          ? {
              from: parseISO(initialSearchParams.dateFrom),
              to: parseISO(initialSearchParams.dateTo)
            }
          : undefined,
      tempDateRange:
        initialSearchParams.dateFrom && initialSearchParams.dateTo
          ? {
              from: parseISO(initialSearchParams.dateFrom),
              to: parseISO(initialSearchParams.dateTo)
            }
          : undefined
    }));
  }, [initialSearchParams]);

  const setSearchQuery = (value: string) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      searchQuery: value
    }));
  };

  // Update URL when debounced search query changes
  useEffect(() => {
    updateURL({ q: filters.debouncedSearchQuery || undefined, page: undefined }); // Reset page on search
  }, [filters.debouncedSearchQuery, updateURL]);

  const handleCategoryChange = (value: string) => {
    const newCategoryId = value === 'all' ? undefined : value;
    setFilters((prevFilters) => ({
      ...prevFilters,
      categoryId: newCategoryId
    }));
    updateURL({ categoryId: newCategoryId, page: undefined }); // Reset page
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
    // Only update dateRange and URL if both from and to are present
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
