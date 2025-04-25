import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, formatCurrency } from '@/lib/utils';
import { DashboardData } from '@/lib/types';
import { ChangeIndicator } from '@/components/ui/change-indicator';
import NoData from '../ui/no-data';

interface FinancialSnapshotProps {
  data: DashboardData | null | undefined;
  isLoading: boolean;
  className?: string;
}

export const FinancialSnapshot: React.FC<FinancialSnapshotProps> = ({
  data,
  isLoading,
  className
}) => {
  if (isLoading) {
    return (
      <Card className={cn('col-span-1 sm:col-span-2 lg:col-span-4', className)}>
        <CardHeader className='p-4'>
          <Skeleton className='h-6 w-3/4' />
        </CardHeader>
        <CardContent className='flex flex-col items-center justify-center space-y-6 py-10'>
          <Skeleton className='h-10 w-4/5' />
          <div className='flex w-full justify-around pt-2'>
            <div className='space-y-2 text-center'>
              <Skeleton className='h-4 w-20' />
              <Skeleton className='h-6 w-28' />
              <Skeleton className='h-3 w-16' />
            </div>
            <div className='space-y-2 text-center'>
              <Skeleton className='h-4 w-20' />
              <Skeleton className='h-6 w-28' />
              <Skeleton className='h-3 w-16' />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className={cn('col-span-1 sm:col-span-2 lg:col-span-4', className)}>
        <CardHeader className='bg-linear-to-r from-indigo-600 to-blue-500 p-4 text-primary-foreground'>
          <CardTitle className='text-lg font-semibold'>Financial Snapshot</CardTitle>
        </CardHeader>
        <CardContent className='py-10'>
          <NoData message='Snapshot data unavailable.' icon='x-circle' />
        </CardContent>
      </Card>
    );
  }

  const primaryMetric = data.overallBalance;
  const income = data.overallIncome;
  const expense = data.overallExpense;
  const incomeChange = data.overallIncomeChange;
  const expenseChange = data.overallExpenseChange;

  return (
    <Card
      className={cn('col-span-1 overflow-hidden shadow-md sm:col-span-2 lg:col-span-4', className)}
    >
      <CardContent className='flex flex-col items-center justify-center space-y-6 py-10 text-center'>
        <p className='text-sm font-medium text-muted-foreground'>Overall Net Balance</p>
        <h2
          className={`text-4xl font-bold tracking-tight sm:text-5xl ${primaryMetric < 0 ? 'text-destructive' : 'text-foreground'}`}
        >
          {formatCurrency(primaryMetric, 'INR')}
        </h2>
        <div className='grid w-full max-w-lg grid-cols-1 gap-6 pt-2 sm:grid-cols-2'>
          <div className='text-center'>
            <p className='text-xs text-muted-foreground'>Total Income (Avg. Change)</p>
            <p className='text-xl font-semibold text-green-600'>{formatCurrency(income, 'INR')}</p>
            <ChangeIndicator change={incomeChange} />
          </div>
          <div className='text-center'>
            <p className='text-xs text-muted-foreground'>Total Expense (Avg. Change)</p>
            <p className='text-xl font-semibold text-red-600'>{formatCurrency(expense, 'INR')}</p>
            <ChangeIndicator change={expenseChange} inverse={true} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
