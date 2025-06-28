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
import { Investment } from '@/lib/types';
import { investmentStockPrice, investmentGetPortfolioHistorical } from '@/lib/endpoints/investment';
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
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
  const { data: currentPriceInfo, isLoading: isPriceLoading } = useQuery({
    queryKey: ['stockPrice', investment.symbol],
    queryFn: () => investmentStockPrice(investment.symbol),
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

  const { data: historicalData, isLoading: isHistoricalLoading } = useQuery({
    queryKey: ['stockHistoricalPrice', investment.symbol, investment.purchaseDate],
    queryFn: () =>
      investmentGetPortfolioHistorical({
        startDate: format(purchaseDate, 'yyyy-MM-dd'),
        endDate: format(today, 'yyyy-MM-dd')
      }),
    enabled: isOpen,
    staleTime: Infinity,
    retry: 1
  });

  const performanceMetrics = useMemo(() => {
    if (!currentPriceInfo?.price || !investment) return null;

    const shares = investment.shares ?? 0;
    const investedAmount = investment.investedAmount ?? 0;
    const totalDividends = investment.dividend ?? 0;
    const currentMarketValue = currentPriceInfo.price * shares;
    const totalGainLoss = currentMarketValue - investedAmount;
    const gainLossPercentage = investedAmount > 0 ? (totalGainLoss / investedAmount) * 100 : 0;

    return {
      currentMarketValue,
      totalGainLoss,
      gainLossPercentage,
      holdingDuration: formatDistanceStrict(today, purchaseDate)
    };
  }, [currentPriceInfo, investment, today, purchaseDate]);

  const gainLossChartData = useMemo(() => {
    if (!historicalData?.data || investment.shares == null || investment.purchasePrice == null) {
      return [];
    }
    return historicalData.data.map((point) => {
      const price = point.value ?? 0;
      const gainLoss = (price - (investment.purchasePrice ?? 0)) * (investment.shares ?? 0);
      return {
        date: point.date,
        positive: gainLoss >= 0 ? gainLoss : null,
        negative: gainLoss < 0 ? gainLoss : null
      };
    });
  }, [historicalData, investment.shares, investment.purchasePrice]);

  const isLoading = isPriceLoading || isHistoricalLoading;

  const yAxisFormatter = (tick: number) => {
    const num = Number(tick);
    if (Math.abs(num) >= 10000000) return `${(num / 10000000).toFixed(1)}Cr`;
    if (Math.abs(num) >= 100000) return `${(num / 100000).toFixed(1)}L`;
    if (Math.abs(num) >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent hideClose className='max-h-[90dvh] w-[95vw] max-w-6xl overflow-y-auto p-0'>
        <DialogHeader className='px-6 pt-6 pb-4'>
          <DialogTitle>
            Stock Insight: {investment.symbol}
            <span className='text-muted-foreground ml-2 text-base font-normal'>
              - {currentPriceInfo?.companyName || (isLoading ? 'Loading...' : 'N/A')}
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
                <TabsTrigger value='holding'>My Holding's Value</TabsTrigger>
              </TabsList>
              <TabsContent value='market'>
                <div className='h-[300px] w-full pt-4'>
                  {isLoading ? (
                    <Skeleton className='h-full w-full' />
                  ) : historicalData && historicalData.data.length > 1 ? (
                    <ChartContainer config={{}} className='h-full w-full'>
                      <ResponsiveContainer>
                        <RechartsAreaChart data={historicalData.data}>
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
                            content={
                              <ChartTooltipContent
                                indicator='dot'
                                formatter={(value, name, item) => (
                                  <div className='flex flex-col'>
                                    <span className='text-xs'>
                                      {format(parseISO(item.payload.date), 'MMM dd, yyyy')}
                                    </span>
                                    <span className='font-semibold'>
                                      {formatCurrency(value as number, accountCurrency)}
                                    </span>
                                  </div>
                                )}
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
                            content={
                              <ChartTooltipContent
                                indicator='dot'
                                formatter={(value, name) => (
                                  <span className='font-semibold'>
                                    {name === 'positive' ? 'Gain: ' : 'Loss: '}
                                    {formatCurrency(value as number, accountCurrency)}
                                  </span>
                                )}
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
