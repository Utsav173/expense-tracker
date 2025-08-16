'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { dequal } from 'dequal';

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
  const stateRef = useRef(parseParams(searchParams, initialState));

  const state: T = parseParams(searchParams, initialState);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const setState = useCallback(
    (updates: Partial<T>) => {
      const currentState = stateRef.current;
      const newState = { ...currentState, ...updates };

      if (dequal(currentState, newState)) {
        return;
      }

      const newSearchParams = new URLSearchParams(searchParams.toString());

      Object.entries(newState).forEach(([key, value]) => {
        const isDefault = dequal(value, initialState[key as keyof T]);
        const isDefaultPage = key === 'page' && value === 1;

        if (value === undefined || value === null || value === '' || isDefault || isDefaultPage) {
          newSearchParams.delete(key);
        } else {
          newSearchParams.set(key, String(value));
        }
      });

      const newUrl = `${pathname}?${newSearchParams.toString()}`;
      router.replace(newUrl, { scroll: false });
    },
    [searchParams, initialState, router, pathname]
  );

  const handlePageChange = useCallback(
    (newPage: number) => {
      setState({ page: newPage } as Partial<T>);
    },
    [setState]
  );

  return {
    state,
    setState,
    handlePageChange
  };
};
