import { useState, useEffect } from 'react';
import { DateRange } from 'react-day-picker';
import { parseISO, format } from 'date-fns';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

interface SearchParams {
  q?: string;
  sortBy?: string;
  sortOrder?: string;
  categoryId?: string;
  isIncome?: string;
  dateFrom?: string;
  dateTo?: string;
}

export const useFilterState = (
  searchParams: SearchParams,
  router: AppRouterInstance,
  accountId: string
) => {
  // State
  const [searchQuery, setSearchQuery] = useState(searchParams.q || '');
  const [sortBy, setSortBy] = useState(searchParams.sortBy || 'createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(
    (searchParams.sortOrder as 'asc' | 'desc') || 'desc'
  );
  const [categoryId, setCategoryId] = useState<string | undefined>(searchParams.categoryId);
  const [isIncome, setIsIncome] = useState<boolean | undefined>(
    searchParams.isIncome === 'true' ? true : searchParams.isIncome === 'false' ? false : undefined
  );
  const [dateRange, setDateRange] = useState<DateRange | undefined>(
    searchParams.dateFrom && searchParams.dateTo
      ? { from: parseISO(searchParams.dateFrom), to: parseISO(searchParams.dateTo) }
      : undefined
  );
  const [tempDateRange, setTempDateRange] = useState<DateRange | undefined>(dateRange);

  // URL update function
  const updateURL = (newParams: Partial<SearchParams>) => {
    const params = new URLSearchParams();

    if (newParams.q) params.set('q', newParams.q);
    if (newParams.sortBy && newParams.sortBy !== 'createdAt')
      params.set('sortBy', newParams.sortBy);
    if (newParams.sortOrder && newParams.sortOrder !== 'desc')
      params.set('sortOrder', newParams.sortOrder);
    if (newParams.categoryId) params.set('categoryId', newParams.categoryId);
    if (newParams.isIncome !== undefined) params.set('isIncome', String(newParams.isIncome));
    if (newParams.dateFrom) params.set('dateFrom', newParams.dateFrom);
    if (newParams.dateTo) params.set('dateTo', newParams.dateTo);

    router.push(`/accounts/${accountId}?${params.toString()}`, { scroll: false });
  };

  // Event handlers
  const handleCategoryChange = (value: string) => {
    const newCategoryId = value === 'all' ? undefined : value;
    setCategoryId(newCategoryId);
    updateURL({ categoryId: newCategoryId });
  };

  const handleIncomeTypeChange = (value: string) => {
    const newIsIncome = value === 'all' ? undefined : value === 'true';
    setIsIncome(newIsIncome);
    updateURL({ isIncome: newIsIncome === undefined ? undefined : String(newIsIncome) });
  };

  const handleDateRangeSelect = (range: DateRange | undefined) => {
    setTempDateRange(range);
  };

  const applyDateRange = () => {
    if (tempDateRange?.from && tempDateRange.to) {
      setDateRange(tempDateRange);
      updateURL({
        dateFrom: format(tempDateRange.from, 'yyyy-MM-dd'),
        dateTo: format(tempDateRange.to, 'yyyy-MM-dd')
      });
    }
  };

  const handleClearDateRange = () => {
    setDateRange(undefined);
    setTempDateRange(undefined);
    updateURL({ dateFrom: undefined, dateTo: undefined });
  };

  const handleSort = (field: string) => {
    if (field === sortBy) {
      const newSortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
      setSortOrder(newSortOrder);
      updateURL({ sortOrder: newSortOrder });
    } else {
      setSortBy(field);
      setSortOrder('asc');
      updateURL({ sortBy: field, sortOrder: 'asc' });
    }
  };

  // Effect to update URL when search query changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updateURL({ q: searchQuery || undefined });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  return {
    filters: {
      searchQuery,
      sortBy,
      sortOrder,
      categoryId,
      isIncome,
      dateRange,
      tempDateRange
    },
    setSearchQuery,
    handleCategoryChange,
    handleIncomeTypeChange,
    handleDateRangeSelect,
    applyDateRange,
    handleClearDateRange,
    handleSort,
    updateURL
  };
};
