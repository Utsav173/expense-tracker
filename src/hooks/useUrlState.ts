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

  const prevStateRef = useRef<T>(state);
  const prevSearchParamsStringRef = useRef(searchParams.toString());

  useEffect(() => {
    const currentSearchParamsString = searchParams.toString();

    if (currentSearchParamsString !== prevSearchParamsStringRef.current) {
      const stateFromUrl = parseParams(searchParams, initialState);

      if (!dequal(state, stateFromUrl)) {
        setState(stateFromUrl);
        prevStateRef.current = stateFromUrl;
      }
    } else {
      if (!dequal(prevStateRef.current, state)) {
        const newSearchParams = new URLSearchParams();

        Object.entries(state).forEach(([key, value]) => {
          const isDefault = dequal(value, initialState[key as keyof T]);
          const isDefaultPage = key === 'page' && value === 1;

          if (
            value !== undefined &&
            value !== null &&
            value !== '' &&
            !isDefault &&
            !isDefaultPage
          ) {
            newSearchParams.set(key, String(value));
          }
        });

        router.push(`${pathname}?${newSearchParams.toString()}`, { scroll: false });
        prevStateRef.current = state;
      }
    }

    prevSearchParamsStringRef.current = currentSearchParamsString;
  }, [state, searchParams, initialState, pathname, router]);

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
