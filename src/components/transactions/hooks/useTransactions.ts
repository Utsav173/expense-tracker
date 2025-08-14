'use client';

import { useQuery } from '@tanstack/react-query';
import { transactionGetAll } from '@/lib/endpoints/transactions';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { useMemo } from 'react';
import type { TransactionAPI } from '@/lib/api/api-types';

interface UseTransactionsProps {
  page: number;
  accountId?: string | 'all';
  debouncedSearchQuery: string;
  categoryId?: string;
  isIncome?: boolean;
  dateRange?: DateRange;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  minAmount?: number;
  maxAmount?: number;
  type?: 'recurring' | 'normal' | 'all';
}

export const useTransactions = ({ page, ...filters }: UseTransactionsProps) => {
  const queryKey = useMemo(() => ['transactions', page, filters], [page, filters]);

  const duration = useMemo(
    () =>
      filters.dateRange?.from && filters.dateRange.to
        ? `${format(filters.dateRange.from, 'yyyy-MM-dd')},${format(
            filters.dateRange.to,
            'yyyy-MM-dd'
          )}`
        : undefined,
    [filters.dateRange]
  );

  return useQuery<TransactionAPI.GetTransactionsResponse>({
    queryKey,
    queryFn: () =>
      transactionGetAll({
        page,
        limit: 10,
        accountId: filters.accountId === 'all' ? undefined : filters.accountId,
        duration,
        q: filters.debouncedSearchQuery,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        categoryId: filters.categoryId === 'all' ? undefined : filters.categoryId,
        isIncome: filters.isIncome?.toString(),
        minAmount: filters.minAmount,
        maxAmount: filters.maxAmount,
        type: filters.type === 'all' ? undefined : filters.type
      }),
    staleTime: 5 * 60 * 1000,
    retry: false
  });
};
