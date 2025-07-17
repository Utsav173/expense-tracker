'use client';

import React, { useMemo, useState } from 'react';
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
import { format, parseISO, startOfYear, subDays } from 'date-fns';
import { cn, formatCurrency } from '@/lib/utils';
import { investmentAccountGetPerformance } from '@/lib/endpoints/investment';
import { ApiResponse, InvestmentAccountSummary } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip } from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import NoData from '@/components/ui/no-data';
import {
  DollarSign,
  Info,
  LineChart as LineChartIcon,
  PiggyBank,
  TrendingDown,
  TrendingUp,
  Wallet
} from 'lucide-react';
import { SingleLineEllipsis } from '../ui/ellipsis-components';

interface KpiCardProps {
  title: string;
  value: number;
  currency: string;
  icon: React.ElementType;
  isLoading: boolean;
  changePercent?: number;
  valuePrefix?: string;
  colorClass?: string;
}

const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  currency,
  icon: Icon,
  isLoading,
  changePercent,
  valuePrefix = '',
  colorClass = 'text-foreground'
}) => {
  const getBadgeVariant = (val?: number) => {
    if (val === undefined) return 'default';
    return val >= 0 ? 'success' : 'destructive';
  };

  return (
    <Card className='shadow-sm transition-shadow hover:shadow-md'>
      <CardHeader className='flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle className='text-muted-foreground text-sm font-medium'>{title}</CardTitle>
        <Icon className={cn('h-5 w-5', colorClass)} />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <>
            <Skeleton className='mt-1 h-8 w-3/4' />
            {changePercent !== undefined && <Skeleton className='mt-2 h-5 w-1/4' />}
          </>
        ) : (
          <div className='flex items-center justify-between gap-2'>
            <SingleLineEllipsis className={cn('text-3xl font-bold tracking-tight', colorClass)}>
              {valuePrefix}
              {formatCurrency(value, currency)}
            </SingleLineEllipsis>
            {changePercent !== undefined && (
              <div>
                <Badge
                  variant={getBadgeVariant(changePercent)}
                  className='mt-1 px-2 py-0.5 text-xs font-semibold'
                >
                  {changePercent >= 0 ? '▲' : '▼'} {changePercent.toFixed(1)}%
                </Badge>
              </div>
            )}
          </div>
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
      <div className='bg-popover/80 text-popover-foreground min-w-[240px] rounded-xl border p-3 shadow-xl backdrop-blur-sm'>
        <p className='text-foreground mb-2 text-sm font-semibold'>
          {format(parseISO(currentData.date), 'EEEE, MMM d, yyyy')}
        </p>
        <div className='space-y-2 text-sm'>
          <div className='flex items-center justify-between gap-2'>
            <span className='text-muted-foreground'>Value</span>
            <span className='font-bold'>{formatCurrency(value, currency)}</span>
          </div>
          {change !== null && percentageChange !== null && (
            <div className='flex items-center justify-between gap-2'>
              <span className='text-muted-foreground'>Daily Change</span>
              <span
                className={cn(
                  'flex items-center gap-1 font-semibold',
                  isPositive ? 'text-positive' : 'text-negative'
                )}
              >
                {isPositive ? (
                  <TrendingUp className='h-4 w-4' />
                ) : (
                  <TrendingDown className='h-4 w-4' />
                )}
                {formatCurrency(change, currency)} ({percentageChange.toFixed(2)}%)
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

const timeRanges = [
  { label: '1W', value: '1W', days: 7 },
  { label: '1M', value: '1M', days: 30 },
  { label: '3M', value: '3M', days: 90 },
  { label: 'YTD', value: 'YTD', days: null },
  { label: 'All', value: 'All', days: null }
];

interface PerformanceChartProps {
  performanceData: any;
  isLoading: boolean;
  currency: string;
  totalInvested: number;
}

const PerformanceChart: React.FC<PerformanceChartProps> = ({
  performanceData,
  isLoading,
  currency,
  totalInvested
}) => {
  const [selectedTimeRange, setSelectedTimeRange] = useState('All');

  const chartData = useMemo(() => {
    if (!performanceData?.data) return [];
    const data = performanceData.data;
    if (selectedTimeRange === 'All') return data;

    const now = new Date();
    const range = timeRanges.find((r) => r.value === selectedTimeRange);
    if (!range) return data;

    const startDate = range.value === 'YTD' ? startOfYear(now) : subDays(now, range.days!);
    return data.filter((point: any) => parseISO(point.date) >= startDate);
  }, [performanceData, selectedTimeRange]);

  const yAxisFormatter = (tick: number) =>
    new Intl.NumberFormat('en-IN', {
      notation: 'compact',
      compactDisplay: 'short',
      maximumFractionDigits: 1
    }).format(tick);

  return (
    <Card className='shadow-sm'>
      <CardHeader>
        <div className='flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <CardTitle className='text-xl'>Portfolio Performance</CardTitle>
            <CardDescription>Historical value over time</CardDescription>
          </div>
          <ToggleGroup
            type='single'
            value={selectedTimeRange}
            onValueChange={(value) => {
              if (value) setSelectedTimeRange(value);
            }}
            className='w-full border sm:w-auto'
            aria-label='Select time range'
          >
            {timeRanges.map((range) => (
              <ToggleGroupItem
                key={range.value}
                value={range.value}
                className='w-full sm:w-auto'
                aria-label={range.label}
              >
                {range.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </CardHeader>
      <CardContent>
        <div className='h-[400px] w-full'>
          {isLoading ? (
            <div className='bg-muted/30 flex h-full w-full items-center justify-center rounded-lg'>
              <Skeleton className='h-full w-full' />
            </div>
          ) : chartData.length > 1 ? (
            <ChartContainer config={{}} className='h-full w-full'>
              <ResponsiveContainer>
                <RechartsAreaChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id='chartFill' x1='0' y1='0' x2='0' y2='1'>
                      <stop offset='0%' stopColor='var(--color-primary)' stopOpacity='0.3' />
                      <stop offset='50%' stopColor='var(--color-primary)' stopOpacity='0.08' />
                      <stop offset='100%' stopColor='var(--color-card)' stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    vertical={false}
                    strokeDasharray='2 2'
                    stroke='var(--border)'
                    strokeOpacity={1}
                  />
                  <XAxis
                    dataKey='date'
                    tickFormatter={(tick) => format(parseISO(tick), 'd MMM')}
                    tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                    axisLine={false}
                    tickLine={false}
                    interval='preserveStartEnd'
                    minTickGap={30}
                  />
                  <YAxis
                    domain={['dataMin - 1000', 'dataMax + 1000']}
                    tickFormatter={yAxisFormatter}
                    tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                    axisLine={false}
                    tickLine={true}
                    width={30}
                  />
                  <ChartTooltip
                    cursor={{ stroke: 'var(--primary)', strokeWidth: 1.5, strokeDasharray: '4 4' }}
                    content={<CustomTooltip currency={currency} data={chartData} />}
                  />
                  {totalInvested > 0 && (
                    <ReferenceLine
                      y={totalInvested}
                      stroke='var(--muted-foreground)'
                      strokeDasharray='4 4'
                      strokeOpacity={0.7}
                      label={{
                        value: 'Total Invested',
                        position: 'insideTopLeft',
                        fontSize: 11,
                        fill: 'var(--muted-foreground)',
                        dy: 10,
                        dx: 10
                      }}
                    />
                  )}
                  {/* --- THE FIX IS HERE --- */}
                  <Area
                    type='linear' // Changed from 'monotone' to 'linear' for sharp lines
                    dataKey='value'
                    stroke='var(--color-primary)'
                    fill='url(#chartFill)'
                    strokeWidth={2}
                    dot={false} // Explicitly disable dots on each data point
                    isAnimationActive={true}
                  />
                </RechartsAreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <div className='bg-muted/30 flex h-full w-full flex-col items-center justify-center rounded-lg'>
              <NoData message='Not enough historical data to display chart.' icon={LineChartIcon} />
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
  summary: ApiResponse<InvestmentAccountSummary> | undefined;
  isLoadingSummary: boolean;
}

const InvestmentAccountOverview: React.FC<InvestmentAccountOverviewProps> = ({
  accountId,
  accountCurrency,
  summary,
  isLoadingSummary
}) => {
  const { data: performanceData, isLoading: isLoadingChart } = useQuery<any>({
    queryKey: ['investmentAccountPerformance', accountId],
    queryFn: () => investmentAccountGetPerformance(accountId),
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
      <div className='grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3'>
        <KpiCard
          title='Total Value'
          icon={Wallet}
          isLoading={isLoadingSummary}
          value={performanceMetrics?.totalValue || 0}
          currency={accountCurrency}
          changePercent={performanceMetrics?.totalReturn}
          colorClass='text-foreground'
        />
        <KpiCard
          title='Total Invested'
          icon={PiggyBank}
          isLoading={isLoadingSummary}
          value={performanceMetrics?.totalInvested || 0}
          currency={accountCurrency}
          colorClass='text-foreground'
        />
        <KpiCard
          title='Total Dividends'
          icon={DollarSign}
          isLoading={isLoadingSummary}
          value={performanceMetrics?.totalDividends || 0}
          currency={accountCurrency}
          valuePrefix='+'
          colorClass='text-positive'
        />
      </div>

      {!isLoadingSummary && performanceMetrics && (
        <div className='bg-card flex items-center gap-4 rounded-xl border p-2 shadow-sm'>
          <div className='bg-primary/10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full'>
            <Info className='text-primary h-5 w-5' />
          </div>
          <p className='text-muted-foreground text-sm'>
            Your portfolio has gained{' '}
            <span
              className={cn(
                'font-semibold',
                performanceMetrics.totalGain >= 0 ? 'text-positive' : 'text-negative'
              )}
            >
              {formatCurrency(performanceMetrics.totalGain, accountCurrency)}
            </span>{' '}
            ({performanceMetrics.totalReturn.toFixed(1)}%) since inception.
          </p>
        </div>
      )}

      <PerformanceChart
        performanceData={performanceData}
        isLoading={isLoadingChart}
        currency={accountCurrency}
        totalInvested={performanceMetrics?.totalInvested || 0}
      />
    </div>
  );
};

export default InvestmentAccountOverview;
