import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { DebtWithDetails, ApiResponse } from '@/lib/types';
import { cn, formatCurrency } from '@/lib/utils';
import NoData from '../ui/no-data';
import { getOutstandingDebts } from '@/lib/endpoints/debt';
import { Skeleton } from '../ui/skeleton';
import { useToast } from '@/lib/hooks/useToast';
import { Button } from '../ui/button';
import Link from 'next/link';
import { formatDistanceToNowStrict, parseISO, isValid } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';

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
    const dueDate = parseISO(dueDateStr);
    if (!isValid(dueDate)) return null;
    return formatDistanceToNowStrict(dueDate, { addSuffix: true });
  };

  return (
    <Card className={cn('flex h-full flex-col', className)}>
      <CardContent className='flex h-full flex-col p-0'>
        <ScrollArea className='flex-1 px-4 py-4'>
          <AnimatePresence mode='wait'>
            {isLoading ? (
              <motion.div
                key='loading'
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className='space-y-4'
              >
                <Skeleton className='h-5 w-1/2' />
                <Skeleton className='h-8 w-3/4' />
                <Skeleton className='h-4 w-1/3' />
                <Skeleton className='h-4 w-1/2' />
              </motion.div>
            ) : error || numberOfDebts === 0 ? (
              <motion.div
                key='empty'
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className='flex h-full items-center justify-center'
              >
                <NoData
                  message={error ? 'Could not load debt data.' : 'No outstanding debts! 🎉'}
                  icon={error ? 'x-circle' : 'inbox'}
                />
              </motion.div>
            ) : (
              <motion.div
                key='data'
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className='space-y-4'
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className='rounded-lg border p-4 shadow-sm transition-all hover:shadow-md'
                >
                  <p className='text-2xl font-bold text-red-600'>
                    {formatCurrency(outstandingDebtAmount)}
                  </p>
                  <p className='text-muted-foreground pt-1 text-xs'>
                    Total Outstanding debts Across {numberOfDebts} item(s)
                  </p>
                </motion.div>

                {nextDueDebt && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className='rounded-lg border p-4 shadow-sm transition-all hover:shadow-md'
                  >
                    <p className='text-muted-foreground mb-2 text-xs font-medium'>
                      Next Payment Due
                    </p>
                    <div className='flex min-w-0 flex-col gap-2'>
                      <div className='truncate font-medium break-words'>
                        {nextDueDebt.debts.description}
                      </div>
                      <div className='flex items-baseline justify-between'>
                        <span className='text-sm font-semibold text-red-600'>
                          {formatCurrency(nextDueDebt.debts.amount)}
                        </span>
                        <span className='text-muted-foreground text-xs'>
                          {getDueDateInfo(nextDueDebt.debts.dueDate)}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </ScrollArea>
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
