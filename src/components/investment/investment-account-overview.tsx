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
import { ApiResponse, InvestmentAccountSummary } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip } from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import NoData from '@/components/ui/no-data';
import {
  IndianRupee,
  Info,
  LineChart as LineChartIcon,
  PiggyBank,
  TrendingDown,
  TrendingUp,
  Wallet,
  Calendar,
  BarChart3,
  LucideProps
} from 'lucide-react';
import { SingleLineEllipsis } from '../ui/ellipsis-components';
import { investmentAccountGetPerformance } from '@/lib/endpoints/investmentAccount';
import { Button } from '../ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

interface KpiCardProps {
  title: string;
  value: number;
  currency: string;
  icon: React.ElementType<LucideProps>;
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
  icon: Icon,
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
    <Card className='group from-background via-background/95 to-muted/30 hover:shadow-primary/5 relative overflow-hidden border-0 bg-gradient-to-br shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-lg dark:shadow-white/5'>
      {/* Subtle gradient overlay */}
      <div className='from-primary/[0.02] to-primary/[0.01] absolute inset-0 bg-gradient-to-br via-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100' />

      <CardHeader className='relative flex-row items-start justify-between space-y-0 pb-3'>
        <div className='space-y-1'>
          <CardTitle className='text-muted-foreground flex items-center gap-2 text-sm font-medium'>
            <Icon className={cn('h-4 w-4 transition-colors duration-200', colorClass)} />
            {title}
          </CardTitle>
          {description && <CardDescription className='text-xs'>{description}</CardDescription>}
        </div>
        {changePercent !== undefined && (
          <Badge
            variant={getBadgeVariant(changePercent)}
            className='px-2 py-0.5 text-xs font-medium shadow-sm'
          >
            {changePercent >= 0 ? (
              <TrendingUp className='mr-1 h-3 w-3' />
            ) : (
              <TrendingDown className='mr-1 h-3 w-3' />
            )}
            {changePercent.toFixed(1)}%
          </Badge>
        )}
      </CardHeader>

      <CardContent className='relative pt-0'>
        {isLoading ? (
          <div className='space-y-2'>
            <Skeleton className='h-8 w-3/4' />
            <Skeleton className='h-4 w-1/2' />
          </div>
        ) : (
          <div className='space-y-1'>
            <SingleLineEllipsis
              className={cn(
                'text-2xl font-bold tracking-tight transition-colors duration-200 sm:text-3xl',
                colorClass
              )}
            >
              {valuePrefix}
              {formatCurrency(value, currency)}
            </SingleLineEllipsis>
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
      <Card className='border-border/50 bg-background/95 min-w-[260px] shadow-2xl backdrop-blur-md'>
        <CardContent className='p-4'>
          <p className='text-foreground mb-3 text-sm font-semibold'>
            {format(parseISO(currentData.date), 'EEEE, MMM d, yyyy')}
          </p>
          <div className='space-y-3 text-sm'>
            <div className='flex items-center justify-between gap-4'>
              <span className='text-muted-foreground flex items-center gap-2'>
                <Wallet className='h-4 w-4' />
                Portfolio Value
              </span>
              <span className='font-semibold'>{formatCurrency(value, currency)}</span>
            </div>
            {change !== null && percentageChange !== null && (
              <div className='border-t pt-2'>
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
                      <TrendingUp className='h-4 w-4' />
                    ) : (
                      <TrendingDown className='h-4 w-4' />
                    )}
                    <span>
                      {formatCurrency(change, currency)} ({percentageChange.toFixed(2)}%)
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
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
    return performanceData.data;
  }, [performanceData]);

  const yAxisFormatter = (tick: number) =>
    new Intl.NumberFormat('en-IN', {
      notation: 'compact',
      compactDisplay: 'short',
      maximumFractionDigits: 1
    }).format(tick);

  return (
    <Card className='from-background via-background/98 to-muted/20 overflow-hidden border-0 bg-gradient-to-br shadow-sm backdrop-blur-sm'>
      <CardHeader className='from-background/50 to-muted/30 border-b bg-gradient-to-r backdrop-blur-sm'>
        <div className='flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between'>
          <div className='space-y-2 max-sm:mx-auto max-sm:text-center'>
            <CardTitle className='flex items-center gap-2 text-xl font-semibold max-sm:items-center'>
              <BarChart3 className='text-primary h-5 w-5' />
              Portfolio Performance
            </CardTitle>
            <CardDescription className='text-sm'>
              Track your investment growth over time with interactive charts
            </CardDescription>
          </div>

          <div className='flex items-center gap-2 max-sm:mx-auto'>
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
              className='bg-muted/30 grid grid-cols-5 gap-1 rounded-lg border p-1 sm:flex sm:w-auto'
              aria-label='Select time range'
            >
              {timeRanges.map((range) => (
                <ToggleGroupItem
                  key={range.value}
                  value={range.value}
                  className='data-[state=on]:bg-background h-8 rounded-md px-3 text-xs font-medium transition-all data-[state=on]:shadow-sm sm:h-9 sm:text-sm'
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
                    'h-8 sm:h-9',
                    selectedTimeRange === 'custom' ? 'bg-accent text-accent-foreground' : ''
                  )}
                />
              ) : (
                <Button
                  size='sm'
                  variant='outline'
                  onClick={() => setCustomRangeOpen(!customRangeOpen)}
                  className='h-8 gap-2 sm:h-9'
                >
                  <Calendar className='h-4 w-4' />
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
            <div className='from-muted/20 to-muted/40 flex h-full w-full items-center justify-center rounded-lg bg-gradient-to-br'>
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
                      <stop offset='0%' stopColor='var(--primary)' stopOpacity='0.2' />
                      <stop offset='30%' stopColor='var(--primary)' stopOpacity='0.1' />
                      <stop offset='100%' stopColor='var(--primary)' stopOpacity='0.02' />
                    </linearGradient>
                    <linearGradient id='strokeGradient' x1='0' y1='0' x2='1' y2='0'>
                      <stop offset='0%' stopColor='var(--primary)' />
                      <stop offset='50%' stopColor='var(--primary)' stopOpacity='0.8' />
                      <stop offset='100%' stopColor='var(--primary)' />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    vertical={false}
                    strokeDasharray='3 3'
                    stroke='var(--border)'
                    strokeOpacity={0.5}
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
                    width={isMobile ? 36 : 40}
                  />
                  <ChartTooltip
                    cursor={{
                      stroke: 'var(--primary)',
                      strokeWidth: 2,
                      strokeDasharray: '5 5',
                      strokeOpacity: 0.7
                    }}
                    content={<CustomTooltip currency={currency} data={chartData} />}
                  />
                  {totalInvested > 0 && (
                    <ReferenceLine
                      y={totalInvested}
                      stroke='var(--muted-foreground)'
                      strokeDasharray='6 6'
                      strokeOpacity={0.6}
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
            <div className='from-muted/20 to-muted/40 flex h-full w-full flex-col items-center justify-center rounded-lg bg-gradient-to-br'>
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
          startDate: String(oldestInvestmentDate),
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
    <div className='space-y-8'>
      {/* KPI Cards Grid */}
      <div className='grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-3'>
        <KpiCard
          title='Portfolio Value'
          description='Current total value'
          icon={Wallet}
          isLoading={isLoadingSummary}
          value={performanceMetrics?.totalValue || 0}
          currency={accountCurrency}
          changePercent={performanceMetrics?.totalReturn}
          colorClass='text-primary'
        />
        <KpiCard
          title='Total Invested'
          description='Amount contributed'
          icon={PiggyBank}
          isLoading={isLoadingSummary}
          value={performanceMetrics?.totalInvested || 0}
          currency={accountCurrency}
          colorClass='text-blue-600 dark:text-blue-400'
        />
        <KpiCard
          title='Total Dividends'
          description='Income received'
          icon={IndianRupee}
          isLoading={isLoadingSummary}
          value={performanceMetrics?.totalDividends || 0}
          currency={accountCurrency}
          valuePrefix='+'
          colorClass='text-green-600 dark:text-green-400'
        />
      </div>

      {/* Performance Summary Banner */}
      {!isLoadingSummary && performanceMetrics && (
        <Card className='border-l-primary from-primary/5 via-primary/[0.02] to-background overflow-hidden border-l-4 bg-gradient-to-r'>
          <CardContent className='p-4 max-sm:p-2'>
            <div className='flex items-center gap-4'>
              <div className='bg-primary/10 ring-primary/20 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ring-1'>
                <Info className='text-primary h-6 w-6' />
              </div>
              <div className='flex-1 space-y-2'>
                <div className='flex items-center gap-2 max-sm:flex-col max-sm:items-start'>
                  <div className='text-muted-foreground text-sm leading-relaxed'>
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
                  </div>
                  <Badge
                    variant={performanceMetrics.totalGain >= 0 ? 'success' : 'destructive'}
                    className='w-fit'
                  >
                    {performanceMetrics.totalGain >= 0 ? 'Profitable' : 'Loss Position'}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Chart */}
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
