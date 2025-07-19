'use client';

import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Investment, InvestmentPerformanceData } from '@/lib/types';
import { investmentGetPerformance } from '@/lib/endpoints/investment';
import {
  AreaChart as RechartsAreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import { format, parseISO, formatDistanceStrict } from 'date-fns';
import { formatCurrency, cn } from '@/lib/utils';
import { Skeleton } from '../ui/skeleton';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TrendingDown,
  TrendingUp,
  X,
  Maximize2,
  Minimize2,
  Building2,
  Activity,
  IndianRupee,
  Percent,
  Share,
  PieChart,
  BarChart3,
  Info,
  Clock
} from 'lucide-react';
import { ChartContainer, ChartTooltip } from '@/components/ui/chart';
import { SingleLineEllipsis } from '../ui/ellipsis-components';

// Enhanced Custom Tooltip with better design and theming
const CustomTooltip = ({
  active,
  payload,
  currency,
  chartType,
  data
}: {
  active?: boolean;
  payload?: any[];
  currency: string;
  chartType: 'market' | 'holding';
  data: any[];
  purchasePrice?: number | null;
}) => {
  if (active && payload && payload.length > 0) {
    const currentData = payload[0].payload;
    if (!currentData) return null;

    const currentIndex = data.findIndex((d) => d.date === currentData.date);
    const prevData = currentIndex > 0 ? data[currentIndex - 1] : null;

    let value: number | null = null;
    let valueLabel = 'Value';

    if (chartType === 'market') {
      value = currentData.value;
      valueLabel = 'Price';
    } else {
      value = currentData.positive !== null ? currentData.positive : currentData.negative;
      valueLabel = value !== null && value >= 0 ? 'Gain' : 'Loss';
    }

    const purchasePrice = chartType === 'market' ? payload[0].payload.purchasePrice : null;

    if (value === null) return null;

    const prevValue =
      chartType === 'market'
        ? prevData?.value
        : prevData?.positive !== null
          ? prevData?.positive
          : prevData?.negative;

    let change: number | null = null;
    let percentageChange: number | null = null;
    if (prevValue !== null && prevValue !== undefined && prevValue !== 0) {
      change = value - prevValue;
      percentageChange = (change / Math.abs(prevValue)) * 100;
    }

    const isPositiveChange = change !== null && change >= 0;
    const changeColor = isPositiveChange ? 'text-positive' : 'text-negative';
    const ChangeIcon = isPositiveChange ? TrendingUp : TrendingDown;

    return (
      <div className='bg-card/95 min-w-[280px] rounded-xl border p-4 shadow-xl backdrop-blur-sm'>
        <div className='mb-3 flex items-center gap-2'>
          <div
            className={cn(
              'h-3 w-3 rounded-full shadow-sm',
              isPositiveChange ? 'bg-positive' : 'bg-negative'
            )}
          />
          <p className='text-foreground text-sm font-semibold'>
            {format(parseISO(currentData.date), 'MMM dd, yyyy')}
          </p>
        </div>

        <div className='space-y-3'>
          <div className='flex items-center justify-between'>
            <span className='text-muted-foreground text-sm'>{valueLabel}</span>
            <span className='text-foreground text-lg font-bold'>
              {formatCurrency(value, currency)}
            </span>
          </div>

          {chartType === 'market' && purchasePrice !== undefined && purchasePrice !== null && (
            <div className='border-border flex items-center justify-between border-t pt-2'>
              <span className='text-muted-foreground text-sm'>Entry Price</span>
              <span className='text-foreground font-semibold'>
                {formatCurrency(purchasePrice, currency)}
              </span>
            </div>
          )}

          {change !== null && percentageChange !== null && (
            <div className='border-border flex items-center justify-between border-t pt-2'>
              <span className='text-muted-foreground text-sm'>Daily Change</span>
              <div className={cn('flex items-center gap-1.5 font-semibold', changeColor)}>
                <ChangeIcon className='h-4 w-4' />
                <span className='text-sm'>
                  {formatCurrency(change, currency)} ({percentageChange.toFixed(2)}%)
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

interface InvestmentInsightModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  investment: Investment;
  accountCurrency: string;
}

// KPICard with subtle left-border accent for status
const KPICard = ({
  title,
  value,
  icon,
  className = '',
  trend,
  subtitle,
  colorScheme = 'default'
}: {
  title: string;
  value: React.ReactNode;
  icon: React.ElementType;
  className?: string;
  trend?: 'up' | 'down' | 'neutral';
  subtitle?: string;
  colorScheme?: 'default' | 'success' | 'danger' | 'warning' | 'info';
}) => {
  const Icon = icon;
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : null;

  const colorSchemes = {
    default: 'border-transparent',
    success: 'border-positive',
    danger: 'border-negative',
    warning: 'border-warning',
    info: 'border-info'
  };

  const iconColors = {
    default: 'text-muted-foreground',
    success: 'text-positive',
    danger: 'text-negative',
    warning: 'text-warning',
    info: 'text-info'
  };

  return (
    <Card
      className={cn(
        'hover:bg-muted/50 border-l-4 transition-all duration-200',
        colorSchemes[colorScheme]
      )}
    >
      <CardContent className='p-4 sm:p-5'>
        <div className='mb-2 flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <Icon className={cn('h-5 w-5', iconColors[colorScheme])} />
            <div>
              <span className='text-muted-foreground text-sm font-semibold'>{title}</span>
              {subtitle && <p className='text-muted-foreground text-xs'>{subtitle}</p>}
            </div>
          </div>
          {TrendIcon && (
            <div
              className={cn('rounded-full p-1.5', {
                'bg-positive/10': trend === 'up',
                'bg-negative/10': trend === 'down'
              })}
            >
              <TrendIcon
                className={cn('h-4 w-4', {
                  'text-positive': trend === 'up',
                  'text-negative': trend === 'down'
                })}
              />
            </div>
          )}
        </div>

        <SingleLineEllipsis
          className={cn('text-foreground text-xl font-bold sm:text-2xl', className)}
        >
          {value}
        </SingleLineEllipsis>
      </CardContent>
    </Card>
  );
};

// Investment Summary Card with a cleaner, neutral background
const InvestmentSummaryCard = ({
  investment,
  performanceMetrics,
  accountCurrency
}: {
  investment: Investment;
  performanceMetrics: any;
  accountCurrency: string;
}) => {
  return (
    <Card className='bg-muted/50'>
      <CardHeader className='pb-3'>
        <CardTitle className='text-foreground/90 flex items-center gap-2 text-lg'>
          <Building2 className='text-primary h-5 w-5' />
          Investment Overview
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='grid grid-cols-2 gap-4'>
          <div className='space-y-1'>
            <p className='text-muted-foreground text-sm font-medium'>Shares Held</p>
            <p className='text-foreground text-xl font-bold'>
              {investment.shares?.toLocaleString() ?? 0}
            </p>
          </div>
          <div className='space-y-1'>
            <p className='text-muted-foreground text-sm font-medium'>Avg. Purchase Price</p>
            <p className='text-foreground text-xl font-bold'>
              {formatCurrency(investment.purchasePrice ?? 0, accountCurrency)}
            </p>
          </div>
        </div>

        <div className='bg-background rounded-lg p-4'>
          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-1'>
              <p className='text-muted-foreground text-sm font-medium'>Total Invested</p>
              <p className='text-primary text-lg font-bold'>
                {formatCurrency(investment.investedAmount ?? 0, accountCurrency)}
              </p>
            </div>
            <div className='space-y-1'>
              <p className='text-muted-foreground text-sm font-medium'>Holding Period</p>
              <p className='text-foreground text-lg font-bold'>
                {performanceMetrics?.holdingDuration || 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {investment.dividend && investment.dividend > 0 ? (
          <div className='bg-chart-4/10 rounded-lg p-3'>
            <div className='flex items-center justify-between'>
              <span className='text-chart-4 text-sm font-medium'>Total Dividends Received</span>
              <span className='text-chart-4 text-lg font-bold'>
                {formatCurrency(investment.dividend, accountCurrency)}
              </span>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};

const ModalLoadingSkeleton = () => (
  <div className='p-4 sm:p-6'>
    <div className='mb-6 grid w-full grid-cols-3 gap-2'>
      <Skeleton className='h-10 w-full' />
      <Skeleton className='h-10 w-full' />
      <Skeleton className='h-10 w-full' />
    </div>
    <div className='space-y-6'>
      <div className='grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4'>
        <Skeleton className='h-24 w-full' />
        <Skeleton className='h-24 w-full' />
        <Skeleton className='h-24 w-full' />
        <Skeleton className='h-24 w-full' />
      </div>
      <Skeleton className='h-16 w-full' />
      <Skeleton className='h-48 w-full' />
    </div>
  </div>
);

const InvestmentInsightModal: React.FC<InvestmentInsightModalProps> = ({
  isOpen,
  onOpenChange,
  investment,
  accountCurrency
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const { data: performanceData, isLoading } = useQuery<InvestmentPerformanceData | null>({
    queryKey: ['investmentPerformance', investment.id],
    queryFn: () => investmentGetPerformance(investment.id),
    enabled: isOpen,
    staleTime: 5 * 60 * 1000,
    retry: 1
  });

  const { purchaseDate, today } = useMemo(() => {
    return {
      purchaseDate:
        typeof investment.purchaseDate === 'string' && investment.purchaseDate
          ? parseISO(investment.purchaseDate)
          : new Date(),
      today: new Date()
    };
  }, [investment.purchaseDate]);

  const performanceMetrics = useMemo(() => {
    if (!performanceData?.currentMarketData?.price || !investment) return null;

    const shares = investment.shares ?? 0;
    const investedAmount = investment.investedAmount ?? 0;
    const currentMarketValue = performanceData.currentMarketData.price * shares;
    const totalGainLoss = currentMarketValue - investedAmount;
    const gainLossPercentage = investedAmount > 0 ? (totalGainLoss / investedAmount) * 100 : 0;

    return {
      currentMarketValue,
      totalGainLoss,
      gainLossPercentage,
      holdingDuration: formatDistanceStrict(today, purchaseDate),
      currentPrice: performanceData.currentMarketData.price,
      dayChange: performanceData.currentMarketData.change ?? 0,
      dayChangePercent: performanceData.currentMarketData.changePercent ?? 0
    };
  }, [performanceData, investment, today, purchaseDate]);

  const gainLossChartData = useMemo(() => {
    if (!performanceData?.holdingPerformance) {
      return [];
    }
    return performanceData.holdingPerformance.map((point) => {
      const gainLoss = point.gainLoss ?? 0;
      return {
        date: point.date,
        positive: gainLoss >= 0 ? gainLoss : null,
        negative: gainLoss < 0 ? gainLoss : null,
        value: gainLoss
      };
    });
  }, [performanceData]);

  // --- AXIS MAGIC STARTS HERE ---

  // Y-Axis Magic: A clearer formatter using k/M/B suffixes
  const yAxisFormatter = (tick: number) => {
    const num = Number(tick);
    if (Math.abs(num) >= 1_000_000) {
      return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (Math.abs(num) >= 1_000) {
      return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
    }
    return num.toFixed(2);
  };

  // X-Axis Magic: Calculate a dynamic tick interval to avoid label overlap
  const xAxisTickInterval = useMemo(() => {
    if (!gainLossChartData || gainLossChartData.length < 15) {
      return 'preserveStartEnd'; // Use default behavior for fewer data points
    }
    // Aim for about 7-10 ticks on the x-axis for readability
    return Math.floor(gainLossChartData.length / 8);
  }, [gainLossChartData]);

  // Y-Axis Magic: Calculate dynamic padding for the top and bottom of the chart
  const yAxisDomain = useMemo(() => {
    if (!gainLossChartData || gainLossChartData.length === 0) {
      return ['auto', 'auto'];
    }
    const values = gainLossChartData.map((p) => p.value).filter((v) => v !== null) as number[];
    if (values.length === 0) return ['auto', 'auto'];

    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);

    // Add 5% padding to the top and bottom
    const padding = (maxVal - minVal) * 0.05;

    return [minVal - padding, maxVal + padding];
  }, [gainLossChartData]);

  // --- AXIS MAGIC ENDS HERE ---

  const gainLossTrend = (performanceMetrics?.totalGainLoss ?? 0) >= 0 ? 'up' : 'down';
  const dayChangeTrend = (performanceMetrics?.dayChange ?? 0) >= 0 ? 'up' : 'down';

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'bg-background max-h-[95vh] gap-0 overflow-y-auto p-0 shadow-2xl',
          isExpanded ? 'w-[98vw] max-w-none' : 'w-[95vw] max-w-7xl'
        )}
        hideClose
      >
        {/* Cleaner Header */}
        <div className='bg-card border-b px-4 py-4 sm:px-6'>
          <div className='flex items-center justify-between max-sm:flex-col max-sm:gap-2'>
            <div className='flex items-center gap-3 max-sm:mx-auto max-sm:flex-col max-sm:justify-center max-sm:gap-2'>
              <div className='bg-primary/10 rounded-lg p-2 sm:rounded-xl sm:p-3'>
                <Building2 className='text-primary h-5 w-5 sm:h-6 sm:w-6' />
              </div>
              <div className='max-sm:text-center'>
                <DialogTitle className='text-foreground text-lg font-bold sm:text-2xl'>
                  {investment.symbol}
                </DialogTitle>
                <DialogDescription className='text-muted-foreground text-xs sm:text-sm'>
                  {performanceData?.currentMarketData?.companyName || 'Investment Analysis'}
                </DialogDescription>
              </div>
            </div>

            <div className='flex items-center gap-1 max-sm:mx-auto max-sm:justify-center max-sm:gap-2'>
              <Badge
                variant='secondary'
                className='bg-positive/10 text-positive border-positive/20 border'
              >
                <Activity className='mr-1.5 h-3 w-3' />
                Live Data
              </Badge>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => setIsExpanded(!isExpanded)}
                className='text-muted-foreground h-9 w-9 p-0'
              >
                {isExpanded ? <Minimize2 className='h-4 w-4' /> : <Maximize2 className='h-4 w-4' />}
              </Button>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => onOpenChange(false)}
                className='text-muted-foreground h-9 w-9 p-0'
              >
                <X className='h-4 w-4' />
              </Button>
            </div>
          </div>
        </div>

        {/* Content with tabs */}
        {isLoading ? (
          <ModalLoadingSkeleton />
        ) : (
          <div className='p-4 sm:p-6'>
            <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
              <TabsList className='grid w-full grid-cols-3'>
                <TabsTrigger value='overview' className='flex items-center gap-2'>
                  <PieChart className='h-4 w-4' />
                  Overview
                </TabsTrigger>
                <TabsTrigger value='performance' className='flex items-center gap-2'>
                  <BarChart3 className='h-4 w-4' />
                  Performance
                </TabsTrigger>
                <TabsTrigger value='details' className='flex items-center gap-2'>
                  <Info className='h-4 w-4' />
                  Details
                </TabsTrigger>
              </TabsList>

              <TabsContent value='overview' className='mt-6 space-y-6'>
                {/* Refined Performance Summary Grid */}
                <div className='grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4'>
                  <KPICard
                    title='Current Value'
                    value={formatCurrency(
                      performanceMetrics?.currentMarketValue || 0,
                      accountCurrency
                    )}
                    icon={IndianRupee}
                    className='text-info'
                    colorScheme='info'
                  />
                  <KPICard
                    title='Total P&L'
                    value={
                      <span className={gainLossTrend === 'up' ? 'text-positive' : 'text-negative'}>
                        {formatCurrency(performanceMetrics?.totalGainLoss || 0, accountCurrency)}
                      </span>
                    }
                    icon={TrendingUp}
                    trend={gainLossTrend}
                    colorScheme={gainLossTrend === 'up' ? 'success' : 'danger'}
                  />
                  <KPICard
                    title='Return %'
                    value={
                      <span className={gainLossTrend === 'up' ? 'text-positive' : 'text-negative'}>
                        {(performanceMetrics?.gainLossPercentage || 0).toFixed(2)}%
                      </span>
                    }
                    icon={Percent}
                    trend={gainLossTrend}
                    colorScheme={gainLossTrend === 'up' ? 'success' : 'danger'}
                  />
                  <KPICard
                    title='Current Price'
                    value={formatCurrency(performanceMetrics?.currentPrice || 0, accountCurrency)}
                    icon={Activity}
                    className='text-warning'
                    colorScheme='warning'
                  />
                </div>

                {/* Responsive Day Change Card */}
                {performanceMetrics?.dayChange !== undefined ? (
                  <Card className={cn(dayChangeTrend === 'up' ? 'bg-positive/5' : 'bg-negative/5')}>
                    <CardContent className='p-4'>
                      <div className='flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:justify-between'>
                        <div className='flex items-center gap-2'>
                          <Clock
                            className={cn(
                              'h-5 w-5',
                              dayChangeTrend === 'up' ? 'text-positive' : 'text-negative'
                            )}
                          />
                          <span className='text-foreground/90 font-semibold'>Today's Change</span>
                        </div>
                        <div
                          className={cn(
                            'flex items-center gap-2 text-base font-bold sm:text-lg',
                            dayChangeTrend === 'up' ? 'text-positive' : 'text-negative'
                          )}
                        >
                          {dayChangeTrend === 'up' ? (
                            <TrendingUp className='h-5 w-5' />
                          ) : (
                            <TrendingDown className='h-5 w-5' />
                          )}
                          {formatCurrency(performanceMetrics.dayChange, accountCurrency)} (
                          {performanceMetrics.dayChangePercent.toFixed(2)}%)
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : null}

                <InvestmentSummaryCard
                  investment={investment}
                  performanceMetrics={performanceMetrics}
                  accountCurrency={accountCurrency}
                />
              </TabsContent>

              <TabsContent value='performance' className='mt-6'>
                <Card>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2 text-xl'>
                      <Activity className='text-primary h-6 w-6' />
                      Performance Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='h-[400px] w-full max-sm:overflow-x-scroll'>
                      {gainLossChartData.length > 1 ? (
                        <ChartContainer config={{}} className='h-full w-full'>
                          <ResponsiveContainer>
                            <RechartsAreaChart
                              data={gainLossChartData}
                              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                            >
                              <defs>
                                <linearGradient id='positiveGradient' x1='0' y1='0' x2='0' y2='1'>
                                  <stop
                                    offset='5%'
                                    stopColor='var(--color-positive)'
                                    stopOpacity={0.3}
                                  />
                                  <stop
                                    offset='95%'
                                    stopColor='var(--color-positive)'
                                    stopOpacity={0.05}
                                  />
                                </linearGradient>
                                <linearGradient id='negativeGradient' x1='0' y1='0' x2='0' y2='1'>
                                  <stop
                                    offset='5%'
                                    stopColor='var(--color-negative)'
                                    stopOpacity={0.05}
                                  />
                                  <stop
                                    offset='95%'
                                    stopColor='var(--color-negative)'
                                    stopOpacity={0.3}
                                  />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray='3 3' className='stroke-border' />
                              {/* --- APPLYING X-AXIS MAGIC --- */}
                              <XAxis
                                dataKey='date'
                                tickFormatter={(tick) => format(parseISO(tick), 'MMM dd')}
                                className='text-muted-foreground'
                                fontSize={12}
                                axisLine={false}
                                tickLine={false}
                                interval={xAxisTickInterval}
                              />
                              {/* --- APPLYING Y-AXIS MAGIC --- */}
                              <YAxis
                                domain={yAxisDomain}
                                tickCount={8}
                                tickFormatter={yAxisFormatter}
                                className='text-muted-foreground'
                                fontSize={12}
                                axisLine={false}
                                tickLine={false}
                              />
                              <ChartTooltip
                                cursor={{
                                  stroke: 'hsl(var(--primary) / 0.4)',
                                  strokeWidth: 2,
                                  strokeDasharray: '5 5'
                                }}
                                content={
                                  <CustomTooltip
                                    currency={accountCurrency}
                                    data={gainLossChartData}
                                    chartType='holding'
                                  />
                                }
                              />
                              <ReferenceLine
                                y={0}
                                stroke='hsl(var(--border))'
                                strokeDasharray='3 3'
                                strokeWidth={2}
                              />
                              <Area
                                type='monotone'
                                dataKey='positive'
                                stroke='var(--color-positive)'
                                fill='url(#positiveGradient)'
                                strokeWidth={2}
                                dot={false}
                              />
                              <Area
                                type='monotone'
                                dataKey='negative'
                                stroke='var(--color-negative)'
                                fill='url(#negativeGradient)'
                                strokeWidth={2}
                                dot={false}
                              />
                            </RechartsAreaChart>
                          </ResponsiveContainer>
                        </ChartContainer>
                      ) : (
                        <div className='flex h-full items-center justify-center'>
                          <div className='text-center'>
                            <div className='bg-muted mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full'>
                              <Activity className='text-muted-foreground h-8 w-8' />
                            </div>
                            <p className='text-foreground text-lg font-semibold'>
                              No Performance Data Available
                            </p>
                            <p className='text-muted-foreground text-sm'>
                              Historical performance data is not available for this investment yet.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value='details' className='mt-6'>
                <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
                  <Card>
                    <CardHeader>
                      <CardTitle className='flex items-center gap-2'>
                        <Share className='h-5 w-5' />
                        Investment Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                      <div className='space-y-4'>
                        <div className='flex flex-col items-start gap-0.5 border-b pb-3 sm:flex-row sm:items-center sm:justify-between'>
                          <span className='text-muted-foreground text-sm font-medium'>Symbol</span>
                          <span className='text-foreground text-base font-bold sm:text-lg'>
                            {investment.symbol}
                          </span>
                        </div>
                        <div className='flex flex-col items-start gap-0.5 border-b pb-3 sm:flex-row sm:items-center sm:justify-between'>
                          <span className='text-muted-foreground text-sm font-medium'>Shares</span>
                          <span className='text-foreground text-base font-semibold sm:text-lg'>
                            {investment.shares?.toLocaleString() ?? 0}
                          </span>
                        </div>
                        <div className='flex flex-col items-start gap-0.5 border-b pb-3 sm:flex-row sm:items-center sm:justify-between'>
                          <span className='text-muted-foreground text-sm font-medium'>
                            Purchase Price
                          </span>
                          <span className='text-foreground text-base font-semibold sm:text-lg'>
                            {formatCurrency(investment.purchasePrice ?? 0, accountCurrency)}
                          </span>
                        </div>
                        <div className='flex flex-col items-start gap-0.5 border-b pb-3 sm:flex-row sm:items-center sm:justify-between'>
                          <span className='text-muted-foreground text-sm font-medium'>
                            Total Investment
                          </span>
                          <span className='text-primary text-base font-semibold sm:text-lg'>
                            {formatCurrency(investment.investedAmount ?? 0, accountCurrency)}
                          </span>
                        </div>
                        <div className='flex flex-col items-start gap-0.5 sm:flex-row sm:items-center sm:justify-between'>
                          <span className='text-muted-foreground text-sm font-medium'>
                            Purchase Date
                          </span>
                          <span className='text-foreground text-base font-semibold sm:text-lg'>
                            {format(purchaseDate, 'MMM dd, yyyy')}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className='flex items-center gap-2'>
                        <IndianRupee className='h-5 w-5' />
                        Current Valuation
                      </CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                      <div className='space-y-4'>
                        <div className='flex flex-col items-start gap-0.5 border-b pb-3 sm:flex-row sm:items-center sm:justify-between'>
                          <span className='text-muted-foreground text-sm font-medium'>
                            Current Price
                          </span>
                          <span className='text-foreground text-base font-semibold sm:text-lg'>
                            {formatCurrency(performanceMetrics?.currentPrice ?? 0, accountCurrency)}
                          </span>
                        </div>
                        <div className='flex flex-col items-start gap-0.5 border-b pb-3 sm:flex-row sm:items-center sm:justify-between'>
                          <span className='text-muted-foreground text-sm font-medium'>
                            Market Value
                          </span>
                          <span className='text-primary text-base font-semibold sm:text-lg'>
                            {formatCurrency(
                              performanceMetrics?.currentMarketValue ?? 0,
                              accountCurrency
                            )}
                          </span>
                        </div>
                        <div className='flex flex-col items-start gap-0.5 border-b pb-3 sm:flex-row sm:items-center sm:justify-between'>
                          <span className='text-muted-foreground text-sm font-medium'>
                            Unrealized P&L
                          </span>
                          <span
                            className={cn('text-base font-semibold sm:text-lg', {
                              'text-positive': gainLossTrend === 'up',
                              'text-negative': gainLossTrend === 'down'
                            })}
                          >
                            {formatCurrency(
                              performanceMetrics?.totalGainLoss ?? 0,
                              accountCurrency
                            )}
                          </span>
                        </div>
                        <div className='flex flex-col items-start gap-0.5 sm:flex-row sm:items-center sm:justify-between'>
                          <span className='text-muted-foreground text-sm font-medium'>
                            Return %
                          </span>
                          <span
                            className={cn('text-base font-semibold sm:text-lg', {
                              'text-positive': gainLossTrend === 'up',
                              'text-negative': gainLossTrend === 'down'
                            })}
                          >
                            {(performanceMetrics?.gainLossPercentage ?? 0).toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default InvestmentInsightModal;
