'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { dequal } from 'dequal';
import { useDebounce } from 'use-debounce';

type SortOrder = 'asc' | 'desc';

interface BaseUrlStateParams {
  page?: number;
  sortBy?: string;
  sortOrder?: SortOrder;
  q?: string;
  [key: string]: string | number | undefined | boolean | SortOrder;
}

const parseParams = <T extends BaseUrlStateParams>(
  searchParams: URLSearchParams,
  initialState: T
): T => {
  const newState: Partial<T> = {};
  for (const key in initialState) {
    const value = searchParams.get(key);
    if (value !== null) {
      const initialValue = initialState[key];
      if (typeof initialValue === 'number') {
        const numVal = Number(value);
        (newState as any)[key] = isNaN(numVal) ? initialValue : numVal;
      } else if (typeof initialValue === 'boolean') {
        (newState as any)[key] = value === 'true';
      } else if (key === 'sortOrder' && (value === 'asc' || value === 'desc')) {
        (newState as any)[key] = value as SortOrder;
      } else {
        (newState as any)[key] = value;
      }
    }
  }
  return { ...initialState, ...newState };
};

export const useUrlState = <T extends BaseUrlStateParams>(initialState: T) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const state: T = useMemo(
    () => parseParams(searchParams, initialState),
    [searchParams, initialState]
  );

  const [searchQuery, setSearchQuery] = useState(state.q || '');
  const [debouncedSearchQuery] = useDebounce(searchQuery, 500);

  const setState = useCallback(
    (updates: Partial<T>) => {
      const currentState = parseParams(searchParams, initialState);
      const newState = { ...currentState, ...updates };

      if (dequal(currentState, newState)) return;

      const newSearchParams = new URLSearchParams(searchParams.toString());
      Object.entries(newState).forEach(([key, value]) => {
        const isDefault = dequal(value, initialState[key as keyof T]);
        if (
          value === undefined ||
          value === null ||
          value === '' ||
          (key !== 'page' && isDefault)
        ) {
          newSearchParams.delete(key);
        } else {
          newSearchParams.set(key, String(value));
        }
      });
      const newUrl = `${pathname}?${newSearchParams.toString()}`;
      router.push(newUrl, { scroll: false });
    },
    [searchParams, initialState, router, pathname]
  );

  useEffect(() => {
    if (debouncedSearchQuery !== state.q) {
      setState({ q: debouncedSearchQuery, page: 1 } as Partial<T>);
    }
  }, [debouncedSearchQuery, setState, state.q]);

  useEffect(() => {
    if (state.q !== searchQuery) {
      setSearchQuery(state.q || '');
    }
  }, [state.q]);

  const handlePageChange = useCallback(
    (newPage: number) => {
      if (newPage > 0) {
        setState({ page: newPage } as Partial<T>);
      }
    },
    [setState]
  );

  return {
    state,
    setState,
    handlePageChange,
    searchQuery,
    setSearchQuery
  };
};
