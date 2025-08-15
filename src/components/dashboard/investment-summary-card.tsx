import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn, formatCurrency } from '@/lib/utils';
import NoData from '../ui/no-data';
import { investmentGetPortfolioSummary } from '@/lib/endpoints/investment';
import { useToast } from '@/lib/hooks/useToast';
import Link from 'next/link';
import { Button } from '../ui/button';
import TooltipElement from '../ui/tooltip-element';
import Loader from '../ui/loader';
import { Icon } from '../ui/icon';

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

  if (isLoading) {
    return (
      <Card className={cn('flex h-full min-h-[400px] items-center justify-center', className)}>
        <Loader />
      </Card>
    );
  }

  if (error || !summaryData || summaryData.numberOfHoldings === 0) {
    return (
      <Card className={cn('flex h-full min-h-[400px] flex-col', className)}>
        <CardHeader>
          <CardTitle className='text-lg'>Investment Summary</CardTitle>
          <CardDescription>Portfolio overview</CardDescription>
        </CardHeader>
        <CardContent className='flex flex-1 items-center justify-center'>
          <NoData
            message={error ? 'Could not load data.' : 'No investments tracked yet.'}
            icon={error ? 'xCircle' : 'inbox'}
          />
        </CardContent>
      </Card>
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
  const returnIcon = isPositiveReturn ? 'trendingUp' : 'trendingDown';

  return (
    <Card className={cn('flex h-full flex-col shadow-sm', className)}>
      <CardHeader className='text-lg font-semibold'>
        {numberOfHoldings} holding{numberOfHoldings !== 1 ? 's' : ''} across {numberOfAccounts}{' '}
        account{numberOfAccounts !== 1 ? 's' : ''}
        {valueIsEstimate && (
          <TooltipElement tooltipContent='Values are estimated due to mixed currencies or missing price data.'>
            <span className='bg-warning/10 text-warning ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium'>
              <Icon name='alertTriangle' className='mr-1 h-3 w-3' />
              Est.
            </span>
          </TooltipElement>
        )}
      </CardHeader>

      <CardContent className='flex flex-1 flex-col justify-evenly gap-4'>
        <div className='grid grid-cols-2 gap-4'>
          <MetricCard
            label='Current Value'
            value={formatCurrency(currentMarketValue, currency)}
            icon={<Icon name='trendingUp' className='h-4 w-4' />}
            variant='primary'
          />
          <MetricCard
            label='Total Invested'
            value={formatCurrency(totalInvestedAmount, currency)}
            icon={<Icon name='wallet' className='h-4 w-4' />}
            variant='secondary'
          />
        </div>

        <div className='grid grid-cols-2 gap-4'>
          <MetricCard
            label='Total Return'
            value={formatCurrency(overallGainLoss, currency)}
            secondaryValue={`${overallGainLossPercentage?.toFixed(1) ?? '0.0'}%`}
            icon={<Icon name={returnIcon} className='h-4 w-4' />}
            variant={returnVariant}
          />
          <MetricCard
            label='Dividends Earned'
            value={formatCurrency(totalDividends, currency)}
            icon={<Icon name='receipt' className='h-4 w-4' />}
            variant='positive'
          />
        </div>
      </CardContent>

      <div className='border-t p-2 text-center'>
        <Button variant='link' size='sm' asChild className='text-xs'>
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
}> = ({ label, value, secondaryValue, icon, variant = 'default' }) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          container: 'bg-primary/5 border border-primary/10',
          text: 'text-primary',
          icon: 'text-primary'
        };
      case 'secondary':
        return {
          container: 'bg-muted/30 border border-border/50',
          text: 'text-foreground',
          icon: 'text-muted-foreground'
        };
      case 'positive':
        return {
          container: 'bg-positive/5 border border-positive/10',
          text: 'text-positive',
          icon: 'text-positive'
        };
      case 'negative':
        return {
          container: 'bg-negative/5 border border-negative/10',
          text: 'text-negative',
          icon: 'text-negative'
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
    <div className={cn('rounded-lg p-3 transition-all duration-200', styles.container)}>
      <div className='mb-2 flex items-center gap-2'>
        {icon && <div className={cn('flex-shrink-0', styles.icon)}>{icon}</div>}
        <div className='text-muted-foreground text-xs font-medium tracking-wider uppercase'>
          {label}
        </div>
      </div>
      <div className='flex items-baseline gap-2'>
        <div className={cn('text-2xl leading-none font-bold', styles.text)}>{value}</div>
        {secondaryValue && (
          <div className={cn('text-sm font-medium', styles.text)}>{secondaryValue}</div>
        )}
      </div>
    </div>
  );
};
