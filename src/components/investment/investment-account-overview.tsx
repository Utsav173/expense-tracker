'use client';

import React, { useMemo, useState } from 'react';
import DateRangePickerV2 from '@/components/date/date-range-picker-v2';
import { DateRange } from 'react-day-picker';
import { useQuery } from '@tanstack/react-query';
import {
  Area,
  AreaChart as RechartsAreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { cn, formatCurrency } from '@/lib/utils';
import type { InvestmentAccountAPI } from '@/lib/api/api-types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartConfig } from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import NoData from '../ui/no-data';
import { SingleLineEllipsis } from '../ui/ellipsis-components';
import { investmentAccountGetPerformance } from '@/lib/endpoints/investmentAccount';
import { Button } from '../ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { IconName } from '../ui/icon-map';
import { Icon } from '../ui/icon';

interface KpiCardProps {
  title: string;
  value: number;
  currency: string;
  icon: IconName;
  isLoading: boolean;
  changePercent?: number;
  valuePrefix?: string;
  colorClass?: string;
  description?: string;
}

const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  currency,
  icon,
  isLoading,
  changePercent,
  valuePrefix = '',
  colorClass = 'text-foreground',
  description
}) => {
  const getBadgeVariant = (val?: number) => {
    if (val === undefined) return 'default';
    return val >= 0 ? 'success' : 'destructive';
  };

  return (
    <Card className='border-border bg-card border transition-colors duration-200'>
      <CardHeader className='space-y-0 pb-3'>
        <div className='flex items-start justify-between'>
          <div className='space-y-1.5'>
            <CardTitle className='text-muted-foreground flex items-center gap-2 text-sm font-medium'>
              <Icon name={icon} className={cn('h-4 w-4', colorClass)} />
              {title}
            </CardTitle>
            {description && (
              <CardDescription className='text-muted-foreground/80 text-xs'>
                {description}
              </CardDescription>
            )}
          </div>
          {changePercent !== undefined && (
            <Badge variant={getBadgeVariant(changePercent)} className='shrink-0'>
              {changePercent >= 0 ? (
                <Icon name='trendingUp' className='mr-1 h-3 w-3' />
              ) : (
                <Icon name='trendingDown' className='mr-1 h-3 w-3' />
              )}
              {changePercent.toFixed(1)}%
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className='pt-0'>
        {isLoading ? (
          <div className='space-y-2'>
            <Skeleton className='h-8 w-3/4' />
            <Skeleton className='h-4 w-1/2' />
          </div>
        ) : (
          <SingleLineEllipsis
            className={cn('text-2xl font-bold tracking-tight sm:text-3xl', colorClass)}
          >
            {valuePrefix}
            {formatCurrency(value, currency)}
          </SingleLineEllipsis>
        )}
      </CardContent>
    </Card>
  );
};

const CustomTooltip = ({ active, payload, currency, data }: any) => {
  if (active && payload && payload.length > 0) {
    const currentData = payload[0].payload;
    if (!currentData) return null;

    const currentIndex = data.findIndex((d: any) => d.date === currentData.date);
    const prevData = currentIndex > 0 ? data[currentIndex - 1] : null;

    const value = currentData.value;
    const change = prevData ? value - prevData.value : null;
    const percentageChange =
      prevData && prevData.value !== 0 ? (change! / Math.abs(prevData.value)) * 100 : null;
    const isPositive = change === null || change >= 0;

    return (
      <div className='custom-chart-tooltip min-w-[240px]'>
        <p className='label mb-3 text-sm'>
          {format(parseISO(currentData.date), 'EEEE, MMM d, yyyy')}
        </p>
        <div className='space-y-3 text-sm'>
          <div className='flex items-center justify-between gap-4'>
            <span className='text-muted-foreground flex items-center gap-2'>
              <Icon name='wallet' className='h-4 w-4' />
              Portfolio Value
            </span>
            <span className='text-foreground font-semibold'>{formatCurrency(value, currency)}</span>
          </div>
          {change !== null && percentageChange !== null && (
            <div className='border-t pt-3'>
              <div className='flex items-center justify-between gap-4'>
                <span className='text-muted-foreground'>Daily Change</span>
                <div
                  className={cn(
                    'flex items-center gap-1.5 font-semibold',
                    isPositive
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  )}
                >
                  {isPositive ? (
                    <Icon name='trendingUp' className='h-4 w-4' />
                  ) : (
                    <Icon name='trendingDown' className='h-4 w-4' />
                  )}
                  <span>
                    {formatCurrency(change, currency)} ({percentageChange.toFixed(2)}%)
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

const timeRanges = [
  { label: '7D', value: '7d' },
  { label: '1M', value: '30d' },
  { label: '3M', value: '90d' },
  { label: '1Y', value: '1y' },
  { label: 'All', value: 'all' }
];

interface PerformanceChartProps {
  performanceData: any;
  isLoading: boolean;
  currency: string;
  totalInvested: number;
  selectedTimeRange: string;
  setSelectedTimeRange: (value: string) => void;
  customDateRange: DateRange | undefined;
  setCustomDateRange: (value: DateRange | undefined) => void;
  oldestInvestmentDate: Date | undefined;
  isMobile?: boolean;
}

const PerformanceChart: React.FC<PerformanceChartProps> = ({
  performanceData,
  isLoading,
  currency,
  totalInvested,
  selectedTimeRange,
  setSelectedTimeRange,
  customDateRange,
  setCustomDateRange,
  oldestInvestmentDate,
  isMobile
}) => {
  const [customRangeOpen, setCustomRangeOpen] = useState(false);

  const chartData = useMemo(() => {
    if (!performanceData?.data) return [];
    // FIX: Ensure unique keys by adding index
    return performanceData.data.map((d: any, index: number) => ({
      ...d,
      uniqueKey: `${d.date}-${index}`
    }));
  }, [performanceData]);

  const yAxisFormatter = (tick: number) =>
    new Intl.NumberFormat('en-IN', {
      notation: 'compact',
      compactDisplay: 'short',
      maximumFractionDigits: 1
    }).format(tick);

  return (
    <Card className='border-border bg-card border'>
      <CardHeader className='border-b pb-6'>
        <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
          <div className='space-y-2'>
            <CardTitle className='flex items-center gap-2 text-xl font-semibold'>
              <Icon name='barChart3' className='text-primary h-5 w-5' />
              Portfolio Performance
            </CardTitle>
            <CardDescription className='text-sm'>
              Track your investment growth over time
            </CardDescription>
          </div>

          <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3'>
            <ToggleGroup
              type='single'
              value={selectedTimeRange}
              onValueChange={(value) => {
                if (value) {
                  setCustomRangeOpen(false);
                  setSelectedTimeRange(value);
                  setCustomDateRange(undefined);
                }
              }}
              className='grid grid-cols-5 gap-1 sm:flex sm:gap-1'
              aria-label='Select time range'
            >
              {timeRanges.map((range) => (
                <ToggleGroupItem
                  key={range.value}
                  value={range.value}
                  className={cn(
                    'h-9 rounded-md border px-3 text-sm font-medium transition-all',
                    'hover:bg-accent hover:text-accent-foreground',
                    'data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:border-primary'
                  )}
                  aria-label={range.label}
                >
                  {range.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>

            <div className='flex gap-2'>
              {customRangeOpen ? (
                <DateRangePickerV2
                  date={customDateRange}
                  onDateChange={(range) => {
                    setCustomDateRange(range);
                    if (range?.from && range?.to) {
                      setSelectedTimeRange('custom');
                    }
                  }}
                  minDate={oldestInvestmentDate}
                  maxDate={new Date()}
                  noLabel
                  buttonClassName={cn(
                    'h-9 border',
                    selectedTimeRange === 'custom'
                      ? 'bg-primary text-primary-foreground border-primary'
                      : ''
                  )}
                />
              ) : (
                <Button
                  size='sm'
                  variant='outline'
                  onClick={() => setCustomRangeOpen(!customRangeOpen)}
                  className='h-9 gap-2'
                >
                  <Icon name='calendar' className='h-4 w-4' />
                  Custom
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className='p-6'>
        <div className='h-[400px] w-full'>
          {isLoading ? (
            <div className='bg-muted/20 flex h-full w-full items-center justify-center rounded-lg'>
              <div className='space-y-3 text-center'>
                <Skeleton className='mx-auto h-8 w-8 rounded-full' />
                <Skeleton className='h-4 w-32' />
              </div>
            </div>
          ) : chartData.length > 1 ? (
            <ChartContainer config={{}} className='h-full w-full'>
              <ResponsiveContainer>
                <RechartsAreaChart
                  data={chartData}
                  margin={{ top: 20, right: 20, left: 0, bottom: 20 }}
                >
                  <defs>
                    <linearGradient id='chartFill' x1='0' y1='0' x2='0' y2='1'>
                      <stop offset='0%' stopColor='var(--primary)' stopOpacity='0.3' />
                      <stop offset='30%' stopColor='var(--primary)' stopOpacity='0.15' />
                      <stop offset='100%' stopColor='var(--primary)' stopOpacity='0.05' />
                    </linearGradient>
                    <linearGradient id='strokeGradient' x1='0' y1='0' x2='1' y2='0'>
                      <stop offset='0%' stopColor='var(--primary)' />
                      <stop offset='50%' stopColor='var(--primary)' stopOpacity='0.9' />
                      <stop offset='100%' stopColor='var(--primary)' />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    vertical={false}
                    strokeDasharray='3 3'
                    stroke='var(--border)'
                    strokeOpacity={0.6}
                  />
                  <XAxis
                    dataKey='date'
                    tickFormatter={(tick) => format(parseISO(tick), isMobile ? 'd/M' : 'd MMM')}
                    tick={{ fontSize: isMobile ? 11 : 12, fill: 'var(--muted-foreground)' }}
                    axisLine={false}
                    tickLine={false}
                    interval='preserveStartEnd'
                    minTickGap={isMobile ? 20 : 40}
                    height={40}
                  />
                  <YAxis
                    domain={['dataMin - 1000', 'dataMax + 1000']}
                    tickFormatter={yAxisFormatter}
                    tick={{ fontSize: isMobile ? 11 : 12, fill: 'var(--muted-foreground)' }}
                    axisLine={false}
                    tickLine={false}
                    width={isMobile ? 40 : 50}
                  />
                  <ChartTooltip
                    cursor={{
                      stroke: 'var(--primary)',
                      strokeWidth: 2,
                      strokeDasharray: '5 5',
                      strokeOpacity: 0.8
                    }}
                    content={<CustomTooltip currency={currency} data={chartData} />}
                  />
                  {totalInvested > 0 && (
                    <ReferenceLine
                      y={totalInvested}
                      stroke='var(--muted-foreground)'
                      strokeDasharray='6 6'
                      strokeOpacity={0.7}
                      strokeWidth={1.5}
                      label={{
                        value: 'Total Invested',
                        position: 'insideTopLeft',
                        fontSize: isMobile ? 10 : 11,
                        fill: 'var(--muted-foreground)',
                        dy: 12,
                        dx: 12,
                        className: 'font-medium'
                      }}
                    />
                  )}
                  <Area
                    type='monotone'
                    dataKey='value'
                    stroke='url(#strokeGradient)'
                    fill='url(#chartFill)'
                    strokeWidth={2.5}
                    dot={false}
                    isAnimationActive={true}
                    animationDuration={1000}
                    animationEasing='ease-out'
                  />
                </RechartsAreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <div className='bg-muted/20 flex h-full w-full flex-col items-center justify-center rounded-lg'>
              <NoData message='Not enough historical data to display chart.' icon={'lineChart'} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

interface InvestmentAccountOverviewProps {
  accountId: string;
  accountCurrency: string;
  summary: InvestmentAccountAPI.GetSummaryResponse | undefined;
  isLoadingSummary: boolean;
  oldestInvestmentDate: Date | undefined;
}

const InvestmentAccountOverview: React.FC<InvestmentAccountOverviewProps> = ({
  accountId,
  accountCurrency,
  summary,
  isLoadingSummary,
  oldestInvestmentDate
}) => {
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>(undefined);
  const isMobile = useIsMobile();

  const { data: performanceData, isLoading: isLoadingChart } = useQuery<any>({
    queryKey: ['investmentAccountPerformance', accountId, selectedTimeRange, customDateRange],
    queryFn: () => {
      const periodMap: Record<string, '7d' | '30d' | '90d' | '1y'> = {
        '7d': '7d',
        '30d': '30d',
        '90d': '90d',
        '1y': '1y'
      };

      if (selectedTimeRange === 'all') {
        return investmentAccountGetPerformance(accountId, {
          startDate: oldestInvestmentDate ? format(oldestInvestmentDate, 'yyyy-MM-dd') : undefined,
          endDate: format(new Date(), 'yyyy-MM-dd')
        });
      } else if (selectedTimeRange === 'custom') {
        return investmentAccountGetPerformance(accountId, {
          startDate: customDateRange?.from ? format(customDateRange.from, 'yyyy-MM-dd') : undefined,
          endDate: customDateRange?.to ? format(customDateRange.to, 'yyyy-MM-dd') : undefined
        });
      } else {
        const period = periodMap[selectedTimeRange];
        return investmentAccountGetPerformance(accountId, { period });
      }
    },
    staleTime: 5 * 60 * 1000
  });

  const performanceMetrics = useMemo(() => {
    if (!summary) return null;
    const { totalinvestment, totalvalue, totaldividend } = summary;
    const totalGain = totalvalue - totalinvestment;
    const totalReturn = totalinvestment > 0 ? (totalGain / totalinvestment) * 100 : 0;
    return {
      totalInvested: totalinvestment,
      totalValue: totalvalue,
      totalDividends: totaldividend,
      totalGain,
      totalReturn
    };
  }, [summary]);

  return (
    <div className='space-y-6'>
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        <KpiCard
          title='Portfolio Value'
          description='Current total value'
          icon={'wallet'}
          isLoading={isLoadingSummary}
          value={performanceMetrics?.totalValue || 0}
          currency={accountCurrency}
          changePercent={performanceMetrics?.totalReturn}
          colorClass='text-primary'
        />
        <KpiCard
          title='Total Invested'
          description='Amount contributed'
          icon={'piggyBank'}
          isLoading={isLoadingSummary}
          value={performanceMetrics?.totalInvested || 0}
          currency={accountCurrency}
          colorClass='text-blue-600 dark:text-blue-400'
        />
        <KpiCard
          title='Total Dividends'
          description='Income received'
          icon={'indianRupee'}
          isLoading={isLoadingSummary}
          value={performanceMetrics?.totalDividends || 0}
          currency={accountCurrency}
          valuePrefix='+'
          colorClass='text-green-600 dark:text-green-400'
        />
      </div>

      {!isLoadingSummary && performanceMetrics && (
        <Card className='border-l-primary bg-card border-l-4'>
          <CardContent className='p-4'>
            <div className='flex items-start gap-4'>
              <div className='bg-primary/10 ring-primary/20 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-1'>
                <Icon name='info' className='text-primary h-5 w-5' />
              </div>
              <div className='my-auto flex-1 space-y-2'>
                <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3'>
                  <p className='text-muted-foreground text-sm leading-relaxed'>
                    Your portfolio has{' '}
                    <span
                      className={cn(
                        'font-semibold',
                        performanceMetrics.totalGain >= 0
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      )}
                    >
                      {performanceMetrics.totalGain >= 0 ? 'gained' : 'lost'}{' '}
                      {formatCurrency(Math.abs(performanceMetrics.totalGain), accountCurrency)}
                    </span>{' '}
                    ({performanceMetrics.totalReturn.toFixed(1)}%) since inception
                  </p>
                  <Badge
                    variant={performanceMetrics.totalGain >= 0 ? 'success' : 'destructive'}
                    className='w-fit shrink-0'
                  >
                    {performanceMetrics.totalGain >= 0 ? 'Profitable' : 'Loss Position'}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <PerformanceChart
        performanceData={performanceData}
        isLoading={isLoadingChart}
        currency={accountCurrency}
        totalInvested={performanceMetrics?.totalInvested || 0}
        selectedTimeRange={selectedTimeRange}
        setSelectedTimeRange={setSelectedTimeRange}
        customDateRange={customDateRange}
        setCustomDateRange={setCustomDateRange}
        oldestInvestmentDate={oldestInvestmentDate}
        isMobile={isMobile}
      />
    </div>
  );
};

export default InvestmentAccountOverview;
