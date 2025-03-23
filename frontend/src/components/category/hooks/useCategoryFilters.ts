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

  // Use a ref to track if we're currently updating from URL
  const isUpdatingFromUrl = useRef(false);

  // Use a ref to track the last URL update to avoid loops
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

  const [debouncedSearchQuery] = useDebounce(filters.searchQuery, 600);

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

      // Update lastUrlUpdate ref to remember what we're changing
      Object.entries(params).forEach(([key, value]) => {
        lastUrlUpdate.current[key as keyof typeof lastUrlUpdate.current] = value || '';
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
      router.push(newUrl, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  // Handle debounced search query changes
  useEffect(() => {
    if (isUpdatingFromUrl.current) return; // Skip if updating from URL
    if (debouncedSearchQuery === lastUrlUpdate.current.q) return; // Skip if unchanged

    // Update the filters state with debounced value
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
    const urlSortOrder = searchParams.get('sortOrder') || 'asc';

    // Check if this is a change we didn't initiate
    const isSelfUpdate =
      urlQ === lastUrlUpdate.current.q &&
      urlSortBy === lastUrlUpdate.current.sortBy &&
      urlSortOrder === lastUrlUpdate.current.sortOrder;

    if (isSelfUpdate) return; // Skip our own updates

    // Update our tracking refs
    lastUrlUpdate.current = {
      q: urlQ,
      sortBy: urlSortBy,
      sortOrder: urlSortOrder
    };

    // Flag that we're updating from URL
    isUpdatingFromUrl.current = true;

    // Update state from URL
    setFilters({
      searchQuery: urlQ,
      debouncedSearchQuery: urlQ,
      sortBy: urlSortBy,
      sortOrder: urlSortOrder as 'asc' | 'desc'
    });

    // Reset flag after state update
    setTimeout(() => {
      isUpdatingFromUrl.current = false;
    }, 0);
  }, [searchParams]);

  // Handlers remain simple
  const setSearchQuery = useCallback((value: string) => {
    if (isUpdatingFromUrl.current) return; // Skip if updating from URL

    setFilters((prev) => ({
      ...prev,
      searchQuery: value
    }));
  }, []);

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
    handleSort
  };
};
