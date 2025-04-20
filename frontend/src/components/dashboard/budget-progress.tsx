import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BudgetSummaryItem } from '@/lib/types';
import { cn, formatCurrency } from '@/lib/utils';
import Loader from '../ui/loader';
import { Progress } from '../ui/progress';
import NoData from '../ui/no-data';
import { budgetGetSummary } from '@/lib/endpoints/budget';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useToast } from '@/lib/hooks/useToast';
import { CalendarRange } from 'lucide-react';
import Link from 'next/link';
import { Button } from '../ui/button';

export const BudgetProgress: React.FC<{ className?: string }> = ({ className }) => {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const { showError } = useToast();

  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  const { data, isLoading, error, isFetching } = useQuery<BudgetSummaryItem[] | null>({
    queryKey: ['budgetSummaryDashboard', selectedMonth, selectedYear],
    queryFn: () => budgetGetSummary(selectedMonth, selectedYear),
    enabled: true,
    retry: 1,
    staleTime: 5 * 60 * 1000
  });

  useEffect(() => {
    if (error) {
      showError(`Budget Error: ${(error as Error).message}`);
    }
  }, [error, showError]);

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: new Date(0, i).toLocaleString('default', { month: 'long' })
  }));
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  return (
    <Card className={cn('flex flex-col', className)}>
      <CardHeader>
        <div className='mt-2 flex flex-col items-center gap-2 sm:flex-row'>
          <Select
            value={String(selectedMonth)}
            onValueChange={(value) => setSelectedMonth(Number(value))}
            disabled={isLoading || isFetching}
          >
            <SelectTrigger className='h-8 w-full text-xs sm:w-[140px]'>
              <SelectValue placeholder='Select Month' />
            </SelectTrigger>
            <SelectContent>
              {months.map((month) => (
                <SelectItem key={month.value} value={String(month.value)}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={String(selectedYear)}
            onValueChange={(value) => setSelectedYear(Number(value))}
            disabled={isLoading || isFetching}
          >
            <SelectTrigger className='h-8 w-full text-xs sm:w-[100px]'>
              <SelectValue placeholder='Select Year' />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={String(year)}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <CardDescription className='mt-1 text-xs'>
          Spending vs. budget for the selected period.
        </CardDescription>
      </CardHeader>
      <CardContent className='scrollbar h-[250px] flex-grow space-y-4 overflow-y-auto'>
        {isLoading || isFetching ? (
          <div className='flex h-full items-center justify-center'>
            <Loader />
          </div>
        ) : error ? (
          <div className='flex h-full items-center justify-center'>
            <NoData message={'Could not load budget data.'} icon='x-circle' />
          </div>
        ) : !data || data.length === 0 ? (
          <div className='flex h-full items-center justify-center'>
            <NoData
              message={`No budgets set for ${months.find((m) => m.value === selectedMonth)?.label} ${selectedYear}.`}
              icon='inbox'
            />
          </div>
        ) : (
          data.map((item) => {
            const spent = item.actualSpend || 0;
            const budgeted = item.budgetedAmount || 0;
            const progress = budgeted > 0 ? Math.min((spent / budgeted) * 100, 100) : 0;
            const remaining = budgeted - spent;
            const isOverBudget = spent > budgeted;

            return (
              <div key={item.category || item.categoryName}>
                <div className='mb-1 flex justify-between text-sm'>
                  <span className='truncate pr-2 font-medium'>{item.categoryName}</span>
                  <span
                    className={`text-xs font-medium ${isOverBudget ? 'text-red-600' : 'text-muted-foreground'}`}
                  >
                    {formatCurrency(spent)} / {formatCurrency(budgeted)}
                  </span>
                </div>
                <Progress
                  value={progress}
                  className={`h-2 ${isOverBudget ? '[&>div]:bg-destructive' : '[&>div]:bg-lime-600'}`} // Use lime color
                />
                <p
                  className={`mt-1 text-right text-xs ${isOverBudget ? 'text-destructive' : 'text-muted-foreground'}`}
                >
                  {isOverBudget
                    ? `${formatCurrency(Math.abs(remaining))} over`
                    : `${formatCurrency(remaining)} left`}
                </p>
              </div>
            );
          })
        )}
      </CardContent>
      {!isLoading && !error && data && data.length > 0 && (
        <div className='border-t p-3 text-center'>
          <Button variant='link' size='sm' asChild className='text-xs'>
            <Link href='/budget'>Manage Budgets</Link>
          </Button>
        </div>
      )}
    </Card>
  );
};
