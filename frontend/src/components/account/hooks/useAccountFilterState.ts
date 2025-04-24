'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
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

interface LastUrlUpdate {
  q: string;
  sortBy: string;
  sortOrder: string;
  categoryId: string;
  isIncome: string;
  dateFrom: string;
  dateTo: string;
  page?: string;
}

export const useAccountFilterState = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const isUpdatingFromUrl = useRef(false);
  const lastUrlUpdate = useRef<LastUrlUpdate>({
    q: searchParams.get('q') || '',
    sortBy: searchParams.get('sortBy') || 'createdAt',
    sortOrder: searchParams.get('sortOrder') || 'desc',
    categoryId: searchParams.get('categoryId') || '',
    isIncome: searchParams.get('isIncome') || '',
    dateFrom: searchParams.get('dateFrom') || '',
    dateTo: searchParams.get('dateTo') || '',
    page: searchParams.get('page') || undefined
  });

  const initialFilters = useMemo(
    () => ({
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
    }),
    [searchParams]
  );

  const [filters, setFilters] = useState<AccountsFilters>(initialFilters);
  const [debouncedSearchQuery] = useDebounce(filters.searchQuery, 600);

  const updateURL = useCallback(
    (params: Partial<LastUrlUpdate>) => {
      const hasChanges = Object.entries(params).some(([key, value]) => {
        const currentValue = searchParams.get(key) || '';
        const newValue = value || '';
        return currentValue !== newValue;
      });

      if (!hasChanges) return;

      Object.entries(params).forEach(([key, value]) => {
        if (key in lastUrlUpdate.current) {
          (lastUrlUpdate.current as any)[key] = value || '';
        }
      });

      const newSearchParams = new URLSearchParams(searchParams.toString());

      Object.entries(params).forEach(([key, value]) => {
        if (!value) {
          newSearchParams.delete(key);
        } else {
          newSearchParams.set(key, value);
        }
      });

      const newUrl = `${pathname}?${newSearchParams.toString()}`;
      router.push(newUrl, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  useEffect(() => {
    if (isUpdatingFromUrl.current || debouncedSearchQuery === lastUrlUpdate.current.q) return;

    setFilters((prev) => ({
      ...prev,
      debouncedSearchQuery
    }));

    updateURL({
      q: debouncedSearchQuery || undefined,
      page: undefined
    });
  }, [debouncedSearchQuery, updateURL]);

  useEffect(() => {
    const urlParams = {
      q: searchParams.get('q') || '',
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: searchParams.get('sortOrder') || 'desc',
      categoryId: searchParams.get('categoryId') || '',
      isIncome: searchParams.get('isIncome') || '',
      dateFrom: searchParams.get('dateFrom') || '',
      dateTo: searchParams.get('dateTo') || '',
      page: searchParams.get('page') || undefined
    };

    const isSelfUpdate = Object.entries(urlParams).every(
      ([key, value]) => value === (lastUrlUpdate.current as any)[key]
    );

    if (isSelfUpdate) return;

    lastUrlUpdate.current = urlParams;
    isUpdatingFromUrl.current = true;

    const newDateRange =
      urlParams.dateFrom && urlParams.dateTo
        ? { from: parseISO(urlParams.dateFrom), to: parseISO(urlParams.dateTo) }
        : undefined;

    setFilters({
      searchQuery: urlParams.q,
      debouncedSearchQuery: urlParams.q,
      sortBy: urlParams.sortBy,
      sortOrder: urlParams.sortOrder as 'asc' | 'desc',
      categoryId: urlParams.categoryId || undefined,
      isIncome:
        urlParams.isIncome === 'true' ? true : urlParams.isIncome === 'false' ? false : undefined,
      dateRange: newDateRange,
      tempDateRange: newDateRange
    });

    setTimeout(() => {
      isUpdatingFromUrl.current = false;
    }, 0);
  }, [searchParams]);

  const setSearchQuery = useCallback((value: string) => {
    if (isUpdatingFromUrl.current) return;
    setFilters((prev) => ({ ...prev, searchQuery: value }));
  }, []);

  const handleCategoryChange = useCallback(
    (value: string) => {
      if (isUpdatingFromUrl.current) return;

      const newCategoryId = value === 'all' ? undefined : value;
      if (newCategoryId === lastUrlUpdate.current.categoryId) return;

      setFilters((prev) => ({ ...prev, categoryId: newCategoryId }));
      updateURL({ categoryId: newCategoryId, page: undefined });
    },
    [updateURL]
  );

  const handleIncomeTypeChange = useCallback(
    (value: string) => {
      if (isUpdatingFromUrl.current) return;

      const newIsIncome = value === 'all' ? undefined : value === 'true';
      const newIsIncomeStr = newIsIncome === undefined ? '' : String(newIsIncome);
      if (newIsIncomeStr === lastUrlUpdate.current.isIncome) return;

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
      if (isUpdatingFromUrl.current) return;

      setFilters((prev) => ({ ...prev, tempDateRange: range }));

      if (range?.from && range.to) {
        const dateFrom = format(range.from, 'yyyy-MM-dd');
        const dateTo = format(range.to, 'yyyy-MM-dd');

        if (dateFrom === lastUrlUpdate.current.dateFrom && dateTo === lastUrlUpdate.current.dateTo)
          return;

        setFilters((prev) => ({ ...prev, dateRange: range }));
        updateURL({ dateFrom, dateTo, page: undefined });
      }
    },
    [updateURL]
  );

  const handleClearDateRange = useCallback(() => {
    if (
      isUpdatingFromUrl.current ||
      (!lastUrlUpdate.current.dateFrom && !lastUrlUpdate.current.dateTo)
    )
      return;

    setFilters((prev) => ({ ...prev, dateRange: undefined, tempDateRange: undefined }));
    updateURL({ dateFrom: undefined, dateTo: undefined, page: undefined });
  }, [updateURL]);

  const handleSort = useCallback(
    (sortBy: string, sortOrder: 'asc' | 'desc') => {
      if (isUpdatingFromUrl.current) return;

      if (sortBy === lastUrlUpdate.current.sortBy && sortOrder === lastUrlUpdate.current.sortOrder)
        return;

      setFilters((prev) => ({ ...prev, sortBy, sortOrder }));
      updateURL({ sortBy, sortOrder, page: undefined });
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
