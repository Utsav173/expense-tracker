import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
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
  const pathname = usePathname();

  const isUpdatingFromUrl = useRef(false);

  const lastUrlUpdate = useRef({
    q: searchParams.get('q') || '',
    sortBy: searchParams.get('sortBy') || 'createdAt',
    sortOrder: searchParams.get('sortOrder') || 'asc'
  });

  const [filters, setFilters] = useState<CategoryFilters>({
    searchQuery: searchParams.get('q') || '',
    debouncedSearchQuery: searchParams.get('q') || '',
    sortBy: searchParams.get('sortBy') || 'createdAt',
    sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'asc'
  });

  const [debouncedSearchQuery] = useDebounce(filters.searchQuery, 1000);

  const updateURL = useCallback(
    (params: Record<string, string | undefined>) => {
      let hasChanges = false;
      for (const [key, value] of Object.entries(params)) {
        const currentValue = searchParams.get(key) || '';
        const newValue = value || '';
        if (currentValue !== newValue) {
          hasChanges = true;
          break;
        }
      }

      if (!hasChanges) return;

      Object.entries(params).forEach(([key, value]) => {
        lastUrlUpdate.current[key as keyof typeof lastUrlUpdate.current] = value || '';
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
    if (isUpdatingFromUrl.current) return;
    if (debouncedSearchQuery === lastUrlUpdate.current.q) return;

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
    const urlQ = searchParams.get('q') || '';
    const urlSortBy = searchParams.get('sortBy') || 'createdAt';
    const urlSortOrder = searchParams.get('sortOrder') || 'asc';

    const isSelfUpdate =
      urlQ === lastUrlUpdate.current.q &&
      urlSortBy === lastUrlUpdate.current.sortBy &&
      urlSortOrder === lastUrlUpdate.current.sortOrder;

    if (isSelfUpdate) return;

    lastUrlUpdate.current = {
      q: urlQ,
      sortBy: urlSortBy,
      sortOrder: urlSortOrder
    };

    isUpdatingFromUrl.current = true;

    setFilters({
      searchQuery: urlQ,
      debouncedSearchQuery: urlQ,
      sortBy: urlSortBy,
      sortOrder: urlSortOrder as 'asc' | 'desc'
    });

    setTimeout(() => {
      isUpdatingFromUrl.current = false;
    }, 0);
  }, [searchParams]);

  const setSearchQuery = useCallback((value: string) => {
    if (isUpdatingFromUrl.current) return;

    setFilters((prev) => ({
      ...prev,
      searchQuery: value
    }));
  }, []);

  const handleSort = useCallback(
    (sortBy: string, sortOrder: 'asc' | 'desc') => {
      if (isUpdatingFromUrl.current) return;
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
    handleSort
  };
};
