import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import type { DebtAndInterestAPI } from '@/lib/api/api-types';
import { cn, formatCurrency } from '@/lib/utils';
import NoData from '../ui/no-data';
import { getOutstandingDebts } from '@/lib/endpoints/debt';
import { useToast } from '@/lib/hooks/useToast';
import { Button } from '../ui/button';
import Link from 'next/link';
import { formatDistanceToNowStrict, parseISO, isValid } from 'date-fns';
import Loader from '../ui/loader';

export const DebtSummaryCard: React.FC<{
  className?: string;
}> = ({ className }) => {
  const { showError } = useToast();

  const { data, isLoading, error } = useQuery<DebtAndInterestAPI.GetDebtsResponse>({
    queryKey: ['outstandingDebtsDashboard'],
    queryFn: () => getOutstandingDebts(),
    retry: 1,
    staleTime: 10 * 60 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: true
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
    ?.filter((d) => d.debts?.finalDueDate)
    .sort(
      (a, b) =>
        new Date(a.debts!.finalDueDate!).getTime() - new Date(b.debts!.finalDueDate!).getTime()
    )[0];

  const getDueDateInfo = (dueDateStr?: string): string | null => {
    if (!dueDateStr) return null;
    const dueDate = parseISO(dueDateStr);
    if (!isValid(dueDate)) return null;
    return formatDistanceToNowStrict(dueDate, { addSuffix: true });
  };

  return (
    <Card className={cn('flex h-full flex-col', className)}>
      <CardContent className='flex h-full flex-col p-0'>
        <div className='flex-1 px-4 py-4'>
          {isLoading ? (
            <div className='flex h-full items-center justify-center'>
              <Loader />
            </div>
          ) : error || numberOfDebts === 0 ? (
            <div className='flex h-full items-center justify-center'>
              <NoData
                message={error ? 'Could not load debt data.' : 'No outstanding debts! 🎉'}
                icon={error ? 'x-circle' : 'inbox'}
              />
            </div>
          ) : (
            <div className='space-y-4'>
              <div className='rounded-lg border p-4 shadow-sm transition-all hover:shadow-md'>
                <p className='text-2xl font-bold text-red-600'>
                  {formatCurrency(outstandingDebtAmount)}
                </p>
                <p className='text-muted-foreground pt-1 text-xs'>
                  Total Outstanding debts Across {numberOfDebts} item(s)
                </p>
              </div>

              {nextDueDebt && (
                <div className='rounded-lg border p-4 shadow-sm transition-all hover:shadow-md'>
                  <p className='text-muted-foreground mb-2 text-xs font-medium'>Next Payment Due</p>
                  <div className='flex min-w-0 flex-col gap-2'>
                    <div className='truncate font-medium break-words'>
                      {nextDueDebt.debts.description}
                    </div>
                    <div className='flex items-baseline justify-between'>
                      <span className='text-sm font-semibold text-red-600'>
                        {formatCurrency(nextDueDebt.debts.amount)}
                      </span>
                      <span className='text-muted-foreground text-xs'>
                        {getDueDateInfo(nextDueDebt.debts.finalDueDate)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
      {!isLoading && !error && numberOfDebts > 0 && (
        <div className='border-t p-3 text-center'>
          <Button variant='link' size='sm' asChild className='text-xs'>
            <Link href='/debts'>Manage Debts</Link>
          </Button>
        </div>
      )}
    </Card>
  );
};
