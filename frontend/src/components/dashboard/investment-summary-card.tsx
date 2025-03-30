'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PortfolioSummary } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import NoData from '../ui/no-data';
import { WalletCards, TrendingUp, TrendingDown, Minus, Package, AlertTriangle } from 'lucide-react';
import { investmentGetPortfolioSummary } from '@/lib/endpoints/investment';
import { Skeleton } from '../ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { useToast } from '@/lib/hooks/useToast';

export const InvestmentSummaryCard: React.FC = () => {
  const { showError } = useToast();

  const { data, isLoading, error } = useQuery<PortfolioSummary | null>({
    queryKey: ['investmentPortfolioSummaryDashboard'],
    queryFn: () => investmentGetPortfolioSummary(),
    retry: false,
    staleTime: 15 * 60 * 1000
  });

  React.useEffect(() => {
    if (error) {
      showError(`Investment Error: ${(error as Error).message}`);
    }
  }, [error, showError]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <WalletCards className='h-5 w-5 text-blue-500' />
            Investment Summary
          </CardTitle>
          <CardDescription>Loading investment overview...</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4 pt-2'>
          <Skeleton className='h-6 w-3/4' />
          <Skeleton className='h-4 w-1/2' />
          <Skeleton className='mt-2 h-6 w-2/4' />
          <Skeleton className='h-4 w-1/3' />
          <Skeleton className='mt-3 h-4 w-1/4' />
        </CardContent>
      </Card>
    );
  }

  if (error || !data || data.numberOfHoldings === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <WalletCards className='h-5 w-5 text-blue-500' />
            Investment Summary
          </CardTitle>
          <CardDescription>Overview of your investments.</CardDescription>
        </CardHeader>
        <CardContent className='h-[200px]'>
          <NoData
            message={error ? 'Could not load investment data.' : 'No investments tracked yet.'}
            icon='inbox'
          />
        </CardContent>
      </Card>
    );
  }

  const {
    totalInvestedAmount,
    currentMarketValue,
    totalDividends,
    overallGainLoss,
    overallGainLossPercentage,
    numberOfAccounts,
    numberOfHoldings,
    currency,
    valueIsEstimate
  } = data;

  const gainLossColor =
    overallGainLoss > 0
      ? 'text-green-600'
      : overallGainLoss < 0
        ? 'text-red-600'
        : 'text-muted-foreground';
  const GainLossIcon =
    overallGainLoss > 0 ? TrendingUp : overallGainLoss < 0 ? TrendingDown : Minus;

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <WalletCards className='h-5 w-5 text-blue-500' />
            Investment Summary
          </CardTitle>
          <CardDescription>Performance across {numberOfAccounts} account(s).</CardDescription>
        </CardHeader>
        <CardContent className='scrollbar h-[250px] space-y-3 overflow-y-auto text-sm'>
          <div>
            <p className='flex items-center gap-1 text-xs text-muted-foreground'>
              Current Market Value
              {valueIsEstimate && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AlertTriangle className='h-3 w-3 cursor-help text-amber-500' />
                  </TooltipTrigger>
                  <TooltipContent className='max-w-[200px]'>
                    <p className='text-xs'>
                      Value is estimated due to mixed currencies or missing price data.
                    </p>
                  </TooltipContent>
                </Tooltip>
              )}
            </p>
            <p className='text-lg font-bold'>{formatCurrency(currentMarketValue, currency)}</p>
          </div>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-xs text-muted-foreground'>Total Amount Invested</p>
              <p className='font-medium'>{formatCurrency(totalInvestedAmount, currency)}</p>
            </div>
            <div className='text-right'>
              <p className={`text-xs ${gainLossColor} flex items-center justify-end gap-1`}>
                Overall Gain/Loss
                {valueIsEstimate && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <AlertTriangle className='h-3 w-3 cursor-help text-amber-500' />
                    </TooltipTrigger>
                    <TooltipContent className='max-w-[200px]'>
                      <p className='text-xs'>Gain/Loss is estimated.</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </p>
              <p className={`flex items-center justify-end gap-1 font-semibold ${gainLossColor}`}>
                <GainLossIcon className='h-4 w-4' />
                {formatCurrency(overallGainLoss, currency)}({overallGainLossPercentage?.toFixed(2)}
                %)
              </p>
            </div>
          </div>
          <div>
            <p className='text-xs text-muted-foreground'>Total Dividends Received</p>
            <p className='font-medium text-green-600'>{formatCurrency(totalDividends, currency)}</p>
          </div>

          <p className='flex items-center gap-1 pt-2 text-xs text-muted-foreground'>
            <Package className='h-3 w-3' />
            {numberOfHoldings} holding(s) tracked.
          </p>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};
