'use client';
import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import type { InvestmentAPI } from '@/lib/api/api-types';
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
  ChartContainer,
  ChartTooltip,
  ChartConfig,
  ChartTooltipContent
} from '@/components/ui/chart';
import { IconName } from '../ui/icon-map';
import { Icon } from '../ui/icon';
import { useIsMobile } from '@/hooks/use-mobile';

const KPICard = ({
  title,
  value,
  icon,
  change,
  changeType
}: {
  title: string;
  value: React.ReactNode;
  icon: IconName;
  change?: string;
  changeType?: 'up' | 'down';
}) => {
  const isPositive = changeType === 'up';
  const changeColor = isPositive ? 'text-positive' : 'text-negative';
  const changeIcon = changeType ? (isPositive ? 'trendingUp' : 'trendingDown') : null;
  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle className='text-sm font-medium'>{title}</CardTitle>
        <Icon name={icon} className='text-muted-foreground h-4 w-4' />
      </CardHeader>
      <CardContent>
        <div className='text-2xl font-bold'>{value}</div>
        {change && changeIcon && (
          <p className={cn('text-xs', changeColor)}>
            <span className='inline-flex items-center gap-1 font-medium'>
              <Icon name={changeIcon} className='h-3 w-3' />
              {change}
            </span>
          </p>
        )}
      </CardContent>
    </Card>
  );
};
const DetailItem = ({
  label,
  children,
  isLast
}: {
  label: string;
  children: React.ReactNode;
  isLast?: boolean;
}) => (
  <div
    className={cn(
      'flex flex-col items-start gap-1 pt-3 sm:flex-row sm:items-center sm:justify-between',
      !isLast && 'border-b pb-3'
    )}
  >
    <p className='text-muted-foreground text-sm font-medium'>{label}</p>
    <div className='text-foreground text-base font-semibold'>{children}</div>
  </div>
);
const ModalLoadingSkeleton = () => (
  <div className='p-4 sm:p-6'>
    <div className='mb-6 flex items-center justify-between'>
      <div className='flex items-center gap-4'>
        <Skeleton className='h-12 w-12 rounded-lg' />
        <div className='space-y-2'>
          <Skeleton className='h-6 w-32' />
          <Skeleton className='h-4 w-48' />
        </div>
      </div>
      <div className='flex items-center gap-2'>
        <Skeleton className='h-8 w-20 rounded-full' />
        <Skeleton className='h-8 w-8 rounded-md' />
        <Skeleton className='h-8 w-8 rounded-md' />
      </div>
    </div>
    <Skeleton className='mb-6 h-10 w-full' />
    <div className='space-y-4'>
      <div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
        <Skeleton className='h-[105px] w-full' />
        <Skeleton className='h-[105px] w-full' />
        <Skeleton className='h-[105px] w-full' />
        <Skeleton className='h-[105px] w-full' />
      </div>
      <Skeleton className='h-[350px] w-full sm:h-[400px]' />
    </div>
  </div>
);
interface InvestmentInsightModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  investment: InvestmentAPI.Investment;
  accountCurrency: string;
}

const chartConfig = {
  positive: {
    label: 'Gain',
    color: 'var(--chart-positive)'
  },
  negative: {
    label: 'Loss',
    color: 'var(--chart-negative)'
  }
} satisfies ChartConfig;

const InvestmentInsightModal: React.FC<InvestmentInsightModalProps> = ({
  isOpen,
  onOpenChange,
  investment,
  accountCurrency
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const isMobile = useIsMobile();
  const { data: performanceData, isLoading } =
    useQuery<InvestmentAPI.GetPerformanceResponse | null>({
      queryKey: ['investmentPerformance', investment.id],
      queryFn: () => investmentGetPerformance(investment.id),
      enabled: isOpen,
      staleTime: 5 * 60 * 1000,
      retry: 1
    });
  const performanceMetrics = useMemo(() => {
    if (!performanceData?.currentMarketData?.price || !investment) return null;
    const shares = investment.shares ?? 0;
    const investedAmount = investment.investedAmount ?? 0;
    const currentMarketValue = performanceData.currentMarketData.price * shares;
    const totalGainLoss = currentMarketValue - investedAmount;
    const gainLossPercentage = investedAmount > 0 ? (totalGainLoss / investedAmount) * 100 : 0;
    const purchaseDate = investment.purchaseDate ? parseISO(investment.purchaseDate) : new Date();
    return {
      currentMarketValue,
      totalGainLoss,
      gainLossPercentage,
      holdingDuration: formatDistanceStrict(new Date(), purchaseDate),
      currentPrice: performanceData.currentMarketData.price,
      dayChange: performanceData.currentMarketData.change ?? 0,
      dayChangePercent: performanceData.currentMarketData.changePercent ?? 0,
      companyName: performanceData.currentMarketData.companyName
    };
  }, [performanceData, investment]);
  const chartData = useMemo(() => {
    if (!performanceData?.holdingPerformance) return [];
    return performanceData.holdingPerformance.map((point) => ({
      date: point.date,
      value: point.gainLoss ?? 0,
      positive: (point.gainLoss ?? 0) >= 0 ? point.gainLoss : null,
      negative: (point.gainLoss ?? 0) < 0 ? point.gainLoss : null
    }));
  }, [performanceData]);

  const dateSpan = useMemo(() => {
    if (chartData.length < 2) return 'day';
    const firstDate = parseISO(chartData[0].date);
    const lastDate = parseISO(chartData[chartData.length - 1].date);
    return lastDate.getFullYear() > firstDate.getFullYear() ? 'year' : 'day';
  }, [chartData]);

  const tickFormatter = (tick: string) => {
    const date = parseISO(tick);
    return format(date, dateSpan === 'year' ? "MMM 'yy" : 'd MMM');
  };

  const yAxisFormatter = (tick: number) => {
    if (Math.abs(tick) >= 1_000_000) return `${(tick / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
    if (Math.abs(tick) >= 1_000) return `${(tick / 1_000).toFixed(1).replace(/\.0$/, '')}k`;
    return tick.toString();
  };

  const yAxisDomain = useMemo(() => {
    if (chartData.length === 0) return ['auto', 'auto'];
    const values = chartData.map((p) => p.value).filter((v) => v !== null) as number[];
    if (values.length === 0) return ['auto', 'auto'];
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    if (minVal === maxVal) return [minVal - 1, maxVal + 1];
    const padding = (maxVal - minVal) * 0.1;
    return [minVal - padding, maxVal + padding];
  }, [chartData]);
  const totalGainLossTrend = (performanceMetrics?.totalGainLoss ?? 0) >= 0 ? 'up' : 'down';
  const dayChangeTrend = (performanceMetrics?.dayChange ?? 0) >= 0 ? 'up' : 'down';
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'flex max-h-[95dvh] flex-col gap-0 p-0',
          isExpanded ? 'w-full max-w-none sm:rounded-none' : 'w-[95vw] max-w-5xl'
        )}
        hideClose
      >
        {isLoading ? (
          <ModalLoadingSkeleton />
        ) : (
          <>
            <div className='bg-background/95 border-b px-4 py-3 backdrop-blur-sm sm:px-6 sm:py-4'>
              <div className='flex flex-wrap items-center justify-between gap-x-4 gap-y-2'>
                <div className='flex items-center gap-3'>
                  <div className='bg-muted flex-shrink-0 rounded-lg p-2'>
                    <Icon name={'building'} className='text-primary h-6 w-6' />
                  </div>
                  <div>
                    <DialogTitle className='text-lg font-bold sm:text-xl'>
                      {investment.symbol}
                    </DialogTitle>
                    <DialogDescription className='text-muted-foreground text-xs sm:text-sm'>
                      {performanceMetrics?.companyName || 'Investment Analysis'}
                    </DialogDescription>
                  </div>
                </div>
                <div className='flex items-center gap-1'>
                  <Badge
                    variant='outline'
                    className='border-positive/30 bg-positive/10 text-positive'
                  >
                    <Icon name={'activity'} className='mr-1.5 h-3 w-3' />
                    Live Data
                  </Badge>
                  <Button
                    variant='ghost'
                    size='icon'
                    onClick={() => setIsExpanded(!isExpanded)}
                    className='text-muted-foreground h-8 w-8'
                  >
                    <Icon name={isExpanded ? 'minimize2' : 'maximize2'} className='h-4 w-4' />
                  </Button>
                  <Button
                    variant='ghost'
                    size='icon'
                    onClick={() => onOpenChange(false)}
                    className='text-muted-foreground h-8 w-8'
                  >
                    <Icon name={'x'} className='h-4 w-4' />
                  </Button>
                </div>
              </div>
            </div>
            <div className='flex-1 overflow-y-auto p-4 sm:p-6'>
              <Tabs value={activeTab} onValueChange={setActiveTab} className='flex h-full flex-col'>
                <TabsList className='grid w-full grid-cols-3'>
                  <TabsTrigger value='overview'>
                    <Icon name='pieChart' className='mr-2 h-4 w-4' />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value='performance'>
                    <Icon name='barChart3' className='mr-2 h-4 w-4' />
                    Performance
                  </TabsTrigger>
                  <TabsTrigger value='details'>
                    <Icon name='info' className='mr-2 h-4 w-4' />
                    Details
                  </TabsTrigger>
                </TabsList>
                <TabsContent value='overview' className='mt-6 flex-1 space-y-4'>
                  <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
                    <KPICard
                      title='Current Value'
                      value={formatCurrency(
                        performanceMetrics?.currentMarketValue || 0,
                        accountCurrency
                      )}
                      icon={'indianRupee'}
                    />
                    <KPICard
                      title='Total P&L'
                      value={
                        <span
                          className={
                            totalGainLossTrend === 'up' ? 'text-positive' : 'text-negative'
                          }
                        >
                          {formatCurrency(performanceMetrics?.totalGainLoss || 0, accountCurrency)}
                        </span>
                      }
                      icon={'trendingUp'}
                      change={`${(performanceMetrics?.gainLossPercentage || 0).toFixed(2)}%`}
                      changeType={totalGainLossTrend}
                    />
                    <KPICard
                      title="Today's Change"
                      value={
                        <span
                          className={dayChangeTrend === 'up' ? 'text-positive' : 'text-negative'}
                        >
                          {formatCurrency(performanceMetrics?.dayChange || 0, accountCurrency)}
                        </span>
                      }
                      icon={'clock'}
                      change={`${(performanceMetrics?.dayChangePercent || 0).toFixed(2)}%`}
                      changeType={dayChangeTrend}
                    />
                    <KPICard
                      title='Current Price'
                      value={formatCurrency(performanceMetrics?.currentPrice || 0, accountCurrency)}
                      icon={'activity'}
                    />
                  </div>
                  <Card className='flex h-full min-h-[300px] flex-1 flex-col'>
                    <CardHeader>
                      <CardTitle className='flex items-center gap-2 text-lg'>
                        <Icon name='activity' className='text-primary h-5 w-5' />
                        P&L Timeline
                      </CardTitle>
                      <DialogDescription>
                        Profit and loss performance over the holding period.
                      </DialogDescription>
                    </CardHeader>
                    <CardContent className='flex-1 pt-4 pr-4 pl-2'>
                      {chartData.length > 1 ? (
                        <ChartContainer
                          config={chartConfig}
                          className='h-[250px] w-full sm:h-[300px]'
                        >
                          <ResponsiveContainer>
                            <RechartsAreaChart
                              data={chartData}
                              margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                            >
                              <defs>
                                <linearGradient id='positiveGradient' x1='0' y1='0' x2='0' y2='1'>
                                  <stop
                                    offset='5%'
                                    stopColor='var(--color-positive)'
                                    stopOpacity={0.4}
                                  />
                                  <stop
                                    offset='95%'
                                    stopColor='var(--color-positive)'
                                    stopOpacity={0}
                                  />
                                </linearGradient>
                                <linearGradient id='negativeGradient' x1='0' y1='0' x2='0' y2='1'>
                                  <stop
                                    offset='5%'
                                    stopColor='var(--color-negative)'
                                    stopOpacity={0}
                                  />
                                  <stop
                                    offset='95%'
                                    stopColor='var(--color-negative)'
                                    stopOpacity={0.4}
                                  />
                                </linearGradient>
                              </defs>
                              <CartesianGrid vertical={false} className='stroke-border/50' />
                              <XAxis
                                dataKey='date'
                                tickFormatter={tickFormatter}
                                className='text-muted-foreground text-[10px]'
                                axisLine={false}
                                tickLine={false}
                                interval={'preserveStartEnd'}
                                minTickGap={isMobile ? 40 : 50}
                                height={40}
                                tickMargin={10}
                              />
                              <YAxis
                                tickFormatter={yAxisFormatter}
                                className='text-muted-foreground text-[10px]'
                                axisLine={false}
                                tickLine={false}
                                domain={yAxisDomain}
                                tickMargin={8}
                              />
                              <ChartTooltip
                                cursor={{
                                  strokeDasharray: '3 3',
                                  className: 'stroke-muted-foreground/50'
                                }}
                                content={
                                  <ChartTooltipContent
                                    formatter={(value) =>
                                      formatCurrency(value as number, accountCurrency)
                                    }
                                    labelFormatter={(label) =>
                                      format(parseISO(label), 'MMM dd, yyyy')
                                    }
                                  />
                                }
                              />
                              <ReferenceLine y={0} stroke='var(--border)' strokeDasharray='2 2' />
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
                        <div className='flex h-[250px] items-center justify-center text-center sm:h-[300px]'>
                          <p className='text-muted-foreground text-sm'>
                            Not enough data to display performance chart.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value='performance' className='mt-6'>
                  <Card className='flex h-full flex-col'>
                    <CardHeader>
                      <CardTitle className='flex items-center gap-2'>
                        Performance Timeline
                      </CardTitle>
                      <DialogDescription>
                        A detailed view of your investment's profit and loss over time.
                      </DialogDescription>
                    </CardHeader>
                    <CardContent className='flex-1 pt-4 pr-4 pl-2'>
                      {chartData.length > 1 ? (
                        <ChartContainer config={chartConfig} className='h-full w-full'>
                          <ResponsiveContainer>
                            <RechartsAreaChart
                              data={chartData}
                              margin={{ top: 20, right: 20, left: 10, bottom: 30 }}
                            >
                              <defs>
                                <linearGradient id='positiveGradient' x1='0' y1='0' x2='0' y2='1'>
                                  <stop
                                    offset='5%'
                                    stopColor='var(--color-positive)'
                                    stopOpacity={0.4}
                                  />
                                  <stop
                                    offset='95%'
                                    stopColor='var(--color-positive)'
                                    stopOpacity={0}
                                  />
                                </linearGradient>
                                <linearGradient id='negativeGradient' x1='0' y1='0' x2='0' y2='1'>
                                  <stop
                                    offset='5%'
                                    stopColor='var(--color-negative)'
                                    stopOpacity={0}
                                  />
                                  <stop
                                    offset='95%'
                                    stopColor='var(--color-negative)'
                                    stopOpacity={0.4}
                                  />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray='3 3' className='stroke-border/50' />
                              <XAxis
                                dataKey='date'
                                tickFormatter={tickFormatter}
                                className='text-muted-foreground text-xs'
                                axisLine={false}
                                tickLine={false}
                                interval={'preserveStartEnd'}
                                minTickGap={isMobile ? 40 : 50}
                                height={40}
                                tickMargin={15}
                              />
                              <YAxis
                                tickCount={8}
                                tickFormatter={yAxisFormatter}
                                className='text-muted-foreground text-xs'
                                axisLine={false}
                                tickLine={false}
                                domain={yAxisDomain}
                              />
                              <ChartTooltip
                                cursor={{
                                  strokeDasharray: '3 3',
                                  className: 'stroke-muted-foreground/50'
                                }}
                                content={
                                  <ChartTooltipContent
                                    formatter={(value) =>
                                      formatCurrency(value as number, accountCurrency)
                                    }
                                    labelFormatter={(label) =>
                                      format(parseISO(label), 'MMM dd, yyyy')
                                    }
                                  />
                                }
                              />
                              <ReferenceLine
                                y={0}
                                stroke='var(--border)'
                                strokeDasharray='3 3'
                                strokeWidth={1.5}
                              />
                              <Area
                                type='monotone'
                                dataKey='positive'
                                stroke='var(--color-positive)'
                                fill='url(#positiveGradient)'
                                strokeWidth={2.5}
                                dot={false}
                              />
                              <Area
                                type='monotone'
                                dataKey='negative'
                                stroke='var(--color-negative)'
                                fill='url(#negativeGradient)'
                                strokeWidth={2.5}
                                dot={false}
                              />
                            </RechartsAreaChart>
                          </ResponsiveContainer>
                        </ChartContainer>
                      ) : (
                        <div className='bg-muted/50 flex h-full flex-col items-center justify-center gap-3 rounded-md border border-dashed p-8 text-center'>
                          <Icon name='activity' className='text-muted-foreground h-10 w-10' />
                          <p className='font-semibold'>No Performance Data Available</p>
                          <p className='text-muted-foreground text-sm'>
                            Historical data could not be loaded for this investment.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value='details' className='mt-6'>
                  <Card>
                    <CardContent className='p-4 sm:p-6'>
                      <div className='space-y-6'>
                        <div className='space-y-1'>
                          <h3 className='flex items-center gap-2 font-semibold'>
                            <Icon name='share' className='text-primary h-4 w-4' />
                            Holding Details
                          </h3>
                          <div className='rounded-md border p-3'>
                            <DetailItem label='Shares Held'>
                              {investment.shares?.toLocaleString() ?? 'N/A'}
                            </DetailItem>
                            <DetailItem label='Avg. Purchase Price'>
                              {formatCurrency(investment.purchasePrice ?? 0, accountCurrency)}
                            </DetailItem>
                            <DetailItem label='Total Invested'>
                              <span className='text-primary'>
                                {formatCurrency(investment.investedAmount ?? 0, accountCurrency)}
                              </span>
                            </DetailItem>
                            <DetailItem label='Purchase Date'>
                              {investment.purchaseDate
                                ? format(parseISO(investment.purchaseDate), 'MMM dd, yyyy')
                                : 'N/A'}
                            </DetailItem>
                            <DetailItem label='Holding Period' isLast>
                              {performanceMetrics?.holdingDuration || 'N/A'}
                            </DetailItem>
                          </div>
                        </div>
                        <div className='space-y-1'>
                          <h3 className='flex items-center gap-2 font-semibold'>
                            <Icon name='percent' className='text-primary h-4 w-4' />
                            Valuation & Returns
                          </h3>
                          <div className='rounded-md border p-3'>
                            <DetailItem label='Current Market Value'>
                              {formatCurrency(
                                performanceMetrics?.currentMarketValue ?? 0,
                                accountCurrency
                              )}
                            </DetailItem>
                            <DetailItem label='Unrealized P&L'>
                              <span
                                className={
                                  totalGainLossTrend === 'up' ? 'text-positive' : 'text-negative'
                                }
                              >
                                {formatCurrency(
                                  performanceMetrics?.totalGainLoss ?? 0,
                                  accountCurrency
                                )}
                              </span>
                            </DetailItem>
                            <DetailItem label='Total Return %' isLast>
                              <span
                                className={cn(
                                  'font-bold',
                                  totalGainLossTrend === 'up' ? 'text-positive' : 'text-negative'
                                )}
                              >{`${(performanceMetrics?.gainLossPercentage ?? 0).toFixed(2)}%`}</span>
                            </DetailItem>
                          </div>
                        </div>
                        {investment.dividend && investment.dividend > 0 && (
                          <div className='space-y-1'>
                            <h3 className='flex items-center gap-2 font-semibold'>
                              <Icon name='indianRupee' className='text-primary h-4 w-4' />
                              Dividends
                            </h3>
                            <div className='rounded-md border p-3'>
                              <DetailItem label='Total Dividends Received' isLast>
                                <span className='text-green-500'>
                                  {formatCurrency(investment.dividend, accountCurrency)}
                                </span>
                              </DetailItem>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default InvestmentInsightModal;
