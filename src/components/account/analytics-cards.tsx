'use client';

import { AccountDetails, CustomAnalytics } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getDynamicFontSize, formatCurrency } from '@/lib/utils';
import {
  TrendingDown,
  TrendingUp,
  Minus,
  ArrowUpCircle,
  ArrowDownCircle,
  CreditCard,
  BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ApiResponse } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { SingleLineEllipsis } from '../ui/ellipsis-components';

interface AnalyticsCardsProps {
  analytics?: ApiResponse<CustomAnalytics>;
  isLoading?: boolean;
  account?: ApiResponse<AccountDetails>;
}

const ShimmeringCard = ({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={cn(
      'bg-background relative overflow-hidden rounded-lg border shadow-md',
      'before:border-primary/20 before:via-primary/10 before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:border-t before:bg-gradient-to-r before:from-transparent before:to-transparent',
      className
    )}
  >
    {children}
  </div>
);

const CurrentBalanceCard = ({ account, isLoading }: { account: any; isLoading?: boolean }) => {
  if (isLoading) {
    return (
      <ShimmeringCard className='h-full'>
        <div className='p-6 sm:p-8'>
          <div className='space-y-3'>
            <Skeleton className='h-5 w-32' />
            <Skeleton className='h-12 w-64' />
            <Skeleton className='h-4 w-40' />
          </div>
        </div>
      </ShimmeringCard>
    );
  }

  const isPositive = account?.balance && account?.balance > 0;
  const bgColorClass = isPositive
    ? 'from-blue-500/10 to-blue-500/20 dark:from-blue-900/10 dark:to-blue-900/20'
    : 'from-red-500/10 to-red-500/20 dark:from-red-900/10 dark:to-red-900/20';

  const formattedBalance = formatCurrency(account?.balance ?? 0, account?.currency);
  const dynamicFontSize = getDynamicFontSize(formattedBalance);

  return (
    <Card
      className={cn(
        'group relative h-full overflow-hidden border-none shadow-lg transition-all duration-300 hover:shadow-xl',
        'bg-gradient-to-br',
        bgColorClass
      )}
    >
      <div className='flex h-full flex-col justify-between p-6 sm:p-8'>
        <div className='flex items-start justify-between gap-4'>
          <div className='flex flex-col gap-2'>
            <div className='text-foreground/80 mb-2 flex items-center gap-2'>
              <CreditCard className='h-5 w-5' />
              <h3 className='text-lg font-semibold'>Current Balance</h3>
            </div>
            <div className='flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1'>
              <SingleLineEllipsis
                className='text-foreground font-bold tracking-tight'
                style={{ fontSize: dynamicFontSize }}
              >
                {formattedBalance}
              </SingleLineEllipsis>
              <Badge
                variant={isPositive ? 'default' : 'destructive'}
                className={cn(
                  'h-fit w-fit font-medium',
                  isPositive &&
                    'bg-success text-success-foreground hover:bg-success/80 border-transparent shadow-sm'
                )}
              >
                {isPositive ? 'Positive' : 'Negative'}
              </Badge>
            </div>
          </div>
          <div className='hidden sm:block'>
            <div
              className={cn(
                'rounded-full p-3 transition-colors duration-300',
                isPositive ? 'bg-success/20' : 'bg-destructive/20'
              )}
            >
              {isPositive ? (
                <TrendingUp className='text-success h-6 w-6' />
              ) : (
                <TrendingDown className='text-destructive h-6 w-6' />
              )}
            </div>
          </div>
        </div>
        <p className='text-muted-foreground mt-4 text-sm'>
          Last updated{' '}
          {account?.updatedAt ? new Date(account.updatedAt).toLocaleDateString() : 'Never'}
        </p>
      </div>
    </Card>
  );
};

const StatCard = ({
  title,
  value,
  change,
  type,
  currency,
  isLoading
}: {
  title: string;
  value: number;
  change: number;
  type: 'income' | 'expense' | 'balance';
  currency: string;
  isLoading?: boolean;
}) => {
  if (isLoading) {
    return (
      <ShimmeringCard>
        <div className='p-6'>
          <div className='space-y-3'>
            <Skeleton className='h-5 w-20' />
            <Skeleton className='h-10 w-32' />
            <Skeleton className='h-4 w-24' />
          </div>
        </div>
      </ShimmeringCard>
    );
  }

  const cardConfig = {
    income: {
      icon: <ArrowUpCircle className='text-success h-5 w-5' />,
      iconBg: 'bg-success/10 dark:bg-success/20',
      gradientFrom: 'from-green-500/10',
      gradientTo: 'to-green-500/20'
    },
    expense: {
      icon: <ArrowDownCircle className='text-destructive h-5 w-5' />,
      iconBg: 'bg-destructive/10 dark:bg-destructive/20',
      gradientFrom: 'from-red-500/10',
      gradientTo: 'to-red-500/20'
    },
    balance: {
      icon: <BarChart3 className='text-primary h-5 w-5' />,
      iconBg: 'bg-primary/10 dark:bg-primary/20',
      gradientFrom: 'from-blue-500/10',
      gradientTo: 'to-blue-500/20'
    }
  };

  const config = cardConfig[type];

  const getTrendIcon = () => {
    if (change === 0) return <Minus className='text-muted-foreground h-4 w-4' />;
    return change > 0 ? (
      <TrendingUp className='text-success h-4 w-4' />
    ) : (
      <TrendingDown className='text-destructive h-4 w-4' />
    );
  };

  const getChangeColor = () => {
    if (change === 0) return 'text-muted-foreground';
    return change > 0 ? 'text-success' : 'text-destructive';
  };

  const formattedValue = formatCurrency(value, currency);
  const dynamicFontSize = getDynamicFontSize(formattedValue, 2, 1.2, 10);

  return (
    <Card
      className={cn(
        'h-full overflow-hidden border-none shadow-lg transition-all duration-300 hover:shadow-xl',
        'bg-gradient-to-br',
        config.gradientFrom,
        config.gradientTo
      )}
    >
      <div className='flex h-full flex-col justify-between p-4 sm:p-6'>
        <div className='flex items-start justify-between'>
          <span className='text-foreground/80 text-sm font-medium sm:text-base'>{title}</span>
          <div className={cn('rounded-full p-2', config.iconBg)}>{config.icon}</div>
        </div>

        <div className='mt-2'>
          <SingleLineEllipsis
            className='text-foreground font-bold tracking-tight'
            style={{ fontSize: dynamicFontSize }}
          >
            {formattedValue}
          </SingleLineEllipsis>
        </div>

        <div className='mt-4 flex items-center gap-1.5'>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className='bg-background/50 dark:bg-background/30 inline-flex items-center gap-1.5 rounded-md px-2 py-1'>
                {getTrendIcon()}
                <span className={cn('text-xs font-medium sm:text-sm', getChangeColor())}>
                  {change > 0 ? '+' : ''}
                  {Math.abs(change).toFixed(2)}%
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Change from last period</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </Card>
  );
};

export const AnalyticsCards = ({ analytics, isLoading, account }: AnalyticsCardsProps) => {
  if (!analytics && !isLoading) return null;

  return (
    <div className='flex flex-col gap-4 sm:gap-6'>
      <CurrentBalanceCard account={account} isLoading={isLoading} />

      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3'>
        <StatCard
          title='Income'
          value={analytics?.income ?? 0}
          change={analytics?.IncomePercentageChange ?? 0}
          type='income'
          currency={account?.currency ?? 'INR'}
          isLoading={isLoading}
        />
        <StatCard
          title='Expenses'
          value={analytics?.expense ?? 0}
          change={analytics?.ExpensePercentageChange ?? 0}
          type='expense'
          currency={account?.currency ?? 'INR'}
          isLoading={isLoading}
        />
        <StatCard
          title='Net Balance'
          value={analytics?.balance ?? 0}
          change={analytics?.BalancePercentageChange ?? 0}
          type='balance'
          currency={account?.currency ?? 'INR'}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};
