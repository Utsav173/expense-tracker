'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn, formatCurrency } from '@/lib/utils';
import NoData from '../ui/no-data';
import {
  WalletCards,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  DollarSign,
  PiggyBank
} from 'lucide-react';
import { investmentGetPortfolioSummary } from '@/lib/endpoints/investment';
import { useToast } from '@/lib/hooks/useToast';
import Link from 'next/link';
import { Button } from '../ui/button';
import TooltipElement from '../ui/tooltip-element';
import Loader from '../ui/loader';

export const InvestmentSummaryCard: React.FC<{
  className?: string;
}> = ({ className }) => {
  const { showError } = useToast();

  const {
    data: summaryData,
    isLoading,
    error
  } = useQuery({
    queryKey: ['investmentPortfolioSummaryDashboard'],
    queryFn: investmentGetPortfolioSummary,
    retry: 1,
    staleTime: 15 * 60 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: true
  });

  React.useEffect(() => {
    if (error) {
      showError(`Investment Summary Error: ${(error as Error).message}`);
    }
  }, [error, showError]);

  if (isLoading) return <Loader />;

  if (error || !summaryData || summaryData.numberOfHoldings === 0) {
    return (
      <NoData
        message={error ? 'Could not load data.' : 'No investments tracked yet.'}
        icon={error ? 'x-circle' : 'inbox'}
      />
    );
  }

  const {
    currentMarketValue,
    totalInvestedAmount,
    totalDividends,
    overallGainLoss,
    overallGainLossPercentage,
    numberOfAccounts,
    numberOfHoldings,
    currency,
    valueIsEstimate
  } = summaryData;

  const isPositiveReturn = overallGainLoss >= 0;
  const returnVariant = isPositiveReturn ? 'positive' : 'negative';
  const ReturnIcon = isPositiveReturn ? TrendingUp : overallGainLoss < 0 ? TrendingDown : Minus;

  return (
    <Card className={cn('flex h-full flex-col shadow-sm', className)}>
      <CardHeader className='pb-4'>
        <div className='flex items-start justify-between gap-3'>
          <div className='min-w-0 flex-1'>
            <CardTitle className='text-lg font-semibold tracking-tight'>
              Investment Summary
            </CardTitle>
            <CardDescription className='text-muted-foreground mt-1 text-sm leading-relaxed'>
              {numberOfHoldings} holding{numberOfHoldings !== 1 ? 's' : ''} across{' '}
              {numberOfAccounts} account{numberOfAccounts !== 1 ? 's' : ''}
              {valueIsEstimate && (
                <TooltipElement tooltipContent='Values are estimated due to mixed currencies or missing price data.'>
                  <span className='ml-2 inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-300'>
                    <AlertTriangle className='mr-1 h-3 w-3' />
                    Est.
                  </span>
                </TooltipElement>
              )}
            </CardDescription>
          </div>
          <div className='bg-primary/10 rounded-full p-2'>
            <WalletCards className='text-primary h-5 w-5' />
          </div>
        </div>
      </CardHeader>

      <CardContent className='flex flex-1 flex-col items-stretch justify-evenly space-y-6'>
        {/* Primary Metrics */}
        <div className='grid grid-cols-2 gap-4'>
          <MetricCard
            label='Current Value'
            value={formatCurrency(currentMarketValue, currency)}
            icon={<DollarSign className='h-4 w-4' />}
            variant='primary'
          />
          <MetricCard
            label='Total Invested'
            value={formatCurrency(totalInvestedAmount, currency)}
            icon={<PiggyBank className='h-4 w-4' />}
            variant='secondary'
          />
        </div>

        {/* Performance Metrics */}
        <div className='grid grid-cols-2 gap-4'>
          <MetricCard
            label='Total Return'
            value={formatCurrency(overallGainLoss, currency)}
            secondaryValue={`${overallGainLossPercentage?.toFixed(1) ?? '0.0'}%`}
            icon={<ReturnIcon className='h-4 w-4' />}
            variant={returnVariant}
            highlight={true}
          />
          <MetricCard
            label='Dividends Earned'
            value={formatCurrency(totalDividends, currency)}
            icon={<TrendingUp className='h-4 w-4' />}
            variant='positive'
          />
        </div>
      </CardContent>

      <div className='bg-muted/20 mt-auto border-t p-3 max-sm:p-1'>
        <Button variant='link' size='sm' asChild className='w-full text-xs font-medium sm:w-auto'>
          <Link href='/investment'>Manage Investments</Link>
        </Button>
      </div>
    </Card>
  );
};

const MetricCard: React.FC<{
  label: string;
  value: string;
  secondaryValue?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'primary' | 'secondary' | 'positive' | 'negative';
  highlight?: boolean;
}> = ({ label, value, secondaryValue, icon, variant = 'default', highlight = false }) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          container: 'bg-primary/5 border border-primary/20 dark:bg-primary/10',
          text: 'text-primary',
          icon: 'text-primary'
        };
      case 'secondary':
        return {
          container: 'bg-muted/50 border border-muted',
          text: 'text-foreground',
          icon: 'text-muted-foreground'
        };
      case 'positive':
        return {
          container:
            'bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800/30',
          text: 'text-emerald-700 dark:text-emerald-400',
          icon: 'text-emerald-600 dark:text-emerald-400'
        };
      case 'negative':
        return {
          container: 'bg-red-50 border border-red-200 dark:bg-red-950/20 dark:border-red-800/30',
          text: 'text-red-700 dark:text-red-400',
          icon: 'text-red-600 dark:text-red-400'
        };
      default:
        return {
          container: 'bg-background border border-border',
          text: 'text-foreground',
          icon: 'text-muted-foreground'
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div
      className={cn(
        'rounded-lg p-4 transition-all duration-200',
        styles.container,
        highlight && 'ring-primary/20 shadow-sm ring-2'
      )}
    >
      <div className='mb-2 flex items-center gap-2'>
        {icon && <div className={cn('flex-shrink-0', styles.icon)}>{icon}</div>}
        <div className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>
          {label}
        </div>
      </div>
      <div className='space-y-1'>
        <div className={cn('text-xl leading-none font-bold', styles.text)}>{value}</div>
        {secondaryValue && (
          <div className={cn('text-sm font-medium opacity-80', styles.text)}>{secondaryValue}</div>
        )}
      </div>
    </div>
  );
};
