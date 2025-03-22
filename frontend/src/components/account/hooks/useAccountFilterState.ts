'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { DateRange } from 'react-day-picker';
import { parseISO, format } from 'date-fns';
import { useDebounce } from 'use-debounce';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

interface AccountsFilters {
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
  const pathname = usePathname();

  // Track if we're updating from URL to prevent loops
  const isUpdatingFromUrl = useRef(false);

  // Track last URL update to avoid redundant changes
  const lastUrlUpdate = useRef({
    q: searchParams.get('q') || '',
    sortBy: searchParams.get('sortBy') || 'createdAt',
    sortOrder: searchParams.get('sortOrder') || 'desc',
    categoryId: searchParams.get('categoryId') || '',
    isIncome: searchParams.get('isIncome') || '',
    dateFrom: searchParams.get('dateFrom') || '',
    dateTo: searchParams.get('dateTo') || ''
  });

  const [filters, setFilters] = useState<AccountsFilters>({
    searchQuery: searchParams.get('q') || '',
    debouncedSearchQuery: searchParams.get('q') || '',
    sortBy: searchParams.get('sortBy') || 'createdAt',
    sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
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
    tempDateRange:
      searchParams.get('dateFrom') && searchParams.get('dateTo')
        ? {
            from: parseISO(searchParams.get('dateFrom')!),
            to: parseISO(searchParams.get('dateTo')!)
          }
        : undefined
  });

  const [debouncedSearchQuery] = useDebounce(filters.searchQuery, 300);

  // Safe URL update that prevents cycles
  const updateURL = useCallback(
    (params: Record<string, string | undefined>) => {
      // Check if this would actually change anything
      let hasChanges = false;
      for (const [key, value] of Object.entries(params)) {
        const currentValue = searchParams.get(key) || '';
        const newValue = value || '';
        if (currentValue !== newValue) {
          hasChanges = true;
          break;
        }
      }

      if (!hasChanges) return; // Skip if no changes

      // Update tracking ref with new values
      Object.entries(params).forEach(([key, value]) => {
        if (key in lastUrlUpdate.current) {
          (lastUrlUpdate.current as any)[key] = value || '';
        }
      });

      // Update the URL
      const newSearchParams = new URLSearchParams(searchParams.toString());

      Object.entries(params).forEach(([key, value]) => {
        if (!value) {
          newSearchParams.delete(key);
        } else {
          newSearchParams.set(key, value);
        }
      });

      const newUrl = `${pathname}?${newSearchParams.toString()}`;
      router.push(newUrl, { scroll: true });
    },
    [router, pathname, searchParams]
  );

  // Handle debounced search query changes
  useEffect(() => {
    if (isUpdatingFromUrl.current) return; // Skip if we're updating from URL
    if (debouncedSearchQuery === lastUrlUpdate.current.q) return; // Skip if unchanged

    // Update filters state with debounced value
    setFilters((prev) => ({
      ...prev,
      debouncedSearchQuery
    }));

    // Update URL
    updateURL({
      q: debouncedSearchQuery || undefined,
      page: undefined
    });
  }, [debouncedSearchQuery, updateURL]);

  // Sync from URL changes
  useEffect(() => {
    const urlQ = searchParams.get('q') || '';
    const urlSortBy = searchParams.get('sortBy') || 'createdAt';
    const urlSortOrder = searchParams.get('sortOrder') || 'desc';
    const urlCategoryId = searchParams.get('categoryId') || '';
    const urlIsIncome = searchParams.get('isIncome') || '';
    const urlDateFrom = searchParams.get('dateFrom') || '';
    const urlDateTo = searchParams.get('dateTo') || '';

    // Check if this is a change we didn't initiate
    const isSelfUpdate =
      urlQ === lastUrlUpdate.current.q &&
      urlSortBy === lastUrlUpdate.current.sortBy &&
      urlSortOrder === lastUrlUpdate.current.sortOrder &&
      urlCategoryId === lastUrlUpdate.current.categoryId &&
      urlIsIncome === lastUrlUpdate.current.isIncome &&
      urlDateFrom === lastUrlUpdate.current.dateFrom &&
      urlDateTo === lastUrlUpdate.current.dateTo;

    if (isSelfUpdate) return; // Skip our own updates

    // Update tracking refs
    lastUrlUpdate.current = {
      q: urlQ,
      sortBy: urlSortBy,
      sortOrder: urlSortOrder,
      categoryId: urlCategoryId,
      isIncome: urlIsIncome,
      dateFrom: urlDateFrom,
      dateTo: urlDateTo
    };

    // Flag that we're updating from URL
    isUpdatingFromUrl.current = true;

    // Parse date range from URL if present
    const newDateRange =
      urlDateFrom && urlDateTo
        ? { from: parseISO(urlDateFrom), to: parseISO(urlDateTo) }
        : undefined;

    // Update state from URL
    setFilters({
      searchQuery: urlQ,
      debouncedSearchQuery: urlQ,
      sortBy: urlSortBy,
      sortOrder: urlSortOrder as 'asc' | 'desc',
      categoryId: urlCategoryId || undefined,
      isIncome: urlIsIncome === 'true' ? true : urlIsIncome === 'false' ? false : undefined,
      dateRange: newDateRange,
      tempDateRange: newDateRange
    });

    // Reset flag after state update
    setTimeout(() => {
      isUpdatingFromUrl.current = false;
    }, 0);
  }, [searchParams]);

  // All handlers should check isUpdatingFromUrl
  const setSearchQuery = useCallback((value: string) => {
    if (isUpdatingFromUrl.current) return; // Skip if updating from URL

    setFilters((prev) => ({
      ...prev,
      searchQuery: value
    }));
  }, []);

  const handleCategoryChange = useCallback(
    (value: string) => {
      if (isUpdatingFromUrl.current) return; // Skip if updating from URL

      const newCategoryId = value === 'all' ? undefined : value;
      if (newCategoryId === lastUrlUpdate.current.categoryId) return;

      setFilters((prev) => ({
        ...prev,
        categoryId: newCategoryId
      }));

      updateURL({
        categoryId: newCategoryId,
        page: undefined
      });
    },
    [updateURL]
  );

  const handleIncomeTypeChange = useCallback(
    (value: string) => {
      if (isUpdatingFromUrl.current) return; // Skip if updating from URL

      const newIsIncome = value === 'all' ? undefined : value === 'true';
      const newIsIncomeStr = newIsIncome === undefined ? '' : String(newIsIncome);
      if (newIsIncomeStr === lastUrlUpdate.current.isIncome) return;

      setFilters((prev) => ({
        ...prev,
        isIncome: newIsIncome
      }));

      updateURL({
        isIncome: newIsIncome === undefined ? undefined : String(newIsIncome),
        page: undefined
      });
    },
    [updateURL]
  );

  const handleDateRangeSelect = useCallback(
    (range: DateRange | undefined) => {
      if (isUpdatingFromUrl.current) return; // Skip if updating from URL

      // Always update temp range
      setFilters((prev) => ({
        ...prev,
        tempDateRange: range
      }));

      // Only update URL if range is complete
      if (range?.from && range.to) {
        const dateFrom = format(range.from, 'yyyy-MM-dd');
        const dateTo = format(range.to, 'yyyy-MM-dd');

        if (dateFrom === lastUrlUpdate.current.dateFrom && dateTo === lastUrlUpdate.current.dateTo)
          return;

        setFilters((prev) => ({
          ...prev,
          dateRange: range
        }));

        updateURL({
          dateFrom,
          dateTo,
          page: undefined
        });
      }
    },
    [updateURL]
  );

  const handleClearDateRange = useCallback(() => {
    if (isUpdatingFromUrl.current) return; // Skip if updating from URL

    if (!lastUrlUpdate.current.dateFrom && !lastUrlUpdate.current.dateTo) return;

    setFilters((prev) => ({
      ...prev,
      dateRange: undefined,
      tempDateRange: undefined
    }));

    updateURL({
      dateFrom: undefined,
      dateTo: undefined,
      page: undefined
    });
  }, [updateURL]);

  const handleSort = useCallback(
    (sortBy: string, sortOrder: 'asc' | 'desc') => {
      if (isUpdatingFromUrl.current) return; // Skip if updating from URL

      if (sortBy === lastUrlUpdate.current.sortBy && sortOrder === lastUrlUpdate.current.sortOrder)
        return;

      setFilters((prev) => ({
        ...prev,
        sortBy,
        sortOrder
      }));

      updateURL({
        sortBy,
        sortOrder,
        page: undefined
      });
    },
    [updateURL]
  );

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
