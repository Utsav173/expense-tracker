import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DebtWithDetails, ApiResponse } from '@/lib/types';
import { cn, formatCurrency } from '@/lib/utils';
import NoData from '../ui/no-data';
import { Scale } from 'lucide-react';
import { getOutstandingDebts } from '@/lib/endpoints/debt';
import { Skeleton } from '../ui/skeleton';
import { useToast } from '@/lib/hooks/useToast';
import { Button } from '../ui/button';
import Link from 'next/link';
import { formatDistanceToNowStrict, parseISO, isValid } from 'date-fns';

type OutstandingDebtsResponse = ApiResponse<{
  data: DebtWithDetails[];
  totalCount?: number;
}>;

export const DebtSummaryCard: React.FC<{
  className?: string;
}> = ({ className }) => {
  const { showError } = useToast();

  const { data, isLoading, error } = useQuery<OutstandingDebtsResponse>({
    queryKey: ['outstandingDebtsDashboard'],
    queryFn: () => getOutstandingDebts(),
    retry: 1,
    staleTime: 10 * 60 * 1000
  });

  React.useEffect(() => {
    if (error) {
      showError(`Debt Summary Error: ${(error as Error).message}`);
    }
  }, [error, showError]);

  const outstandingDebtAmount =
    data?.data?.reduce((sum, debtItem) => sum + (debtItem.debts?.amount || 0), 0) ?? 0;

  const numberOfDebts = data?.data?.length ?? 0;

  const nextDueDebt = data?.data
    ?.filter((d) => d.debts?.dueDate)
    .sort(
      (a, b) => new Date(a.debts!.dueDate!).getTime() - new Date(b.debts!.dueDate!).getTime()
    )[0];

  const getDueDateInfo = (dueDateStr?: string): string | null => {
    if (!dueDateStr) return null;
    const dueDate = parseISO(dueDateStr); // Handles 'YYYY-MM-DD' correctly
    if (!isValid(dueDate)) return null;
    return formatDistanceToNowStrict(dueDate, { addSuffix: true });
  };

  if (isLoading) {
    return (
      <Card className={cn('col-span-1 md:col-span-1', className)}>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Scale className='h-5 w-5 text-red-500' />
            Debt Summary
          </CardTitle>
          <Skeleton className='h-4 w-3/5' />
        </CardHeader>
        <CardContent className='h-[250px] space-y-4 pt-2'>
          <Skeleton className='h-5 w-1/2' />
          <Skeleton className='h-8 w-3/4' />
          <Skeleton className='h-4 w-1/3' />
          <Skeleton className='h-4 w-1/2' />
        </CardContent>
      </Card>
    );
  }

  if (error || numberOfDebts === 0) {
    return (
      <Card className='col-span-1 flex flex-col md:col-span-1'>
        <CardContent className='h-[250px] flex-grow'>
          <NoData
            message={error ? 'Could not load debt data.' : 'No outstanding debts! 🎉'}
            icon={error ? 'x-circle' : 'inbox'}
          />
        </CardContent>
        {!error && numberOfDebts === 0 && (
          <div className='border-t p-3 text-center'>
            <Button variant='link' size='sm' asChild className='text-xs'>
              <Link href='/debts'>Add Debts</Link>
            </Button>
          </div>
        )}
      </Card>
    );
  }

  return (
    <Card className='col-span-1 flex flex-col py-4 md:col-span-1'>
      <CardContent className='scrollbar h-[250px] flex-grow space-y-3 overflow-y-auto text-sm'>
        <div>
          <p className='text-xl font-bold text-red-600'>{formatCurrency(outstandingDebtAmount)}</p>
          <p className='pt-1 text-xs text-muted-foreground'>
            Total Outstanding debts Across {numberOfDebts} item(s).
          </p>
        </div>
        {nextDueDebt && (
          <div className='mt-3 border-t pt-3'>
            <p className='mb-1 text-xs text-muted-foreground'>Next Payment Due</p>
            <div className='flex items-baseline justify-between'>
              <span className='truncate pr-2 font-medium'>{nextDueDebt.debts.description}</span>
              <span className='text-sm font-semibold'>
                {formatCurrency(nextDueDebt.debts.amount)}
              </span>
            </div>
            <p className='text-right text-xs text-muted-foreground'>
              {getDueDateInfo(nextDueDebt.debts.dueDate)}
            </p>
          </div>
        )}
      </CardContent>
      <div className='border-t p-3 text-center'>
        <Button variant='link' size='sm' asChild className='text-xs'>
          <Link href='/debts'>Manage Debts</Link>
        </Button>
      </div>
    </Card>
  );
};
