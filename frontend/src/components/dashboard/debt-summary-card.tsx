'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DebtWithDetails, ApiResponse } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import NoData from '../ui/no-data';
import { Scale } from 'lucide-react';
import { getOutstandingDebts } from '@/lib/endpoints/debt';
import { Skeleton } from '../ui/skeleton';
import { useToast } from '@/lib/hooks/useToast';

type OutstandingDebtsResponse = ApiResponse<{
  data: DebtWithDetails[];
  totalCount?: number;
  totalPages?: number;
  currentPage?: number;
  pageSize?: number;
}>;

export const DebtSummaryCard: React.FC = () => {
  const { showError } = useToast();

  const { data, isLoading, error } = useQuery<OutstandingDebtsResponse>({
    queryKey: ['outstandingDebtsDashboard'],
    queryFn: () => getOutstandingDebts(),
    retry: false,
    staleTime: 10 * 60 * 1000
  });

  React.useEffect(() => {
    if (error) {
      showError(`Debt Summary Error: ${(error as Error).message}`);
    }
  }, [error, showError]);

  const outstandingDebtAmount = data?.data
    ? data.data.reduce(
        (sum: number, debtItem: DebtWithDetails) => sum + (debtItem.debts?.amount || 0),
        0
      )
    : 0;

  const numberOfDebts = data?.data?.length ?? 0;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Scale className='h-5 w-5 text-red-500' />
            Debt Summary
          </CardTitle>
          <CardDescription>Loading outstanding debts...</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4 pt-2'>
          <Skeleton className='h-6 w-3/4' />
          <Skeleton className='mt-3 h-4 w-1/4' />
        </CardContent>
      </Card>
    );
  }

  // Show error state only if not loading and an error exists
  if (!isLoading && error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Scale className='h-5 w-5 text-red-500' />
            Debt Summary
          </CardTitle>
          <CardDescription>Overview of your outstanding debts.</CardDescription>
        </CardHeader>
        <CardContent className='h-[200px]'>
          <NoData message={'Could not load debt data.'} icon='x-circle' />
        </CardContent>
      </Card>
    );
  }

  // Show "No Data" only if not loading, no error, and zero debts
  if (!isLoading && !error && numberOfDebts === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Scale className='h-5 w-5 text-red-500' />
            Debt Summary
          </CardTitle>
          <CardDescription>Overview of your outstanding debts.</CardDescription>
        </CardHeader>
        <CardContent className='h-[200px]'>
          <NoData message={'No outstanding debts found.'} icon='inbox' />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Scale className='h-5 w-5 text-red-500' />
          Debt Summary
        </CardTitle>
        <CardDescription>Total amount currently owed.</CardDescription>
      </CardHeader>
      <CardContent className='scrollbar h-[250px] space-y-3 overflow-y-auto text-sm'>
        <div>
          <p className='text-xs text-muted-foreground'>Total Outstanding Debt</p>
          <p className='text-xl font-bold text-red-600'>{formatCurrency(outstandingDebtAmount)}</p>
        </div>
        <p className='pt-2 text-xs text-muted-foreground'>Across {numberOfDebts} debt item(s).</p>
      </CardContent>
    </Card>
  );
};
