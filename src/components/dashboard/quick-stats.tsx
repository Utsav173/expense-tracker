import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

import NoData from '../ui/no-data';
import type { AccountAPI } from '@/lib/api/api-types';
import { cn, formatCurrency } from '@/lib/utils';
import { ArrowUp, ArrowDown } from 'lucide-react';
import Loader from '../ui/loader';

interface QuickStatsProps {
  data: AccountAPI.DashboardData | null | undefined;
  isLoading: boolean;
  className?: string;
}

export const QuickStats: React.FC<QuickStatsProps> = ({ data, isLoading, className }) => {
  return (
    <Card className={cn('flex h-full flex-col border-0 py-4 shadow-none', className)}>
      <CardContent className='scrollbar h-full grow space-y-3 overflow-y-auto text-sm'>
        {isLoading || !data ? (
          <Loader />
        ) : data.totalTransaction < 1 ? (
          <div className='flex h-full items-center justify-center'>
            <NoData message='No transactions recorded yet.' icon='inbox' />
          </div>
        ) : (
          <>
            <div className='flex justify-between'>
              <span className='text-muted-foreground flex items-center gap-1'>
                <ArrowUp className='text-income h-4 w-4' />
                Highest Income
              </span>
              <span className='text-income font-medium'>
                {data.mostExpensiveIncome ? formatCurrency(data.mostExpensiveIncome, 'INR') : 'N/A'}
              </span>
            </div>
            <div className='flex justify-between'>
              <span className='text-muted-foreground flex items-center gap-1'>
                <ArrowUp className='text-income/70 h-4 w-4' />
                Lowest Income
              </span>
              <span className='text-income font-medium'>
                {data.cheapestIncome ? formatCurrency(data.cheapestIncome, 'INR') : 'N/A'}
              </span>
            </div>
            <div className='flex justify-between'>
              <span className='text-muted-foreground flex items-center gap-1'>
                <ArrowDown className='text-expense h-4 w-4' />
                Highest Expense
              </span>
              <span className='text-expense font-medium'>
                {data.mostExpensiveExpense
                  ? formatCurrency(data.mostExpensiveExpense, 'INR')
                  : 'N/A'}
              </span>
            </div>
            <div className='flex justify-between'>
              <span className='text-muted-foreground flex items-center gap-1'>
                <ArrowDown className='text-expense/70 h-4 w-4' />
                Lowest Expense
              </span>
              <span className='text-expense font-medium'>
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
