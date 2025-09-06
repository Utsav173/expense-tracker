import React, { useMemo, useState } from 'react';
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
import { DateRange } from 'react-day-picker';
import DateRangePickerV2 from '@/components/date/date-range-picker-v2';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip } from '@/components/ui/chart';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import NoData from '@/components/ui/no-data';
import { cn, formatCurrency } from '@/lib/utils';

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
      <div className='custom-chart-tooltip border-border/50 bg-background/95 min-w-[240px] rounded-xl border shadow-2xl backdrop-blur-md'>
        <p className='label text-muted-foreground mb-3 text-sm font-medium'>
          {format(parseISO(currentData.date), 'EEEE, MMM d, yyyy')}
        </p>
        <div className='space-y-3 text-sm'>
          <div className='flex items-center justify-between gap-4'>
            <span className='text-muted-foreground flex items-center gap-2'>
              <div className='bg-primary/10 rounded-md p-1'>
                <Icon name='wallet' className='text-primary h-4 w-4' />
              </div>
              Portfolio Value
            </span>
            <span className='text-foreground text-base font-semibold'>
              {formatCurrency(value, currency)}
            </span>
          </div>
          {change !== null && percentageChange !== null && (
            <div className='border-border/50 border-t pt-3'>
              <div className='flex items-center justify-between gap-4'>
                <span className='text-muted-foreground'>Daily Change</span>
                <div
                  className={cn(
                    'flex items-center gap-1.5 rounded-md px-2 py-0.5 font-semibold',
                    isPositive
                      ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                      : 'bg-red-500/10 text-red-600 dark:text-red-400'
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

export interface PerformanceChartProps {
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

export const PerformanceChart: React.FC<PerformanceChartProps> = ({
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
    <Card className='group border-border bg-card/50 hover:shadow-primary/10 relative overflow-hidden border backdrop-blur-sm transition-all duration-300 hover:shadow-xl'>
      <div className='from-primary/3 absolute inset-0 bg-gradient-to-br via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100' />
      <CardHeader className='border-border/50 from-background/50 to-background/80 relative border-b bg-gradient-to-r pb-6'>
        <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
          <div className='space-y-2'>
            <CardTitle className='flex items-center gap-2 text-xl font-semibold'>
              <div className='bg-primary/10 ring-primary/20 group-hover:ring-primary/40 rounded-lg p-2 ring-1 transition-all duration-300 group-hover:scale-110'>
                <Icon name='barChart3' className='text-primary h-5 w-5' />
              </div>
              Portfolio Performance
            </CardTitle>
            <CardDescription className='text-muted-foreground/80 text-sm'>
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
              className='bg-muted/30 grid grid-cols-5 gap-1 rounded-lg p-1 sm:flex sm:gap-1'
              aria-label='Select time range'
            >
              {timeRanges.map((range) => (
                <ToggleGroupItem
                  key={range.value}
                  value={range.value}
                  className={cn(
                    'h-9 rounded-md border-0 px-3 text-sm font-medium transition-all duration-200',
                    'hover:bg-accent hover:text-accent-foreground hover:shadow-sm',
                    'data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-primary/20 data-[state=on]:shadow-md'
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
                    'h-9 border transition-all duration-200 hover:shadow-sm',
                    selectedTimeRange === 'custom'
                      ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20'
                      : 'hover:border-primary/50'
                  )}
                />
              ) : (
                <Button
                  size='sm'
                  variant='outline'
                  onClick={() => setCustomRangeOpen(!customRangeOpen)}
                  className='hover:border-primary/50 h-9 gap-2 transition-all duration-200 hover:shadow-sm'
                >
                  <Icon name='calendar' className='h-4 w-4' />
                  Custom
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className='relative p-6 max-sm:p-3'>
        <div className='h-[400px] w-full'>
          {isLoading ? (
            <div className='bg-muted/20 flex h-full w-full animate-pulse items-center justify-center rounded-lg'>
              <div className='space-y-3 text-center'>
                <div className='bg-primary/10 mx-auto flex h-12 w-12 items-center justify-center rounded-full'>
                  <Skeleton className='bg-primary/20 h-8 w-8 rounded-full' />
                </div>
                <Skeleton className='bg-muted/40 h-4 w-32' />
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
                      <stop offset='0%' stopColor='var(--primary)' stopOpacity='0.4' />
                      <stop offset='30%' stopColor='var(--primary)' stopOpacity='0.25' />
                      <stop offset='60%' stopColor='var(--primary)' stopOpacity='0.15' />
                      <stop offset='100%' stopColor='var(--primary)' stopOpacity='0.05' />
                    </linearGradient>
                    <linearGradient id='strokeGradient' x1='0' y1='0' x2='1' y2='0'>
                      <stop offset='0%' stopColor='var(--primary)' stopOpacity='0.8' />
                      <stop offset='50%' stopColor='var(--primary)' stopOpacity='1' />
                      <stop offset='100%' stopColor='var(--primary)' stopOpacity='0.8' />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    vertical={false}
                    strokeDasharray='3 3'
                    stroke='var(--border)'
                    strokeOpacity={0.3}
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
                      strokeOpacity: 0.5
                    }}
                    content={<CustomTooltip currency={currency} data={chartData} />}
                  />
                  {totalInvested > 0 && (
                    <ReferenceLine
                      y={totalInvested}
                      stroke='var(--muted-foreground)'
                      strokeDasharray='8 4'
                      strokeOpacity={0.5}
                      strokeWidth={1.5}
                      label={{
                        value: 'Total Invested',
                        position: 'insideTopLeft',
                        fontSize: isMobile ? 10 : 11,
                        fill: 'var(--muted-foreground)',
                        dy: 12,
                        dx: 12,
                        className: 'font-medium backdrop-blur-sm'
                      }}
                    />
                  )}
                  <Area
                    type='monotone'
                    dataKey='value'
                    stroke='url(#strokeGradient)'
                    fill='url(#chartFill)'
                    strokeWidth={3}
                    dot={false}
                    isAnimationActive={true}
                    animationDuration={1500}
                    animationEasing='ease-in-out'
                  />
                </RechartsAreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <div className='bg-muted/10 border-muted-foreground/20 flex h-full w-full flex-col items-center justify-center rounded-xl border border-dashed'>
              <NoData message='Not enough historical data to display chart.' icon={'lineChart'} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
