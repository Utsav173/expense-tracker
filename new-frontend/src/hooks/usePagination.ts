import { useState, useCallback, useEffect } from 'react';

export const usePagination = (initialPage: number, updateURL: (params: any) => void) => {
  const [page, setPage] = useState(initialPage);

  const handlePageChange = useCallback(
    (newPage: number) => {
      if (page !== newPage) {
        setPage(newPage);
        updateURL({ page: newPage > 1 ? String(newPage) : undefined });
      }
    },
    [page, updateURL]
  );

  useEffect(() => {
    setPage(initialPage);
  }, [initialPage]);

  return {
    page,
    handlePageChange
  };
};
