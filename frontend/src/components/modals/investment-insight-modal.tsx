'use client';

import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose
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
import { format, parseISO, differenceInDays, formatDistanceStrict } from 'date-fns';
import { formatCurrency, cn } from '@/lib/utils';
import { Skeleton } from '../ui/skeleton';
import {
  AreaChart,
  BadgePercent,
  BarChart,
  CalendarDays,
  CircleDollarSign,
  Layers,
  LineChart as LineChartIcon,
  TrendingDown,
  TrendingUp,
  WalletCards,
  X
} from 'lucide-react';
import NoData from '../ui/no-data';
import { ChartContainer, ChartTooltip } from '@/components/ui/chart';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

// --- Custom Tooltip Component with FIX ---
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
  // FIX: Added robust checks to ensure payload and its data exist before processing.
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
          ? prevData.positive
          : prevData?.negative;

    let change: number | null = null;
    let percentageChange: number | null = null;
    if (prevValue !== null && prevValue !== undefined && prevValue !== 0) {
      change = value - prevValue;
      percentageChange = (change / Math.abs(prevValue)) * 100;
    }

    const isPositiveChange = change !== null && change >= 0;
    const changeColor = isPositiveChange ? 'text-success' : 'text-destructive';
    const ChangeIcon = isPositiveChange ? TrendingUp : TrendingDown;

    return (
      <div className='bg-background/90 text-foreground min-w-[180px] rounded-lg border p-3 shadow-lg backdrop-blur-sm'>
        <p className='text-muted-foreground mb-2 text-sm font-bold'>
          {format(parseISO(currentData.date), 'MMM d, yyyy')}
        </p>
        <Separator />
        <div className='mt-2 space-y-1.5 text-sm'>
          <div className='flex items-center justify-between'>
            <span className='text-muted-foreground'>{valueLabel}:</span>
            <span className='font-semibold'>{formatCurrency(value, currency)}</span>
          </div>
          {chartType === 'market' && purchasePrice !== undefined && purchasePrice !== null && (
            <div className='flex items-center justify-between'>
              <span className='text-muted-foreground'>Entry Price:</span>
              <span className='font-semibold'>{formatCurrency(purchasePrice, currency)}</span>
            </div>
          )}
          {change !== null && percentageChange !== null && (
            <div className='flex items-center justify-between'>
              <span className='text-muted-foreground'>Change:</span>
              <span className={cn('flex items-center gap-1 font-semibold', changeColor)}>
                <ChangeIcon className='h-3.5 w-3.5' />
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

interface InvestmentInsightModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  investment: Investment;
  accountCurrency: string;
}

const KPICard = ({
  title,
  value,
  icon,
  isLoading,
  className = ''
}: {
  title: string;
  value: React.ReactNode;
  icon: React.ElementType;
  isLoading: boolean;
  className?: string;
}) => {
  const Icon = icon;
  return (
    <div className='bg-muted/50 rounded-lg p-3'>
      <div className='text-muted-foreground mb-1 flex items-center gap-1.5 text-xs'>
        <Icon className='h-3 w-3' />
        {title}
      </div>
      {isLoading ? (
        <Skeleton className='h-6 w-3/4' />
      ) : (
        <div className={cn('text-lg font-bold', className)}>{value}</div>
      )}
    </div>
  );
};

const InvestmentInsightModal: React.FC<InvestmentInsightModalProps> = ({
  isOpen,
  onOpenChange,
  investment,
  accountCurrency
}) => {
  const {
    data: performanceData,
    isLoading,
    isError
  } = useQuery<InvestmentPerformanceData | null>({
    queryKey: ['investmentPerformance', investment.id],
    queryFn: () => investmentGetPerformance(investment.id),
    enabled: isOpen,
    staleTime: 5 * 60 * 1000, // 5 minutes
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
      holdingDuration: formatDistanceStrict(today, purchaseDate)
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
        negative: gainLoss < 0 ? gainLoss : null
      };
    });
  }, [performanceData]);

  const yAxisFormatter = (tick: number) => {
    const num = Number(tick);
    return new Intl.NumberFormat('en-IN', {
      notation: 'compact',
      compactDisplay: 'short',
      maximumFractionDigits: 1
    }).format(num);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent hideClose className='max-h-[90dvh] w-[95vw] max-w-6xl overflow-y-auto p-0'>
        <DialogHeader className='px-6 pt-6 pb-4'>
          <DialogTitle>
            Stock Insight: {investment.symbol}
            <span className='text-muted-foreground ml-2 text-base font-normal'>
              -{' '}
              {performanceData?.currentMarketData?.companyName ||
                (isLoading ? 'Loading...' : 'N/A')}
            </span>
          </DialogTitle>
          <DialogDescription>Performance and details for your holding.</DialogDescription>
        </DialogHeader>

        <div className='grid grid-cols-1 gap-6 px-6 pb-6 lg:grid-cols-5'>
          {/* Left Column: Data & Stats */}
          <div className='space-y-4 lg:col-span-2'>
            <div className='grid grid-cols-2 gap-3'>
              <KPICard
                title='Market Value'
                value={formatCurrency(performanceMetrics?.currentMarketValue || 0, accountCurrency)}
                icon={BarChart}
                isLoading={isLoading}
              />
              <KPICard
                title='Total Gain/Loss'
                value={
                  <span
                    className={
                      (performanceMetrics?.totalGainLoss ?? 0) >= 0
                        ? 'text-blue-500'
                        : 'text-destructive'
                    }
                  >
                    {formatCurrency(performanceMetrics?.totalGainLoss || 0, accountCurrency)}
                  </span>
                }
                icon={(performanceMetrics?.totalGainLoss ?? 0) >= 0 ? TrendingUp : TrendingDown}
                isLoading={isLoading}
              />
              <KPICard
                title='Gain/Loss %'
                value={
                  <span
                    className={
                      (performanceMetrics?.gainLossPercentage ?? 0) >= 0
                        ? 'text-blue-500'
                        : 'text-destructive'
                    }
                  >
                    {(performanceMetrics?.gainLossPercentage || 0).toFixed(2)}%
                  </span>
                }
                icon={BadgePercent}
                isLoading={isLoading}
              />
              <KPICard
                title='Total Dividends'
                value={formatCurrency(investment.dividend ?? 0, accountCurrency)}
                icon={CircleDollarSign}
                isLoading={false}
              />
            </div>
            <Separator />
            <div className='grid grid-cols-2 gap-3'>
              <KPICard
                title='Holding Period'
                value={performanceMetrics?.holdingDuration || 'N/A'}
                icon={CalendarDays}
                isLoading={isLoading}
              />
              <KPICard
                title='Shares'
                value={investment.shares ?? 0}
                icon={Layers}
                isLoading={false}
              />
              <KPICard
                title='Purchase Price'
                value={formatCurrency(investment.purchasePrice ?? 0, accountCurrency)}
                icon={CircleDollarSign}
                isLoading={false}
              />
              <KPICard
                title='Total Investment'
                value={formatCurrency(investment.investedAmount ?? 0, accountCurrency)}
                icon={WalletCards}
                isLoading={false}
              />
            </div>
          </div>

          {/* Right Column: Chart */}
          <div className='lg:col-span-3'>
            <Tabs defaultValue='market' className='w-full'>
              <TabsList className='grid w-full grid-cols-2'>
                <TabsTrigger value='market'>Market Performance</TabsTrigger>
                <TabsTrigger value='holding'>My Holding's Performance</TabsTrigger>
              </TabsList>
              <TabsContent value='market'>
                <div className='h-[300px] w-full pt-4'>
                  {isLoading ? (
                    <Skeleton className='h-full w-full' />
                  ) : performanceData && performanceData.marketPerformance.length > 1 ? (
                    <ChartContainer config={{}} className='h-full w-full'>
                      <ResponsiveContainer>
                        <RechartsAreaChart data={performanceData.marketPerformance}>
                          <defs>
                            <linearGradient id='insightChartFill' x1='0' y1='0' x2='0' y2='1'>
                              <stop
                                offset='5%'
                                stopColor='var(--color-primary)'
                                stopOpacity={0.4}
                              />
                              <stop
                                offset='95%'
                                stopColor='var(--color-primary)'
                                stopOpacity={0.05}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            vertical={false}
                            strokeDasharray='3 3'
                            strokeOpacity={0.5}
                          />
                          <XAxis
                            dataKey='date'
                            tickFormatter={(tick) => format(parseISO(tick), 'MMM dd')}
                            tick={{ fontSize: 10 }}
                            axisLine={false}
                            tickLine={false}
                            interval={'preserveStartEnd'}
                            minTickGap={40}
                          />
                          <YAxis
                            domain={['dataMin - 10', 'dataMax + 10']}
                            tickFormatter={yAxisFormatter}
                            tick={{ fontSize: 10 }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <ChartTooltip
                            cursor={{
                              stroke: 'var(--border)',
                              strokeWidth: 1.5,
                              strokeDasharray: '4 4'
                            }}
                            content={
                              <CustomTooltip
                                currency={accountCurrency}
                                data={performanceData.marketPerformance}
                                chartType='market'
                                purchasePrice={investment.purchasePrice}
                              />
                            }
                          />
                          {investment.purchasePrice != null && (
                            <ReferenceLine
                              y={investment.purchasePrice}
                              label={{
                                value: `Entry Price`,
                                position: 'insideBottomLeft',
                                fontSize: 10,
                                fill: 'var(--color-destructive)'
                              }}
                              stroke='var(--color-destructive)'
                              strokeDasharray='4 4'
                              strokeWidth={1.5}
                            />
                          )}
                          <Area
                            type='monotone'
                            dataKey='value'
                            stroke='var(--color-primary)'
                            fill='url(#insightChartFill)'
                            strokeWidth={2}
                          />
                        </RechartsAreaChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  ) : (
                    <NoData message='Historical data unavailable.' icon={LineChartIcon} />
                  )}
                </div>
              </TabsContent>
              <TabsContent value='holding'>
                <div className='h-[300px] w-full pt-4'>
                  {isLoading ? (
                    <Skeleton className='h-full w-full' />
                  ) : gainLossChartData.length > 1 ? (
                    <ChartContainer config={{}} className='h-full w-full'>
                      <ResponsiveContainer>
                        <RechartsAreaChart data={gainLossChartData}>
                          <defs>
                            <linearGradient id='positiveGradient' x1='0' y1='0' x2='0' y2='1'>
                              <stop
                                offset='5%'
                                stopColor='var(--color-blue-500)'
                                stopOpacity={0.4}
                              />
                              <stop
                                offset='95%'
                                stopColor='var(--color-blue-500)'
                                stopOpacity={0.05}
                              />
                            </linearGradient>
                            <linearGradient id='negativeGradient' x1='0' y1='0' x2='0' y2='1'>
                              <stop
                                offset='5%'
                                stopColor='var(--color-destructive)'
                                stopOpacity={0.4}
                              />
                              <stop
                                offset='95%'
                                stopColor='var(--color-destructive)'
                                stopOpacity={0.05}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            vertical={false}
                            strokeDasharray='3 3'
                            strokeOpacity={0.5}
                          />
                          <XAxis
                            dataKey='date'
                            tickFormatter={(tick) => format(parseISO(tick), 'MMM dd')}
                            tick={{ fontSize: 10 }}
                            axisLine={false}
                            tickLine={false}
                            interval={'preserveStartEnd'}
                            minTickGap={40}
                          />
                          <YAxis
                            domain={['auto', 'auto']}
                            tickFormatter={yAxisFormatter}
                            tick={{ fontSize: 10 }}
                            axisLine={false}
                            tickLine={false}
                            allowDataOverflow={true}
                          />
                          <ChartTooltip
                            cursor={{
                              stroke: 'var(--border)',
                              strokeWidth: 1.5,
                              strokeDasharray: '4 4'
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
                            label={{
                              value: `Break-even`,
                              position: 'insideBottomLeft',
                              fontSize: 10
                            }}
                            stroke='var(--color-border)'
                            strokeDasharray='2 2'
                            strokeWidth={1}
                          />
                          <Area
                            type='monotone'
                            dataKey='positive'
                            stroke='var(--color-blue-500)'
                            fill='url(#positiveGradient)'
                            strokeWidth={2}
                          />
                          <Area
                            type='monotone'
                            dataKey='negative'
                            stroke='var(--color-destructive)'
                            fill='url(#negativeGradient)'
                            strokeWidth={2}
                          />
                        </RechartsAreaChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  ) : (
                    <NoData message='Historical data unavailable.' icon={LineChartIcon} />
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
        <DialogClose asChild>
          <Button
            type='button'
            variant='ghost'
            size='icon'
            className='absolute top-3 right-3 h-7 w-7'
          >
            <X className='h-4 w-4' />
            <span className='sr-only'>Close</span>
          </Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
};

export default InvestmentInsightModal;
