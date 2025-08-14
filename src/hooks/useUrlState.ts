import { useState, useCallback, useEffect, useRef } from 'react';
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

  const [state, setState] = useState<T>(() => parseParams(searchParams, initialState));

  const isUpdatingUrl = useRef(false);

  useEffect(() => {
    const newSearchParams = new URLSearchParams(searchParams.toString());
    let hasChanged = false;

    Object.entries(state).forEach(([key, value]) => {
      const valueStr = value !== undefined && value !== null ? String(value) : '';
      const initialValueStr =
        initialState[key as keyof T] !== undefined && initialState[key as keyof T] !== null
          ? String(initialState[key as keyof T])
          : '';
      const isDefault = valueStr === initialValueStr;
      const isDefaultPage = key === 'page' && value === 1;

      if (!isDefault && !isDefaultPage) {
        if (newSearchParams.get(key) !== valueStr) {
          newSearchParams.set(key, valueStr);
          hasChanged = true;
        }
      } else {
        if (newSearchParams.has(key)) {
          newSearchParams.delete(key);
          hasChanged = true;
        }
      }
    });

    if (hasChanged) {
      isUpdatingUrl.current = true;
      router.push(`${pathname}?${newSearchParams.toString()}`, { scroll: false });
      setTimeout(() => (isUpdatingUrl.current = false), 50);
    }
  }, [state, initialState, pathname, router, searchParams]);

  useEffect(() => {
    if (isUpdatingUrl.current) return;
    const stateFromUrl = parseParams(searchParams, initialState);
    if (!dequal(state, stateFromUrl)) {
      setState(stateFromUrl);
    }
  }, [searchParams, initialState, state]);

  const updateState = useCallback((updates: Partial<T>) => {
    setState((prevState) => ({ ...prevState, ...updates }));
  }, []);

  const handlePageChange = useCallback(
    (newPage: number) => {
      updateState({ page: newPage } as Partial<T>);
    },
    [updateState]
  );

  return {
    state,
    setState: updateState,
    handlePageChange
  };
};
