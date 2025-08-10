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
import { formatDistanceToNowStrict, parseISO, isValid, isPast } from 'date-fns';
import Loader from '../ui/loader';
import { AlertTriangle, Clock, CheckCircle, XCircle } from 'lucide-react';

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

  // Enhanced debt analysis
  const debtAnalysis = React.useMemo(() => {
    if (!data?.data) return null;

    const debtsWithDates = data.data
      .filter((d) => d.debts?.finalDueDate)
      .map((d) => ({
        ...d,
        parsedDate: parseISO(d.debts!.finalDueDate!),
        isOverdue: isPast(parseISO(d.debts!.finalDueDate!))
      }))
      .sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime());

    const overdue = debtsWithDates.filter((d) => d.isOverdue);
    const upcoming = debtsWithDates.filter((d) => !d.isOverdue);

    return {
      nextDue: debtsWithDates[0] || null,
      overdue: overdue.length,
      upcoming: upcoming.length,
      overdueAmount: overdue.reduce((sum, d) => sum + d.debts.amount, 0)
    };
  }, [data?.data]);

  const getDueDateInfo = (dueDateStr?: string): { text: string; isOverdue: boolean } | null => {
    if (!dueDateStr) return null;
    const dueDate = parseISO(dueDateStr);
    if (!isValid(dueDate)) return null;

    const isOverdue = isPast(dueDate);
    return {
      text: formatDistanceToNowStrict(dueDate, { addSuffix: true }),
      isOverdue
    };
  };

  const getStatusIcon = (isOverdue: boolean) => {
    return isOverdue ? (
      <AlertTriangle className='text-destructive h-4 w-4' />
    ) : (
      <Clock className='text-muted-foreground h-4 w-4' />
    );
  };

  return (
    <Card className={cn('flex h-full flex-col', className)}>
      <CardContent className='flex h-full flex-col justify-center p-0'>
        <div className='my-auto px-4 py-4'>
          {isLoading ? (
            <div className='flex h-full items-center justify-center'>
              <Loader />
            </div>
          ) : error || numberOfDebts === 0 ? (
            <div className='flex h-full items-center justify-center'>
              <NoData
                message={error ? 'Could not load debt data.' : 'No outstanding debts! 🎉'}
                icon={error ? XCircle : CheckCircle}
              />
            </div>
          ) : (
            <div className='space-y-4'>
              {/* Main debt overview */}
              <div className='space-y-3'>
                <div className='flex items-baseline justify-between'>
                  <div>
                    <p className='text-destructive text-3xl font-bold'>
                      {formatCurrency(outstandingDebtAmount)}
                    </p>
                    <p className='text-muted-foreground text-sm'>
                      {numberOfDebts} outstanding {numberOfDebts === 1 ? 'debt' : 'debts'}
                    </p>
                  </div>
                  {debtAnalysis && debtAnalysis?.overdue > 0 && (
                    <div className='text-right'>
                      <div className='text-destructive flex items-center gap-1'>
                        <AlertTriangle className='h-4 w-4' />
                        <span className='text-sm font-medium'>{debtAnalysis.overdue} overdue</span>
                      </div>
                      <p className='text-muted-foreground text-xs'>
                        {formatCurrency(debtAnalysis.overdueAmount)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Status indicators */}
                {debtAnalysis && (
                  <div className='flex gap-4 text-sm'>
                    {debtAnalysis.overdue > 0 && (
                      <div className='text-destructive flex items-center gap-1'>
                        <AlertTriangle className='h-3 w-3' />
                        <span>{debtAnalysis.overdue} overdue</span>
                      </div>
                    )}
                    {debtAnalysis.upcoming > 0 && (
                      <div className='text-muted-foreground flex items-center gap-1'>
                        <Clock className='h-3 w-3' />
                        <span>{debtAnalysis.upcoming} upcoming</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Next due payment */}
              {debtAnalysis?.nextDue && (
                <div className='space-y-2'>
                  <p className='text-muted-foreground text-xs font-medium tracking-wider uppercase'>
                    Next Payment
                  </p>
                  <div className='flex items-start justify-between gap-3'>
                    <div className='min-w-0 flex-1'>
                      <p className='truncate leading-tight font-medium'>
                        {debtAnalysis.nextDue.debts.description || 'Unnamed debt'}
                      </p>
                      <div className='mt-1 flex items-center gap-2'>
                        <span className='text-destructive font-semibold'>
                          {formatCurrency(debtAnalysis.nextDue.debts.amount)}
                        </span>
                        {debtAnalysis.nextDue.debts.interestRate > 0 && (
                          <span className='text-muted-foreground text-xs'>
                            @ {debtAnalysis.nextDue.debts.interestRate}%
                          </span>
                        )}
                      </div>
                    </div>
                    <div className='flex shrink-0 items-center gap-1 text-right'>
                      {(() => {
                        const dueDateInfo = getDueDateInfo(debtAnalysis.nextDue.debts.finalDueDate);
                        if (!dueDateInfo) return null;

                        return (
                          <>
                            {getStatusIcon(dueDateInfo.isOverdue)}
                            <span
                              className={cn(
                                'text-xs',
                                dueDateInfo.isOverdue
                                  ? 'text-destructive font-medium'
                                  : 'text-muted-foreground'
                              )}
                            >
                              {dueDateInfo.text}
                            </span>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              )}

              {/* Additional context for multiple debts */}
              {numberOfDebts > 1 && (
                <div className='border-t pt-3'>
                  <div className='text-muted-foreground flex justify-between text-xs'>
                    <span>View all debts for detailed breakdown</span>
                    <span>{numberOfDebts - 1} more</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>

      {!isLoading && !error && numberOfDebts > 0 && (
        <div className='bg-muted/30 border-t p-3 text-center'>
          <Button variant='link' size='sm' asChild className='text-xs hover:underline'>
            <Link href='/debts'>Manage All Debts</Link>
          </Button>
        </div>
      )}
    </Card>
  );
};
