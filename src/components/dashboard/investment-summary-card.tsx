import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

  if (isLoading) return <Loader />;

  if (error || !summaryData || summaryData.numberOfHoldings === 0) {
    return (
      <NoData
        message={error ? 'Could not load data.' : 'No investments tracked yet.'}
        icon={error ? 'xCircle' : 'inbox'}
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
  const returnIcon = isPositiveReturn
    ? 'trendingUp'
    : overallGainLoss < 0
      ? 'trendingDown'
      : 'minus';

  return (
    <Card className={cn('flex h-full flex-col shadow-sm', className)}>
      <CardHeader className='pb-4'>
        <CardTitle className='text-lg font-semibold tracking-tight'>
          {numberOfHoldings} holding{numberOfHoldings !== 1 ? 's' : ''} across {numberOfAccounts}{' '}
          account{numberOfAccounts !== 1 ? 's' : ''}
          {valueIsEstimate && (
            <TooltipElement tooltipContent='Values are estimated due to mixed currencies or missing price data.'>
              <span className='bg-warning-muted text-warning-foreground ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium'>
                <Icon name='alertTriangle' className='mr-1 h-3 w-3' />
                Est.
              </span>
            </TooltipElement>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className='flex flex-1 flex-col items-stretch justify-evenly gap-2'>
        <div className='grid grid-cols-2 gap-4'>
          <MetricCard
            label='Current Value'
            value={formatCurrency(currentMarketValue, currency)}
            icon={<Icon name={returnIcon} className='h-4 w-4' />}
            variant='primary'
          />
          <MetricCard
            label='Total Invested'
            value={formatCurrency(totalInvestedAmount, currency)}
            icon={<Icon name='piggyBank' className='h-4 w-4' />}
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
            highlight={true}
          />
          <MetricCard
            label='Dividends Earned'
            value={formatCurrency(totalDividends, currency)}
            icon={<Icon name='trendingUp' className='h-4 w-4' />}
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
          container: 'bg-primary-muted border border-primary/20',
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
          container: 'bg-success-muted border border-success-muted',
          text: 'text-success',
          icon: 'text-success'
        };
      case 'negative':
        return {
          container: 'bg-destructive-muted border border-destructive-muted',
          text: 'text-destructive',
          icon: 'text-destructive'
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
      <div className='flex items-center gap-2'>
        <div className={cn('text-xl leading-none font-bold', styles.text)}>{value}</div>
        {secondaryValue && (
          <div className={cn('text-sm font-medium opacity-80', styles.text)}>{secondaryValue}</div>
        )}
      </div>
    </div>
  );
};
