import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn, formatCurrency } from '@/lib/utils';
import { DashboardData } from '@/lib/types';
import { ChangeIndicator } from '@/components/ui/change-indicator';
import NoData from '../ui/no-data';
import Loader from '../ui/loader';

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
    return <Loader />;
  }

  if (!data) {
    return (
      <Card className={cn('col-span-1 sm:col-span-2 lg:col-span-4', className)}>
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
      className={cn(
        'col-span-1 h-full overflow-hidden shadow-md sm:col-span-2 lg:col-span-4',
        className
      )}
    >
      <CardContent className='flex flex-col items-center justify-center space-y-6 py-10 text-center'>
        <p className='text-muted-foreground text-sm font-medium'>Overall Net Balance</p>
        <h2
          className={`text-4xl font-bold tracking-tight sm:text-5xl ${
            primaryMetric < 0 ? 'text-destructive' : 'text-foreground'
          }`}
        >
          {formatCurrency(primaryMetric, 'INR')}
        </h2>
        <div className='grid w-full max-w-lg grid-cols-1 gap-6 pt-2 sm:grid-cols-2'>
          <div className='text-center'>
            <p className='text-muted-foreground text-xs'>Total Income (Avg. Change)</p>
            <p className='text-success text-xl font-semibold'>{formatCurrency(income, 'INR')}</p>
            <ChangeIndicator change={incomeChange} />
          </div>
          <div className='text-center'>
            <p className='text-muted-foreground text-xs'>Total Expense (Avg. Change)</p>
            <p className='text-destructive text-xl font-semibold'>
              {formatCurrency(expense, 'INR')}
            </p>
            <ChangeIndicator change={expenseChange} inverse={true} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
