'use client';

import { AccountDetails, CustomAnalytics } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
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
import { PixelCanvas } from '../ui/pixel-canvas';

interface AnalyticsCardsProps {
  analytics?: ApiResponse<CustomAnalytics>;
  isLoading?: boolean;
  account?: ApiResponse<AccountDetails>;
}

const CurrentBalanceCard = ({ account, isLoading }: { account: any; isLoading?: boolean }) => {
  if (isLoading) {
    return (
      <Card className='h-full overflow-hidden border-none shadow-md'>
        <div className='from-primary/10 to-primary/20 bg-gradient-to-br p-6'>
          <div className='space-y-3'>
            <Skeleton className='h-5 w-32' />
            <Skeleton className='h-12 w-64' />
            <Skeleton className='h-4 w-40' />
          </div>
        </div>
      </Card>
    );
  }

  const isPositive = account?.balance && account?.balance > 0;
  const bgColorClass =
    account?.balance && account?.balance > 0
      ? 'from-primary/10 to-primary/20'
      : 'from-destructive/10 to-destructive/20';

  return (
    <Card className='group relative h-full overflow-hidden border-none shadow-md transition-all duration-300 hover:shadow-lg'>
      <PixelCanvas gap={10} speed={25} colors={['#e0f2fe', '#7dd3fc', '#0ea5e9']} />

      <div
        className={`flex h-full w-full flex-col justify-between bg-gradient-to-br ${bgColorClass} p-6 sm:p-8`}
      >
        <div className='flex items-start justify-between gap-4'>
          <div className='flex flex-col gap-2'>
            <div className='mb-2 flex items-center gap-2'>
              <CreditCard className='z-10 h-5 w-5 transition-colors duration-300 group-hover:text-[var(--active-color)]' />
              <h3 className='z-10 text-lg font-semibold transition-colors duration-300 group-hover:text-[var(--active-color)]'>
                Current Balance
              </h3>
            </div>
            <div className='flex min-w-0 flex-wrap items-center gap-3'>
              <SingleLineEllipsis className='z-10 text-3xl font-bold tracking-tight transition-colors duration-300 group-hover:text-[var(--active-color)] sm:text-4xl xl:text-5xl'>
                {formatCurrency(account?.balance ?? 0, account?.currency)}
              </SingleLineEllipsis>
              <Badge
                variant={isPositive ? 'default' : 'destructive'}
                className='z-10 h-fit w-fit font-medium'
              >
                {isPositive ? 'Positive' : 'Negative'}
              </Badge>
            </div>
          </div>
          <div className='z-10 hidden sm:block'>
            {isPositive ? (
              <div className='bg-success/20 group-hover:bg-success/30 rounded-full p-3 backdrop-blur-sm transition-colors duration-300'>
                <TrendingUp className='text-success h-6 w-6' />
              </div>
            ) : (
              <div className='bg-destructive/20 group-hover:bg-destructive/30 rounded-full p-3 backdrop-blur-sm transition-colors duration-300'>
                <TrendingDown className='text-destructive h-6 w-6' />
              </div>
            )}
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
      <Card className='overflow-hidden border-none shadow-md'>
        <div className='p-6'>
          <div className='space-y-3'>
            <Skeleton className='h-5 w-20' />
            <Skeleton className='h-10 w-32' />
            <Skeleton className='h-4 w-24' />
          </div>
        </div>
      </Card>
    );
  }

  const cardConfig = {
    income: {
      icon: <ArrowUpCircle className='text-success h-5 w-5' />,
      iconBg: 'bg-success/20',
      color: 'text-success',
      gradientFrom: 'from-success/10',
      gradientTo: 'to-success/20'
    },
    expense: {
      icon: <ArrowDownCircle className='text-destructive h-5 w-5' />,
      iconBg: 'bg-destructive/20',
      color: 'text-destructive',
      gradientFrom: 'from-destructive/10',
      gradientTo: 'to-destructive/20'
    },
    balance: {
      icon: <BarChart3 className='text-primary h-5 w-5' />,
      iconBg: 'bg-primary/20',
      color: 'text-primary',
      gradientFrom: 'from-primary/10',
      gradientTo: 'to-primary/20'
    }
  };

  const config = cardConfig[type];

  // Function to determine if a change is considered "good" based on card type
  const isPositiveChange = () => {
    // For expenses, negative change is good
    if (type === 'expense') return change < 0;
    // For income and balance, positive change is good
    return change > 0;
  };

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
    return isPositiveChange() ? 'text-success' : 'text-destructive';
  };

  return (
    <Card className='h-full overflow-hidden border-none shadow-md transition-all duration-300 hover:shadow-lg'>
      <div className={`bg-gradient-to-br ${config.gradientFrom} ${config.gradientTo} h-full p-6`}>
        <div className='mb-4 flex items-center justify-between'>
          <span className={`${config.color} text-sm font-medium sm:text-base`}>{title}</span>
          <div className={`rounded-full p-2 ${config.iconBg}`}>{config.icon}</div>
        </div>

        <div className='mb-4 min-w-0'>
          <SingleLineEllipsis className='block text-xl font-bold tracking-tight sm:text-3xl'>
            {formatCurrency(value, currency)}
          </SingleLineEllipsis>
        </div>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className='bg-muted inline-flex items-center gap-1.5 rounded-md px-2 py-1'>
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
        </TooltipProvider>
      </div>
    </Card>
  );
};

export const AnalyticsCards = ({ analytics, isLoading, account }: AnalyticsCardsProps) => {
  if (!analytics && !isLoading) return null;

  return (
    <TooltipProvider>
      <div className='flex flex-col gap-4 select-none'>
        <CurrentBalanceCard account={account} isLoading={isLoading} />

        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5'>
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
    </TooltipProvider>
  );
};
