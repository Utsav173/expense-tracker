import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

type SortOrder = 'asc' | 'desc';

interface BaseUrlStateParams {
  page?: number;
  sortBy?: string;
  sortOrder?: SortOrder;
  q?: string;
  [key: string]: string | number | undefined | SortOrder;
}

export const useUrlState = <T extends BaseUrlStateParams>(initialState: T) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const isUpdatingFromUrl = useRef(false);
  const lastUrlUpdate = useRef<Partial<Record<keyof T, string | undefined>>>({});

  const [state, setState] = useState<T>(() => {
    const newState: Partial<T> = {};
    Object.keys(initialState).forEach((key) => {
      const urlValue = searchParams.get(key);
      if (urlValue !== null) {
        if (key === 'page' && typeof initialState[key] === 'number') {
          const numVal = Number(urlValue);
          (newState as any)[key] = isNaN(numVal) ? initialState[key] : numVal;
        } else if (key === 'sortOrder' && (urlValue === 'asc' || urlValue === 'desc')) {
          (newState as any)[key] = urlValue as SortOrder;
        } else if (typeof initialState[key] === 'number') {
          const numVal = Number(urlValue);
          (newState as any)[key] = isNaN(numVal) ? initialState[key] : numVal;
        } else {
          (newState as any)[key] = urlValue;
        }
      } else {
        (newState as any)[key] = initialState[key];
      }
      if (key in initialState) {
        lastUrlUpdate.current[key as keyof T] =
          newState[key as keyof T] !== undefined ? String(newState[key as keyof T]) : undefined;
      }
    });
    return { ...initialState, ...newState } as T;
  });

  const updateUrl = useCallback(
    (newStateUpdates: Partial<T>) => {
      if (isUpdatingFromUrl.current) return;

      const newSearchParams = new URLSearchParams(searchParams.toString());
      let hasChanges = false;

      Object.entries(newStateUpdates).forEach(([key, value]) => {
        const valueStr = value !== undefined ? String(value) : undefined;
        const currentValue = newSearchParams.get(key);

        const initialValueStr =
          initialState[key as keyof T] !== undefined
            ? String(initialState[key as keyof T])
            : undefined;

        const isDefault =
          valueStr === initialValueStr || (valueStr === undefined && initialValueStr === undefined);
        const isDefaultPage = key === 'page' && valueStr === '1';

        if (currentValue !== valueStr) {
          hasChanges = true;

          if (valueStr !== undefined && !isDefault && !isDefaultPage) {
            newSearchParams.set(key, valueStr);
          } else {
            newSearchParams.delete(key);
          }

          if (key in lastUrlUpdate.current) {
            lastUrlUpdate.current[key as keyof T] = valueStr;
          }
        }
      });

      if (hasChanges) {
        const newUrl = `${pathname}?${newSearchParams.toString()}`;
        router.push(newUrl, { scroll: false });
      }
    },
    [router, pathname, searchParams, initialState]
  );

  useEffect(() => {
    const newStateFromUrl: Partial<T> = {};
    let urlChangedExternally = false;

    Object.keys(initialState).forEach((key) => {
      const urlValue = searchParams.get(key);
      const urlValueStr = urlValue ?? undefined;
      const lastValue = lastUrlUpdate.current[key as keyof T];

      if (urlValueStr !== lastValue) {
        urlChangedExternally = true;
        let parsedValue: string | number | SortOrder | undefined;

        if (urlValue !== null) {
          if (key === 'page' && typeof initialState[key] === 'number') {
            const numVal = Number(urlValue);
            parsedValue = isNaN(numVal) ? initialState[key] : numVal;
          } else if (key === 'sortOrder' && (urlValue === 'asc' || urlValue === 'desc')) {
            parsedValue = urlValue as SortOrder;
          } else if (typeof initialState[key] === 'number') {
            const numVal = Number(urlValue);
            parsedValue = isNaN(numVal) ? initialState[key] : numVal;
          } else {
            parsedValue = urlValue;
          }
        } else {
          parsedValue = initialState[key as keyof T];
        }

        (newStateFromUrl as any)[key] = parsedValue;
        if (key in initialState) {
          lastUrlUpdate.current[key as keyof T] = urlValueStr;
        }
      }
    });

    if (urlChangedExternally) {
      isUpdatingFromUrl.current = true;
      setState((prevState) => ({ ...prevState, ...newStateFromUrl }));
      requestAnimationFrame(() => {
        isUpdatingFromUrl.current = false;
      });
    }
  }, [searchParams, initialState]);

  const updateStateAndUrl = useCallback(
    (updates: Partial<T>) => {
      if (isUpdatingFromUrl.current) return;

      let stateChanged = false;
      for (const key in updates) {
        if (updates[key as keyof T] !== state[key as keyof T]) {
          stateChanged = true;
          break;
        }
      }

      if (stateChanged) {
        setState((prevState) => ({ ...prevState, ...updates }));
      }

      updateUrl(updates);
    },
    [updateUrl, state]
  );

  const handlePageChange = useCallback(
    (newPage: number) => {
      updateStateAndUrl({ page: newPage } as Partial<T>);
    },
    [updateStateAndUrl]
  );

  return {
    state,
    setState: updateStateAndUrl,
    handlePageChange,
    updateUrl
  };
};
