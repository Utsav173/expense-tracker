'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn, formatCurrency } from '@/lib/utils';
import NoData from '../ui/no-data';
import { WalletCards, TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';
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
  const ReturnIcon = isPositiveReturn ? TrendingUp : TrendingDown;

  return (
    <Card className={cn('flex h-full flex-col', className)}>
      <CardHeader>
        <div className='flex items-start justify-between gap-3'>
          <div className='min-w-0 flex-1'>
            <CardTitle className='text-lg font-semibold'>Investment Summary</CardTitle>
            <CardDescription className='text-sm leading-relaxed'>
              {numberOfHoldings} holding{numberOfHoldings !== 1 ? 's' : ''} across{' '}
              {numberOfAccounts} account{numberOfAccounts !== 1 ? 's' : ''}
              {valueIsEstimate && (
                <TooltipElement tooltipContent='Values are estimated due to mixed currencies or missing price data.'>
                  <span className='ml-2 inline-flex items-center text-amber-600 dark:text-amber-400'>
                    <AlertTriangle className='mr-1 h-3 w-3' />
                    <span className='text-xs'>Est.</span>
                  </span>
                </TooltipElement>
              )}
            </CardDescription>
          </div>
          <WalletCards className='text-muted-foreground h-5 w-5 flex-shrink-0' />
        </div>
      </CardHeader>

      <CardContent className='flex-1 space-y-6'>
        <div className='grid grid-cols-2 gap-x-4 gap-y-6'>
          <MetricCard label='Current Value' value={formatCurrency(currentMarketValue, currency)} />
          <MetricCard
            label='Total Invested'
            value={formatCurrency(totalInvestedAmount, currency)}
          />
          <MetricCard
            label='Total Return'
            value={formatCurrency(overallGainLoss, currency)}
            secondaryValue={`(${overallGainLossPercentage?.toFixed(1) ?? '0.0'}%)`}
            icon={<ReturnIcon className='h-3 w-3' />}
            variant={returnVariant}
          />
          <MetricCard
            label='Total Dividends'
            value={formatCurrency(totalDividends, currency)}
            variant='positive'
          />
        </div>
      </CardContent>

      <div className='mt-auto border-t p-3 text-center'>
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
  variant?: 'default' | 'positive' | 'negative';
}> = ({ label, value, secondaryValue, icon, variant = 'default' }) => {
  const colorClass =
    variant === 'positive'
      ? 'text-emerald-600 dark:text-emerald-400'
      : variant === 'negative'
        ? 'text-red-600 dark:text-red-400'
        : 'text-foreground';

  return (
    <div className='space-y-1'>
      <div className='text-muted-foreground flex items-center gap-1.5 text-xs font-medium'>
        {icon}
        {label}
      </div>
      <div className={cn('leading-tight font-semibold', colorClass)}>
        <div className='text-lg break-all sm:text-xl'>{value}</div>
        {secondaryValue && <div className='text-xs opacity-80'>{secondaryValue}</div>}
      </div>
    </div>
  );
};
