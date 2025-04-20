import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PortfolioSummary } from '@/lib/types';
import { cn, formatCurrency } from '@/lib/utils';
import NoData from '../ui/no-data';
import {
  WalletCards,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  InfoIcon
} from 'lucide-react';
import {
  investmentGetPortfolioSummary,
  investmentGetPortfolioHistorical
} from '@/lib/endpoints/investment';
import { Skeleton } from '../ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { useToast } from '@/lib/hooks/useToast';
import { LineChart, Line, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { parseISO, format } from 'date-fns';
import Link from 'next/link';
import { Button } from '../ui/button';
import TooltipElement from '../ui/tooltip-element';

export const InvestmentSummaryCard: React.FC<{
  className?: string;
}> = ({ className }) => {
  const { showError } = useToast();

  const {
    data: summaryData,
    isLoading: isSummaryLoading,
    error: summaryError
  } = useQuery<PortfolioSummary | null>({
    queryKey: ['investmentPortfolioSummaryDashboard'],
    queryFn: () => investmentGetPortfolioSummary(),
    retry: 1,
    staleTime: 15 * 60 * 1000
  });

  const {
    data: historicalData,
    isLoading: isHistoricalLoading,
    error: historicalError
  } = useQuery({
    queryKey: ['investmentPortfolioHistoricalDashboard', '30d'],
    queryFn: () => investmentGetPortfolioHistorical({ period: '30d' }),
    enabled: !!summaryData && summaryData.numberOfHoldings > 0,
    retry: 1,
    staleTime: 60 * 60 * 1000
  });

  React.useEffect(() => {
    if (summaryError) showError(`Investment Summary Error: ${(summaryError as Error).message}`);
    if (historicalError)
      showError(`Investment History Error: ${(historicalError as Error).message}`);
  }, [summaryError, historicalError, showError]);

  const isLoading = isSummaryLoading;
  const hasData = summaryData && summaryData.numberOfHoldings > 0;
  const displayError = summaryError || (!hasData && historicalError);

  if (isLoading) {
    return (
      <Card className={cn('col-span-1 md:col-span-1', className)}>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <WalletCards className='h-5 w-5 text-blue-500' />
            Investment Summary
          </CardTitle>
          <Skeleton className='h-4 w-3/5' />
        </CardHeader>
        <CardContent className='h-[250px] space-y-4 pt-2'>
          <Skeleton className='h-5 w-1/2' />
          <Skeleton className='h-8 w-3/4' />
          <div className='flex justify-between'>
            <Skeleton className='h-4 w-2/5' />
            <Skeleton className='h-4 w-1/3' />
          </div>
          <Skeleton className='h-10 w-full' />
        </CardContent>
      </Card>
    );
  }

  if (displayError || !hasData) {
    return (
      <Card className={cn('col-span-1 flex flex-col md:col-span-1', className)}>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <WalletCards className='h-5 w-5 text-blue-500' />
            Investment Summary
          </CardTitle>
          <CardDescription>Overview of your investments.</CardDescription>
        </CardHeader>
        <CardContent className='h-[250px] flex-grow'>
          <NoData
            message={displayError ? 'Could not load data.' : 'No investments tracked yet.'}
            icon={displayError ? 'x-circle' : 'inbox'}
          />
        </CardContent>
        {!displayError && !hasData && (
          <div className='border-t p-3 text-center'>
            <Button variant='link' size='sm' asChild className='text-xs'>
              <Link href='/investment'>Add Investments</Link>
            </Button>
          </div>
        )}
      </Card>
    );
  }

  const {
    currentMarketValue,
    overallGainLoss,
    overallGainLossPercentage,
    numberOfAccounts,
    numberOfHoldings,
    currency,
    valueIsEstimate
  } = summaryData;

  const gainLossColor =
    overallGainLoss > 0
      ? 'text-green-600'
      : overallGainLoss < 0
        ? 'text-red-600'
        : 'text-muted-foreground';
  const GainLossIcon =
    overallGainLoss > 0 ? TrendingUp : overallGainLoss < 0 ? TrendingDown : Minus;

  const sparklineData =
    historicalData?.data
      ?.map((d) => ({
        date: parseISO(d.date).getTime(),
        value: d.value
      }))
      .sort((a, b) => a.date - b.date) || [];

  const sparklineColor = overallGainLoss >= 0 ? 'hsl(var(--chart-2))' : 'hsl(var(--chart-5))';

  return (
    <TooltipProvider>
      <Card className={cn('col-span-1 flex flex-col md:col-span-1', className)}>
        <CardHeader>
          <CardDescription className='flex flex-row items-center gap-2'>
            {numberOfHoldings} holding(s) across {numberOfAccounts} account(s).
            <TooltipElement
              tooltipContent={
                valueIsEstimate
                  ? 'Values are estimated due to mixed currencies or missing price data.'
                  : 'Values are Actual based on currencies and market prices.'
              }
            >
              <InfoIcon className='h-4 w-4' />
            </TooltipElement>
          </CardDescription>
        </CardHeader>
        <CardContent className='flex-grow space-y-3 text-sm'>
          {isHistoricalLoading ? (
            <Skeleton className='mb-2 h-10 w-full' />
          ) : sparklineData.length > 1 ? (
            <div className='mb-2 h-10 w-full'>
              <ResponsiveContainer width='100%' height='100%'>
                <LineChart data={sparklineData}>
                  <RechartsTooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length && label) {
                        return (
                          <div className='rounded-sm border bg-popover/90 px-2 py-1 text-xs shadow-sm backdrop-blur-sm'>
                            {`${format(new Date(label), 'MMM d')}: ${formatCurrency(payload[0].value as number, currency)}`}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line
                    type='monotone'
                    dataKey='value'
                    stroke={sparklineColor}
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className='mb-2 h-10' />
          )}

          <div className='flex items-baseline justify-between pt-1'>
            <p className='text-xs text-muted-foreground'>Current Value</p>
            <p className='text-lg font-bold'>{formatCurrency(currentMarketValue, currency)}</p>
          </div>
          <div className='flex items-baseline justify-between'>
            <p className={`flex items-center gap-1 text-xs ${gainLossColor}`}>
              <GainLossIcon className='h-3 w-3' />
              Gain/Loss
              {valueIsEstimate && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AlertTriangle className='h-3 w-3 cursor-help text-amber-500' />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className='text-xs'>Gain/Loss is estimated.</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </p>
            <p className={`text-sm font-semibold ${gainLossColor}`}>
              {formatCurrency(overallGainLoss, currency)} ({overallGainLossPercentage?.toFixed(1)}%)
            </p>
          </div>
        </CardContent>
        <div className='border-t p-3 text-center'>
          <Button variant='link' size='sm' asChild className='text-xs'>
            <Link href='/investment'>Manage Investments</Link>
          </Button>
        </div>
      </Card>
    </TooltipProvider>
  );
};
