import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import NoData from '../ui/no-data';
import { DashboardData } from '@/lib/types';
import { cn, formatCurrency } from '@/lib/utils';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface QuickStatsProps {
  data: DashboardData | null | undefined;
  isLoading: boolean;
  className?: string;
}

export const QuickStats: React.FC<QuickStatsProps> = ({ data, isLoading, className }) => {
  return (
    <Card className={cn('flex flex-col py-4', className)}>
      <CardContent className='scrollbar h-full grow space-y-3 overflow-y-auto text-sm'>
        {isLoading || !data ? (
          <>
            {[...Array(4)].map((_, i) => (
              <div key={i} className='flex justify-between'>
                <Skeleton className='h-4 w-1/3' />
                <Skeleton className='h-4 w-1/4' />
              </div>
            ))}
            <Skeleton className='mt-4 h-4 w-1/2' />
            <Skeleton className='h-3 w-full' />
            <Skeleton className='h-3 w-full' />
          </>
        ) : data.totalTransaction < 1 ? (
          <div className='flex h-full items-center justify-center'>
            <NoData message='No transactions recorded yet.' icon='inbox' />
          </div>
        ) : (
          <>
            <div className='flex justify-between'>
              <span className='text-muted-foreground flex items-center gap-1'>
                <ArrowUp className='h-4 w-4 text-green-500' />
                Highest Income
              </span>
              <span className='font-medium text-green-600'>
                {data.mostExpensiveIncome ? formatCurrency(data.mostExpensiveIncome, 'INR') : 'N/A'}
              </span>
            </div>
            <div className='flex justify-between'>
              <span className='text-muted-foreground flex items-center gap-1'>
                <ArrowUp className='h-4 w-4 text-green-500/70' />
                Lowest Income
              </span>
              <span className='font-medium text-green-500'>
                {data.cheapestIncome ? formatCurrency(data.cheapestIncome, 'INR') : 'N/A'}
              </span>
            </div>
            <div className='flex justify-between'>
              <span className='text-muted-foreground flex items-center gap-1'>
                <ArrowDown className='h-4 w-4 text-red-500' />
                Highest Expense
              </span>
              <span className='font-medium text-red-600'>
                {data.mostExpensiveExpense
                  ? formatCurrency(data.mostExpensiveExpense, 'INR')
                  : 'N/A'}
              </span>
            </div>
            <div className='flex justify-between'>
              <span className='text-muted-foreground flex items-center gap-1'>
                <ArrowDown className='h-4 w-4 text-red-500/70' />
                Lowest Expense
              </span>
              <span className='font-medium text-red-500'>
                {data.cheapestExpense ? formatCurrency(data.cheapestExpense, 'INR') : 'N/A'}
              </span>
            </div>
            {data?.transactionsCountByAccount &&
              Object.keys(data.transactionsCountByAccount).length > 0 && (
                <div className='pt-2'>
                  <p className='text-muted-foreground mb-1 font-medium'>Transactions / Account:</p>
                  <ul className='text-muted-foreground space-y-1 text-xs'>
                    {Object.entries(data.transactionsCountByAccount)
                      .slice(0, 4)
                      .map(([accountName, count]) => (
                        <li key={accountName} className='flex justify-between'>
                          <span className='truncate pr-2'>{accountName}:</span>
                          <span className='shrink-0 font-medium'>{count}</span>
                        </li>
                      ))}
                    {Object.keys(data.transactionsCountByAccount).length > 4 && (
                      <li className='text-center italic'>... and more</li>
                    )}
                  </ul>
                </div>
              )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
