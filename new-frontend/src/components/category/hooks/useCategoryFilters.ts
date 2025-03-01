import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface CategoryFilters {
  searchQuery: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export const useCategoryFilters = (initialSearchParams: any) => {
  const router = useRouter();

  const [filters, setFilters] = useState<CategoryFilters>({
    searchQuery: initialSearchParams.q || '',
    sortBy: initialSearchParams.sortBy || 'createdAt',
    sortOrder: (initialSearchParams.sortOrder as 'asc' | 'desc') || 'asc'
  });

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
    setFilters((prev) => ({
      ...prev,
      searchQuery: initialSearchParams.q || '',
      sortBy: initialSearchParams.sortBy || 'createdAt',
      sortOrder: (initialSearchParams.sortOrder as 'asc' | 'desc') || 'asc'
    }));
  }, [initialSearchParams]);

  const setSearchQuery = (value: string) => {
    updateURL({ q: value || undefined });
  };

  const handleSort = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    updateURL({ sortBy, sortOrder });
  };

  return {
    filters,
    setSearchQuery,
    handleSort,
    updateURL
  };
};
