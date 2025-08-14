import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import type { BudgetAPI } from '@/lib/api/api-types';
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
import { ScrollArea } from '../ui/scroll-area';
import { Icon } from '../ui/icon';

interface BudgetItemProps {
  item: {
    category: string;
    categoryName: string;
    budgetedAmount: number;
    actualSpend: number;
  };
}

const BudgetItem: React.FC<BudgetItemProps> = ({ item }) => {
  const spent = item.actualSpend || 0;
  const budgeted = item.budgetedAmount || 0;
  const progress = budgeted > 0 ? Math.min((spent / budgeted) * 100, 100) : 0;
  const remaining = budgeted - spent;
  const isOverBudget = spent > budgeted;
  const isNearLimit = progress > 85 && progress <= 100;

  const getStatusIcon = () => {
    if (isOverBudget) return <Icon name='shieldAlert' className='text-destructive h-3.5 w-3.5' />;
    if (isNearLimit) return <Icon name='trendingUp' className='h-3.5 w-3.5 text-orange-500' />;
    return <Icon name='checkCircle2' className='h-3.5 w-3.5 text-green-500' />;
  };

  const getProgressColor = () => {
    if (isOverBudget) return '[&>div]:bg-destructive';
    if (isNearLimit) return '[&>div]:bg-orange-500';
    return '[&>div]:bg-green-500';
  };

  const getStatusBadge = () => {
    if (isOverBudget) return 'Over Budget';
    if (isNearLimit) return 'Near Limit';
    return 'On Track';
  };

  const getBadgeColor = () => {
    if (isOverBudget) return 'bg-destructive/10 text-destructive border-destructive/20';
    if (isNearLimit) return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
    return 'bg-green-500/10 text-green-600 border-green-500/20';
  };

  return (
    <div className='group bg-card hover:bg-accent/50 rounded-lg border-none transition-all duration-200'>
      <div className='p-3'>
        <div className='mb-2 flex items-center justify-between'>
          <div className='flex min-w-0 items-center gap-2'>
            {getStatusIcon()}
            <span className='text-foreground truncate text-sm font-medium'>
              {item.categoryName}
            </span>
          </div>
          <span
            className={cn(
              'rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap',
              getBadgeColor()
            )}
          >
            {getStatusBadge()}
          </span>
        </div>

        <div className='space-y-2'>
          <Progress value={progress} className={cn('h-1.5', getProgressColor())} />

          <div className='flex items-center justify-between text-xs'>
            <span className='text-muted-foreground'>
              {formatCurrency(spent)} / {formatCurrency(budgeted)}
            </span>
            <span
              className={cn('font-medium', isOverBudget ? 'text-destructive' : 'text-green-600')}
            >
              {isOverBudget ? '+' : ''}
              {formatCurrency(isOverBudget ? Math.abs(remaining) : remaining)}
              <span className='text-muted-foreground ml-1'>{isOverBudget ? 'over' : 'left'}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const BudgetProgress: React.FC<{ className?: string }> = ({ className }) => {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const { showError } = useToast();

  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  const { data, isLoading, error, isFetching } =
    useQuery<BudgetAPI.GetBudgetSummaryResponse | null>({
      queryKey: ['budgetSummaryDashboard', selectedMonth, selectedYear],
      queryFn: () => budgetGetSummary(selectedMonth, selectedYear),
      enabled: true,
      retry: 1,
      staleTime: 5 * 60 * 1000,
      refetchOnMount: true,
      refetchOnWindowFocus: true
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

  const totalBudgeted = data?.reduce((sum, item) => sum + (item.budgetedAmount || 0), 0) || 0;
  const totalSpent = data?.reduce((sum, item) => sum + (item.actualSpend || 0), 0) || 0;
  const overallProgress = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;

  return (
    <Card className={cn('flex h-full flex-col', className)}>
      {/* Controls */}
      <div className='flex gap-2 border-b p-3'>
        <Select
          value={String(selectedMonth)}
          onValueChange={(value) => setSelectedMonth(Number(value))}
          disabled={isLoading || isFetching}
        >
          <SelectTrigger className='h-8 text-xs'>
            <SelectValue placeholder='Month' />
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
          <SelectTrigger className='h-8 w-20 text-xs'>
            <SelectValue placeholder='Year' />
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

      <CardContent className='flex-1 p-0'>
        <ScrollArea className='h-[450px]'>
          {isLoading || isFetching ? (
            <div className='flex h-full items-center justify-center py-8'>
              <Loader />
            </div>
          ) : error ? (
            <div className='flex h-full items-center justify-center py-8'>
              <NoData message='Could not load budget data' icon='xCircle' />
            </div>
          ) : !data || data.length === 0 ? (
            <div className='flex h-full items-center justify-center py-8'>
              <NoData
                message={`No budgets for ${months.find((m) => m.value === selectedMonth)?.label} ${selectedYear}`}
                icon='inbox'
              />
            </div>
          ) : (
            <>
              {/* Overall Progress */}
              <div className='bg-muted/30 border-b p-3'>
                <div className='mb-2 flex items-center justify-between'>
                  <span className='text-muted-foreground text-xs font-medium'>
                    Overall Progress
                  </span>
                  <span className='text-foreground text-xs font-medium'>
                    {formatCurrency(totalSpent)} / {formatCurrency(totalBudgeted)}
                  </span>
                </div>
                <Progress
                  value={Math.min(overallProgress, 100)}
                  className={cn(
                    'h-2',
                    overallProgress > 100
                      ? '[&>div]:bg-destructive'
                      : overallProgress > 85
                        ? '[&>div]:bg-orange-500'
                        : '[&>div]:bg-green-500'
                  )}
                />
                <div className='text-muted-foreground mt-1 text-right text-xs'>
                  {Math.round(overallProgress)}% of total budget used
                </div>
              </div>

              {/* Budget Items */}
              <div className='space-y-2 p-3'>
                {data
                  .sort((a, b) => {
                    const aProgress =
                      a.budgetedAmount > 0 ? (a.actualSpend / a.budgetedAmount) * 100 : 0;
                    const bProgress =
                      b.budgetedAmount > 0 ? (b.actualSpend / b.budgetedAmount) * 100 : 0;

                    if (aProgress > 100 && bProgress <= 100) return -1;
                    if (bProgress > 100 && aProgress <= 100) return 1;
                    if (aProgress > 85 && bProgress <= 85) return -1;
                    if (bProgress > 85 && aProgress <= 85) return 1;

                    return b.actualSpend - a.actualSpend;
                  })
                  .map((item) => (
                    <BudgetItem key={item.category || item.categoryName} item={item} />
                  ))}
              </div>
            </>
          )}
        </ScrollArea>
      </CardContent>

      {/* Footer */}
      {!isLoading && !error && data && data.length > 0 && (
        <div className='border-t p-3'>
          <Button variant='link' size='sm' asChild className='text-muted-foreground w-full text-xs'>
            <Link href='/budget'>Manage Budgets</Link>
          </Button>
        </div>
      )}
    </Card>
  );
};
