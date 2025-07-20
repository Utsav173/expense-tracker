'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn, formatCurrency } from '@/lib/utils';
import NoData from '../ui/no-data';
import { WalletCards, TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';
import {
  investmentGetPortfolioSummary,
  investmentGetPortfolioHistorical,
  investmentGetOldestDate
} from '@/lib/endpoints/investment';
import { useToast } from '@/lib/hooks/useToast';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  YAxis,
  XAxis
} from 'recharts';
import {
  parseISO,
  format,
  differenceInDays,
  startOfToday,
  subDays,
  format as formatDate
} from 'date-fns';
import Link from 'next/link';
import { Button } from '../ui/button';
import TooltipElement from '../ui/tooltip-element';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DateRange } from 'react-day-picker';
import DateRangePickerV2 from '../date/date-range-picker-v2';
import { ChartContainer, ChartConfig } from '@/components/ui/chart';
import Loader from '../ui/loader';

type PeriodOption = '7d' | '30d' | '90d' | '1y' | 'custom';

const PERIOD_OPTIONS = [
  { value: '7d' as const, label: '7D' },
  { value: '30d' as const, label: '30D' },
  { value: '90d' as const, label: '90D' },
  { value: '1y' as const, label: '1Y' },
  { value: 'custom' as const, label: 'Custom' }
];

const chartConfig = {
  value: {
    label: 'Portfolio Value',
    color: 'var(--chart-1)'
  }
} satisfies ChartConfig;

const getAvailablePeriods = (oldestDate?: Date) => {
  if (!oldestDate) return PERIOD_OPTIONS;

  const daysSinceOldest = differenceInDays(new Date(), oldestDate);
  const baseOptions = PERIOD_OPTIONS.slice(0, 2); // 7D, 30D

  if (daysSinceOldest <= 35) {
    return [...baseOptions, PERIOD_OPTIONS[4]]; // Add Custom
  }
  if (daysSinceOldest <= 95) {
    return [...baseOptions, PERIOD_OPTIONS[2], PERIOD_OPTIONS[4]]; // Add 90D, Custom
  }

  return PERIOD_OPTIONS;
};

const MetricCard: React.FC<{
  label: string;
  value: string;
  secondaryValue?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'positive' | 'negative';
  className?: string;
}> = ({ label, value, secondaryValue, icon, variant = 'default', className }) => {
  const colorClass =
    variant === 'positive'
      ? 'text-emerald-600 dark:text-emerald-400'
      : variant === 'negative'
        ? 'text-red-600 dark:text-red-400'
        : 'text-foreground';

  return (
    <div className={cn('space-y-1', className)}>
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

export const InvestmentSummaryCard: React.FC<{
  className?: string;
}> = ({ className }) => {
  const { showError } = useToast();
  const [selectedPeriod, setSelectedPeriod] = React.useState<PeriodOption>('30d');
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>();
  const [oldestDate, setOldestDate] = React.useState<Date>();

  // Fetch oldest date once
  React.useEffect(() => {
    investmentGetOldestDate()
      .then((res) => res?.oldestDate && setOldestDate(new Date(res.oldestDate)))
      .catch(() => {});
  }, []);

  const availablePeriods = React.useMemo(() => getAvailablePeriods(oldestDate), [oldestDate]);

  // Adjust period if not available
  React.useEffect(() => {
    if (
      !availablePeriods.find((opt) => opt.value === selectedPeriod) &&
      selectedPeriod !== 'custom'
    ) {
      setSelectedPeriod('30d');
    }
  }, [availablePeriods, selectedPeriod]);

  const handlePeriodChange = (value: string) => {
    const period = value as PeriodOption;
    setSelectedPeriod(period);

    if (period === 'custom' && !dateRange) {
      const today = startOfToday();
      setDateRange({ from: subDays(today, 30), to: today });
    } else if (period !== 'custom') {
      setDateRange(undefined);
    }
  };

  // Queries
  const {
    data: summaryData,
    isLoading: isSummaryLoading,
    error: summaryError
  } = useQuery({
    queryKey: ['investmentPortfolioSummaryDashboard'],
    queryFn: investmentGetPortfolioSummary,
    retry: 1,
    staleTime: 15 * 60 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: true
  });

  const {
    data: historicalData,
    isLoading: isHistoricalLoading,
    error: historicalError
  } = useQuery({
    queryKey: ['investmentPortfolioHistoricalDashboard', selectedPeriod, dateRange],
    queryFn: () => {
      if (selectedPeriod === 'custom' && dateRange?.from && dateRange?.to) {
        return investmentGetPortfolioHistorical({
          startDate: formatDate(dateRange.from, 'yyyy-MM-dd'),
          endDate: formatDate(dateRange.to, 'yyyy-MM-dd')
        });
      }
      return investmentGetPortfolioHistorical({
        period: selectedPeriod === 'custom' ? '30d' : selectedPeriod
      });
    },
    enabled:
      !!summaryData?.numberOfHoldings &&
      (selectedPeriod !== 'custom' || (!!dateRange?.from && !!dateRange?.to)),
    retry: 1,
    staleTime: 60 * 60 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: true
  });

  // Error handling
  React.useEffect(() => {
    if (summaryError) showError(`Investment Summary Error: ${(summaryError as Error).message}`);
    if (historicalError)
      showError(`Investment History Error: ${(historicalError as Error).message}`);
  }, [summaryError, historicalError, showError]);

  // Loading and error states
  if (isSummaryLoading) return <Loader />;

  const hasData = summaryData && summaryData.numberOfHoldings > 0;
  const displayError = summaryError || (!hasData && historicalError);

  if (displayError || !hasData) {
    return (
      <NoData
        message={displayError ? 'Could not load data.' : 'No investments tracked yet.'}
        icon={displayError ? 'x-circle' : 'inbox'}
      />
    );
  }

  // Data processing
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

  const isPositiveReturn = overallGainLoss > 0;
  const isNegativeReturn = overallGainLoss < 0;
  const returnVariant = isPositiveReturn ? 'positive' : isNegativeReturn ? 'negative' : 'default';
  const ReturnIcon = isPositiveReturn ? TrendingUp : isNegativeReturn ? TrendingDown : Minus;

  const chartData =
    historicalData?.data
      ?.map((d) => ({ date: parseISO(d.date), value: d.value }))
      .sort((a, b) => a.date.getTime() - b.date.getTime()) || [];

  const chartColor = isPositiveReturn ? 'var(--positive)' : 'var(--destructive)';

  return (
    <Card className={cn('flex flex-col', className)}>
      <CardHeader className='pb-4'>
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
        {/* Period Controls */}
        <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
          <Tabs
            value={selectedPeriod}
            onValueChange={handlePeriodChange}
            className='w-full sm:w-auto'
          >
            <TabsList className='grid h-9 w-full grid-cols-5 sm:flex sm:w-auto'>
              {availablePeriods.map(({ value, label }) => (
                <TabsTrigger key={value} value={value} className='text-xs sm:text-sm'>
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          {selectedPeriod === 'custom' && (
            <DateRangePickerV2
              date={dateRange}
              onDateChange={setDateRange}
              className='w-full sm:w-[280px]'
              placeholder='Select date range'
              noLabel
              minDate={oldestDate}
              maxDate={new Date()}
            />
          )}
        </div>

        {/* Chart */}
        {isHistoricalLoading ? (
          <div className='h-32 sm:h-40'>
            <Loader />
          </div>
        ) : chartData.length > 1 ? (
          <div className='h-32 sm:h-40'>
            <ChartContainer config={chartConfig} className='h-full w-full'>
              <ResponsiveContainer width='100%' height='100%'>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id='portfolioGradient' x1='0' y1='0' x2='0' y2='1'>
                      <stop offset='0%' stopColor={chartColor} stopOpacity={0.3} />
                      <stop offset='100%' stopColor={chartColor} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <YAxis domain={['dataMin', 'dataMax']} hide />
                  <XAxis dataKey='date' hide />
                  <RechartsTooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.[0]?.payload) return null;
                      const data = payload[0].payload;
                      return (
                        <div className='bg-background/95 rounded-lg border px-3 py-2 text-sm shadow-lg backdrop-blur'>
                          <div className='font-medium'>{format(data.date, 'MMM d, yyyy')}</div>
                          <div className='text-muted-foreground'>
                            {formatCurrency(data.value, currency)}
                          </div>
                        </div>
                      );
                    }}
                    cursor={{ stroke: 'var(--border)', strokeDasharray: '2 2' }}
                  />
                  <Area
                    type='monotone'
                    dataKey='value'
                    stroke={chartColor}
                    strokeWidth={2}
                    fill='url(#portfolioGradient)'
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        ) : (
          <div className='text-muted-foreground flex h-32 items-center justify-center text-sm sm:h-40'>
            Insufficient data for chart
          </div>
        )}

        {/* Metrics Grid */}
        <div className='grid gap-6'>
          {/* Primary Metrics */}
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
            <MetricCard
              label='Current Value'
              value={formatCurrency(currentMarketValue, currency)}
            />
            <MetricCard
              label='Total Invested'
              value={formatCurrency(totalInvestedAmount, currency)}
            />
          </div>

          {/* Returns Section */}
          <div className='bg-muted/50 rounded-lg p-4'>
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
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
          </div>
        </div>
      </CardContent>

      {/* Footer */}
      <div className='mt-auto border-t p-3 text-center'>
        <Button variant='link' size='sm' asChild className='w-full text-xs font-medium sm:w-auto'>
          <Link href='/investment'>Manage Investments</Link>
        </Button>
      </div>
    </Card>
  );
};
