import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDebounce } from 'use-debounce';

interface CategoryFilters {
  searchQuery: string;
  debouncedSearchQuery: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export const useCategoryFilters = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isInitialMount = useRef(true);

  const initialSearchParams = {
    q: searchParams.get('q') || '',
    sortBy: searchParams.get('sortBy') || 'createdAt',
    sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'asc'
  };

  const [filters, setFilters] = useState<CategoryFilters>({
    searchQuery: initialSearchParams.q,
    debouncedSearchQuery: initialSearchParams.q,
    sortBy: initialSearchParams.sortBy,
    sortOrder: initialSearchParams.sortOrder
  });

  const [debouncedSearchQuery] = useDebounce(filters.searchQuery, 300);

  // Update debounced query
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

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    updateURL({ q: filters.debouncedSearchQuery || undefined });
  }, [filters.debouncedSearchQuery, updateURL]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const newQ = searchParams.get('q') || '';
    const newSortBy = searchParams.get('sortBy') || 'createdAt';
    const newSortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'asc';

    if (
      filters.searchQuery !== newQ ||
      filters.sortBy !== newSortBy ||
      filters.sortOrder !== newSortOrder
    ) {
      setFilters({
        searchQuery: newQ,
        debouncedSearchQuery: newQ,
        sortBy: newSortBy,
        sortOrder: newSortOrder
      });
    }
  }, [searchParams, filters]);

  const setSearchQuery = (value: string) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      searchQuery: value
    }));
  };

  const handleSort = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      sortBy,
      sortOrder
    }));
    updateURL({ sortBy, sortOrder });
  };

  return {
    filters,
    setSearchQuery,
    handleSort,
    updateURL
  };
};
