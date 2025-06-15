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
          <Skeleton className='h-[180px] w-full' />
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
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <CardDescription className='text-xs'>
          {numberOfHoldings} holding(s) across {numberOfAccounts} account(s)
          {valueIsEstimate && (
            <TooltipElement tooltipContent='Values are estimated due to mixed currencies or missing price data.'>
              <AlertTriangle className='ml-1 inline-block h-3 w-3 text-amber-500' />
            </TooltipElement>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='flex items-center gap-2 max-sm:flex-col max-sm:justify-center'>
          <Tabs value={selectedPeriod} onValueChange={handlePeriodChange} className='w-fit'>
            <TabsList className='h-7 p-1'>
              {availablePeriodOptions.map((option) => (
                <TabsTrigger
                  key={option.value}
                  value={option.value}
                  className='px-2 py-0.5 text-xs'
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
              className='w-[260px]'
              placeholder='Select dates'
              noLabel
              minDate={oldestDate}
              maxDate={new Date()}
            />
          )}
        </div>

        {isHistoricalLoading ? (
          <Skeleton className='h-[180px] w-full' />
        ) : sparklineData.length > 1 ? (
          <div className='h-[180px] w-full'>
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
                          <div className='bg-background/95 rounded-lg border px-3 py-2 text-sm shadow-lg backdrop-blur-sm'>
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
          <div className='text-muted-foreground flex h-[180px] items-center justify-center text-sm'>
            Not enough data for trendline.
          </div>
        )}

        <div className='grid gap-4'>
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <div className='text-muted-foreground text-sm font-medium'>Current Value</div>
              <div className='text-2xl font-bold'>
                {formatCurrency(currentMarketValue, currency)}
              </div>
            </div>
            <div>
              <div className='text-muted-foreground text-sm font-medium'>Total Invested</div>
              <div className='text-2xl font-bold'>
                {formatCurrency(totalInvestedAmount, currency)}
              </div>
            </div>
          </div>

          <div className='grid grid-cols-2 gap-4 rounded-lg border p-3'>
            <div>
              <div className={`flex items-center gap-1 text-sm font-medium ${gainLossColor}`}>
                <GainLossIcon className='h-4 w-4' />
                Total Return
              </div>
              <div className={`text-lg font-bold ${gainLossColor}`}>
                {formatCurrency(overallGainLoss, currency)}
                <span className='text-sm'> ({overallGainLossPercentage?.toFixed(1)}%)</span>
              </div>
            </div>
            <div>
              <div className='text-muted-foreground text-sm font-medium'>Total Dividends</div>
              <div className='text-lg font-bold text-green-600'>
                {formatCurrency(totalDividends, currency)}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <div className='mt-auto border-t p-3 text-center'>
        <Button variant='link' size='sm' asChild className='text-xs font-medium'>
          <Link href='/investment'>Manage Investments</Link>
        </Button>
      </div>
    </Card>
  );
};
