import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
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
    <Card className={cn('flex h-full flex-col', className)}>
      <div className='flex items-center gap-2 p-4'>
        <Select
          value={String(selectedMonth)}
          onValueChange={(value) => setSelectedMonth(Number(value))}
          disabled={isLoading || isFetching}
        >
          <SelectTrigger className='h-8 w-[120px] text-xs'>
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
          <SelectTrigger className='h-8 w-[100px] text-xs'>
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
      <CardContent className='h-auto max-h-[60vh] w-full flex-1 overflow-y-auto p-0'>
        {isLoading || isFetching ? (
          <div className='flex h-full items-center justify-center'>
            <Loader />
          </div>
        ) : error ? (
          <div className='flex h-full items-center justify-center py-8'>
            <NoData message={'Could not load budget data.'} icon='x-circle' />
          </div>
        ) : !data || data.length === 0 ? (
          <div className='flex h-full items-center justify-center py-8'>
            <NoData
              message={`No budgets set for ${months.find((m) => m.value === selectedMonth)?.label} ${selectedYear}.`}
              icon='inbox'
            />
          </div>
        ) : (
          <div className='space-y-4 px-4 py-2'>
            {data.map((item) => {
              const spent = item.actualSpend || 0;
              const budgeted = item.budgetedAmount || 0;
              const progress = budgeted > 0 ? Math.min((spent / budgeted) * 100, 100) : 0;
              const remaining = budgeted - spent;
              const isOverBudget = spent > budgeted;

              return (
                <div
                  key={item.category || item.categoryName}
                  className='rounded-lg border p-3 shadow-sm transition-all hover:shadow-md'
                >
                  <div className='mb-2 flex justify-between text-sm'>
                    <span className='truncate pr-2 font-medium'>{item.categoryName}</span>
                    <span
                      className={`text-xs font-medium ${
                        isOverBudget ? 'text-red-600' : 'text-muted-foreground'
                      }`}
                    >
                      {formatCurrency(spent)} / {formatCurrency(budgeted)}
                    </span>
                  </div>
                  <Progress
                    value={progress}
                    className={`h-2 transition-all duration-500 ${
                      isOverBudget ? '[&>div]:bg-destructive' : '[&>div]:bg-lime-600'
                    }`}
                  />
                  <p
                    className={`mt-2 text-right text-xs ${
                      isOverBudget ? 'text-destructive' : 'text-muted-foreground'
                    }`}
                  >
                    {isOverBudget
                      ? `${formatCurrency(Math.abs(remaining))} over budget`
                      : `${formatCurrency(remaining)} remaining`}
                  </p>
                </div>
              );
            })}
          </div>
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
