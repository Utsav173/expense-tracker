'use-client';

import React from 'react';
import type { AccountAPI } from '@/lib/api/api-types';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import {
  TrendingDown,
  TrendingUp,
  Minus,
  Wallet,
  ArrowLeftRight,
  Banknote,
  type LucideProps
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// --- STYLES (cva) ---

const cardVariants = cva(
  'relative group overflow-hidden rounded-2xl border-none shadow-lg transition-all duration-300 ease-out hover:scale-[1.01] hover:shadow-2xl hover:brightness-105',
  {
    variants: {
      variant: {
        primary:
          'text-slate-800 bg-gradient-to-br from-purple-200 via-indigo-300 to-blue-300 dark:text-slate-100 dark:bg-gradient-to-br dark:from-indigo-700 dark:via-purple-700 dark:to-blue-800',
        success:
          'text-slate-800 bg-gradient-to-br from-green-300/80 to-teal-300/50 dark:text-slate-100 dark:bg-gradient-to-br dark:from-green-900 dark:to-teal-600/90',
        destructive:
          'text-slate-800 bg-gradient-to-br from-red-300 to-rose-300/50 dark:text-slate-100 dark:bg-gradient-to-br dark:from-red-500/80 dark:to-orange-900/60'
      }
    },
    defaultVariants: {
      variant: 'primary'
    }
  }
);

const DotPattern = () => (
  <div className='absolute h-full w-full bg-[radial-gradient(theme(colors.slate.900/15)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] [background-size:16px_16px] opacity-55 transition-transform duration-500 ease-out group-hover:scale-105 dark:bg-[radial-gradient(theme(colors.slate.100/10)_1px,transparent_1px)]' />
);

const GhostIcon = ({ icon: Icon }: { icon: React.ElementType<LucideProps> }) => (
  <Icon className='absolute -right-8 -bottom-8 h-40 w-40 opacity-10 transition-transform duration-500 ease-out group-hover:scale-110 dark:opacity-8' />
);

// --- SUB-COMPONENTS ---

const TrendIndicator = ({ value }: { value: number }) => {
  const direction = value > 0 ? 'up' : value < 0 ? 'down' : 'neutral';
  const Icon = value > 0 ? TrendingUp : value < 0 ? TrendingDown : Minus;

  const trendColorClasses =
    direction === 'up'
      ? 'text-green-600'
      : direction === 'down'
        ? 'text-red-600'
        : 'text-muted-foreground';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className='flex items-center gap-3'>
            <div className='bg-background/5 flex h-12 w-12 items-center justify-center rounded-full border backdrop-blur-sm'>
              <Icon className={cn('h-6 w-6', trendColorClasses)} />
            </div>
            <div className='text-base font-bold text-inherit'>
              <span>
                {value > 0 ? '+' : ''}
                {Math.abs(value).toFixed(1)}%
              </span>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Change vs. previous period</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

interface AnalyticsCardProps extends VariantProps<typeof cardVariants> {
  title: string;
  value: number;
  currency: string;
  icon: React.ElementType<LucideProps>;
  trendValue?: number;
  footerText?: string;
  totalBalance?: number;
}

const AnalyticsCard = ({
  title,
  value,
  currency,
  icon: Icon,
  trendValue,
  footerText,
  variant,
  totalBalance
}: AnalyticsCardProps) => (
  <Card className={cn(cardVariants({ variant }))}>
    {variant === 'primary' && <DotPattern />}
    <GhostIcon icon={Icon} />

    {variant === 'primary' ? (
      // Hero Card Layout remains the same
      <div className='relative flex h-full min-h-[180px] flex-col justify-between p-6'>
        <div>
          <p className='text-muted-foreground font-medium'>{title}</p>
          <p className='font-display text-foreground mt-2 text-4xl font-bold tracking-tighter'>
            {formatCurrency(value, currency)}
          </p>
        </div>
        <div className='mt-4'>
          {totalBalance !== undefined && (
            <p className='text-muted-foreground text-sm'>
              <span className='opacity-80'>Total in Account:</span>{' '}
              {formatCurrency(totalBalance, currency)}
            </p>
          )}
          {footerText && <p className='text-muted-foreground mt-1 text-xs'>{footerText}</p>}
        </div>
      </div>
    ) : (
      // New Corner-Aligned Layout for Income & Expense Cards
      <div className='relative flex h-full min-h-[140px] flex-col justify-between p-6'>
        {/* Top-left content */}
        <div>
          <p className='text-muted-foreground font-medium'>{title}</p>
          <p className='font-display text-foreground mt-1 text-3xl font-bold tracking-tight'>
            {formatCurrency(value, currency)}
          </p>
        </div>

        {/* Bottom-right content, pushed with self-end */}
        {trendValue !== undefined && (
          <div className='self-end'>
            <TrendIndicator value={trendValue} />
          </div>
        )}
      </div>
    )}
  </Card>
);

// --- SKELETON COMPONENTS ---

const SkeletonCard = ({ isHero = false }: { isHero?: boolean }) => {
  if (isHero) {
    return (
      <Card className='flex min-h-[180px] flex-col justify-between p-6'>
        <div className='space-y-2'>
          <Skeleton className='h-5 w-2/5' />
          <Skeleton className='h-12 w-3/4' />
        </div>
        <div className='mt-4 space-y-2'>
          <Skeleton className='h-4 w-1/2' />
          <Skeleton className='h-3 w-1/3' />
        </div>
      </Card>
    );
  }

  // Updated skeleton to match the new corner-aligned layout
  return (
    <Card className='flex min-h-[140px] flex-col justify-between p-6'>
      {/* Top-left skeleton */}
      <div className='space-y-2'>
        <Skeleton className='h-5 w-24' />
        <Skeleton className='h-9 w-40' />
      </div>

      {/* Bottom-right skeleton */}
      <div className='flex items-center gap-3 self-end'>
        <Skeleton className='h-12 w-12 rounded-full' />
        <Skeleton className='h-6 w-16' />
      </div>
    </Card>
  );
};

// --- MAIN EXPORTED COMPONENT ---

export const AnalyticsCards = ({
  analytics,
  isLoading,
  account
}: {
  analytics?: AccountAPI.CustomAnalytics;
  isLoading?: boolean;
  account?: AccountAPI.GetAccountByIdResponse;
}) => {
  const currency = account?.currency ?? 'INR';
  const lastUpdated = account?.updatedAt
    ? `Updated: ${new Date(account.updatedAt).toLocaleDateString()}`
    : undefined;

  if (isLoading) {
    return (
      <div className='grid gap-4 sm:gap-6'>
        <SkeletonCard isHero />
        <div className='grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2'>
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (!analytics || !account) return null;

  return (
    <div className='grid gap-4 sm:gap-6'>
      <AnalyticsCard
        variant='primary'
        title='Current Balance'
        value={analytics.balance}
        totalBalance={account.balance ?? 0}
        currency={currency}
        icon={Wallet}
        footerText={lastUpdated}
      />
      <div className='grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2'>
        <AnalyticsCard
          variant='success'
          title='Income'
          value={analytics.income}
          currency={currency}
          icon={Banknote}
          trendValue={analytics.IncomePercentageChange}
        />
        <AnalyticsCard
          variant='destructive'
          title='Expenses'
          value={analytics.expense}
          currency={currency}
          icon={ArrowLeftRight}
          trendValue={analytics.ExpensePercentageChange}
        />
      </div>
    </div>
  );
};
