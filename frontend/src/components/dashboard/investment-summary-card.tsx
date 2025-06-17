'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PortfolioSummary } from '@/lib/types';
import { cn, formatCurrency } from '@/lib/utils';
import NoData from '../ui/no-data';
import { WalletCards, TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';
import {
  investmentGetPortfolioSummary,
  investmentGetPortfolioHistorical,
  investmentGetOldestDate
} from '@/lib/endpoints/investment';
import { Skeleton } from '../ui/skeleton';
import { useToast } from '@/lib/hooks/useToast';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  YAxis,
  XAxis
} from 'recharts';
import { parseISO, format, differenceInDays } from 'date-fns';
import Link from 'next/link';
import { Button } from '../ui/button';
import TooltipElement from '../ui/tooltip-element';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DateRange } from 'react-day-picker';
import { format as formatDate, startOfToday, subDays } from 'date-fns';
import DateRangePickerV2 from '../date/date-range-picker-v2';
import { ChartContainer, ChartConfig } from '@/components/ui/chart';

type PeriodOption = '7d' | '30d' | '90d' | '1y' | 'custom';

const PERIOD_OPTIONS: { value: PeriodOption; label: string }[] = [
  { value: '7d', label: '7D' },
  { value: '30d', label: '30D' },
  { value: '90d', label: '90D' },
  { value: '1y', label: '1Y' },
  { value: 'custom', label: 'Custom' }
];

const getAvailablePeriodOptions = (
  oldestDate: Date | undefined
): { value: PeriodOption; label: string }[] => {
  if (!oldestDate) return PERIOD_OPTIONS;

  const daysSinceOldest = differenceInDays(new Date(), oldestDate);
  const baseOptions = [
    { value: '7d' as const, label: '7D' },
    { value: '30d' as const, label: '30D' }
  ];

  if (daysSinceOldest <= 35) {
    return [...baseOptions, { value: 'custom', label: 'Custom' }];
  }

  if (daysSinceOldest <= 95) {
    return [...baseOptions, { value: '90d', label: '90D' }, { value: 'custom', label: 'Custom' }];
  }

  return PERIOD_OPTIONS;
};

const sparklineChartConfig = {
  value: {
    label: 'Portfolio Value',
    color: 'var(--chart-investment)'
  }
} satisfies ChartConfig;

export const InvestmentSummaryCard: React.FC<{
  className?: string;
}> = ({ className }) => {
  const { showError } = useToast();
  const [selectedPeriod, setSelectedPeriod] = React.useState<PeriodOption>('30d');
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(undefined);
  const [oldestDate, setOldestDate] = React.useState<Date | undefined>(undefined);

  const handlePeriodChange = (value: string) => {
    const period = value as PeriodOption;
    setSelectedPeriod(period);
    if (period !== 'custom') {
      setDateRange(undefined);
    } else if (!dateRange) {
      const today = startOfToday();
      setDateRange({
        from: subDays(today, 30),
        to: today
      });
    }
  };

  const {
    data: summaryData,
    isLoading: isSummaryLoading,
    error: summaryError
  } = useQuery<PortfolioSummary | null>({
    queryKey: ['investmentPortfolioSummaryDashboard'],
    queryFn: () => investmentGetPortfolioSummary(),
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
      !!summaryData &&
      summaryData.numberOfHoldings > 0 &&
      (selectedPeriod !== 'custom' || (!!dateRange?.from && !!dateRange?.to)),
    retry: 1,
    staleTime: 60 * 60 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: true
  });

  const availablePeriodOptions = React.useMemo(
    () => getAvailablePeriodOptions(oldestDate),
    [oldestDate]
  );

  React.useEffect(() => {
    if (summaryError) showError(`Investment Summary Error: ${(summaryError as Error).message}`);
    if (historicalError)
      showError(`Investment History Error: ${(historicalError as Error).message}`);
  }, [summaryError, historicalError, showError]);

  React.useEffect(() => {
    investmentGetOldestDate()
      .then((res) => {
        if (res?.oldestDate) {
          setOldestDate(new Date(res.oldestDate));
        }
      })
      .catch(() => {});
  }, []);

  React.useEffect(() => {
    if (
      !availablePeriodOptions.find((opt) => opt.value === selectedPeriod) &&
      selectedPeriod !== 'custom'
    ) {
      setSelectedPeriod('30d');
    }
  }, [availablePeriodOptions, selectedPeriod]);

  const isLoading = isSummaryLoading;
  const hasData = summaryData && summaryData.numberOfHoldings > 0;
  const displayError = summaryError || (!hasData && historicalError);

  if (isLoading) {
    return (
      <Card className={cn('col-span-1 md:col-span-1', className)}>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-base font-semibold'>Investment Summary</CardTitle>
          <WalletCards className='text-muted-foreground h-4 w-4' />
        </CardHeader>
        <CardContent className='space-y-4'>
          <Skeleton className='h-4 w-3/5' />
          <Skeleton className='h-[160px] w-full sm:h-[180px]' />
          <div className='grid gap-4'>
            <Skeleton className='h-8 w-full' />
            <Skeleton className='h-8 w-full' />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (displayError || !hasData) {
    return (
      <Card className={cn('col-span-1 flex flex-col md:col-span-1', className)}>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-base font-semibold'>Investment Summary</CardTitle>
          <WalletCards className='text-muted-foreground h-4 w-4' />
        </CardHeader>
        <CardContent className='h-full grow'>
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
    totalInvestedAmount,
    totalDividends,
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
        date: parseISO(d.date),
        value: d.value
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime()) || [];

  const sparklineColorVarName =
    overallGainLoss >= 0 ? 'var(--color-chart-investment)' : 'var(--color-chart-expense)';

  return (
    <Card className={cn('col-span-1 flex flex-col md:col-span-1', className)}>
      {/* Mobile-optimized Header */}
      <CardHeader className='pb-3'>
        <div className='flex items-start justify-between gap-2'>
          <div className='min-w-0 flex-1'>
            <CardTitle className='mb-1 text-base font-semibold sm:text-lg'>
              Investment Summary
            </CardTitle>
            <CardDescription className='text-xs leading-relaxed'>
              <span className='block sm:inline'>
                {numberOfHoldings} holding(s) across {numberOfAccounts} account(s)
              </span>
              {valueIsEstimate && (
                <TooltipElement tooltipContent='Values are estimated due to mixed currencies or missing price data.'>
                  <span className='ml-1 inline-flex items-center text-amber-500'>
                    <AlertTriangle className='mr-1 h-3 w-3' />
                    <span className='hidden text-xs sm:inline'>Est.</span>
                  </span>
                </TooltipElement>
              )}
            </CardDescription>
          </div>
          <WalletCards className='text-muted-foreground mt-0.5 h-4 w-4 flex-shrink-0' />
        </div>
      </CardHeader>

      <CardContent className='flex-1 space-y-4'>
        {/* Mobile-optimized Controls */}
        <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-2'>
          <Tabs
            value={selectedPeriod}
            onValueChange={handlePeriodChange}
            className='w-full sm:w-fit'
          >
            <TabsList className='grid h-8 w-full grid-cols-5 p-0.5 sm:flex sm:h-7 sm:w-auto sm:p-1'>
              {availablePeriodOptions.map((option) => (
                <TabsTrigger
                  key={option.value}
                  value={option.value}
                  className='px-1 py-1 text-xs sm:px-2 sm:py-0.5'
                >
                  {option.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          {selectedPeriod === 'custom' && (
            <DateRangePickerV2
              date={dateRange}
              onDateChange={setDateRange}
              className='w-full sm:w-[260px]'
              placeholder='Select dates'
              noLabel
              minDate={oldestDate}
              maxDate={new Date()}
            />
          )}
        </div>

        {/* Mobile-optimized Chart */}
        {isHistoricalLoading ? (
          <Skeleton className='h-[140px] w-full sm:h-[180px]' />
        ) : sparklineData.length > 1 ? (
          <div className='h-[140px] w-full sm:h-[180px]'>
            <ChartContainer
              config={sparklineChartConfig}
              className='h-full w-full'
              aria-label={`Sparkline area chart showing portfolio value trend for the selected period (${selectedPeriod})`}
            >
              <ResponsiveContainer width='100%' height='100%'>
                <AreaChart data={sparklineData}>
                  <defs>
                    <linearGradient id='sparklineValue' x1='0' y1='0' x2='0' y2='1'>
                      <stop offset='0%' stopColor={sparklineColorVarName} stopOpacity={0.4} />
                      <stop offset='50%' stopColor={sparklineColorVarName} stopOpacity={0.1} />
                      <stop offset='100%' stopColor={sparklineColorVarName} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <YAxis domain={['dataMin', 'dataMax']} hide />
                  <XAxis dataKey='date' hide />
                  <RechartsTooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className='bg-background/95 rounded-lg border px-2 py-1.5 text-xs shadow-lg backdrop-blur-sm sm:px-3 sm:py-2 sm:text-sm'>
                            <div className='font-medium'>{format(data.date, 'MMM d, yyyy')}</div>
                            <div className='text-muted-foreground'>
                              {formatCurrency(data.value, currency)}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                    cursor={{
                      stroke: 'var(--border)',
                      strokeWidth: 1,
                      strokeDasharray: '3 3'
                    }}
                  />
                  <Area
                    type='monotone'
                    dataKey='value'
                    stroke={sparklineColorVarName}
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill='url(#sparklineValue)'
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        ) : (
          <div className='text-muted-foreground flex h-[140px] items-center justify-center text-xs sm:h-[180px] sm:text-sm'>
            Not enough data for trendline.
          </div>
        )}

        {/* Mobile-optimized Values Grid */}
        <div className='space-y-4'>
          {/* Current Value & Total Invested - Responsive Grid */}
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
            <div className='text-center sm:text-left'>
              <div className='text-muted-foreground mb-1 text-xs font-medium sm:text-sm'>
                Current Value
              </div>
              <div className='text-xl leading-tight font-bold break-all sm:text-2xl'>
                {formatCurrency(currentMarketValue, currency)}
              </div>
            </div>
            <div className='text-center sm:text-left'>
              <div className='text-muted-foreground mb-1 text-xs font-medium sm:text-sm'>
                Total Invested
              </div>
              <div className='text-xl leading-tight font-bold break-all sm:text-2xl'>
                {formatCurrency(totalInvestedAmount, currency)}
              </div>
            </div>
          </div>

          {/* Returns & Dividends - Mobile Optimized */}
          <div className='bg-muted/30 space-y-3 rounded-lg p-3 sm:space-y-0'>
            <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4'>
              <div className='text-center sm:text-left'>
                <div
                  className={`mb-1 flex items-center justify-center gap-1 text-xs font-medium sm:justify-start sm:text-sm ${gainLossColor}`}
                >
                  <GainLossIcon className='h-3 w-3 sm:h-4 sm:w-4' />
                  Total Return
                </div>
                <div className={`font-bold ${gainLossColor}`}>
                  <div className='text-base leading-tight break-all sm:text-lg'>
                    {formatCurrency(overallGainLoss, currency)}
                  </div>
                  <div className='text-xs opacity-90 sm:text-sm'>
                    ({overallGainLossPercentage?.toFixed(1)}%)
                  </div>
                </div>
              </div>
              <div className='border-t pt-3 text-center sm:border-t-0 sm:pt-0 sm:text-left'>
                <div className='text-muted-foreground mb-1 text-xs font-medium sm:text-sm'>
                  Total Dividends
                </div>
                <div className='text-base leading-tight font-bold break-all text-green-600 sm:text-lg'>
                  {formatCurrency(totalDividends, currency)}
                </div>
              </div>
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
