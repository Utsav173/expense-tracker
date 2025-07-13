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
import {
  TrendingDown,
  TrendingUp,
  X,
  Maximize2,
  Minimize2,
  Building2,
  Activity,
  DollarSign,
  Percent,
  Calendar,
  Share
} from 'lucide-react';
import { ChartContainer, ChartTooltip } from '@/components/ui/chart';
import { SingleLineEllipsis } from '../ui/ellipsis-components';

// Enhanced Custom Tooltip
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
    const changeColor = isPositiveChange ? 'text-green-600' : 'text-red-600';
    const ChangeIcon = isPositiveChange ? TrendingUp : TrendingDown;

    return (
      <div className='min-w-[220px] rounded-lg border bg-white p-3 shadow-lg'>
        <div className='mb-2 flex items-center gap-2'>
          <div
            className={`h-2 w-2 rounded-full ${isPositiveChange ? 'bg-green-500' : 'bg-red-500'}`}
          />
          <p className='text-sm font-medium text-gray-700'>
            {format(parseISO(currentData.date), 'MMM dd, yyyy')}
          </p>
        </div>

        <div className='space-y-2'>
          <div className='flex items-center justify-between'>
            <span className='text-sm text-gray-600'>{valueLabel}</span>
            <span className='font-semibold text-gray-900'>{formatCurrency(value, currency)}</span>
          </div>

          {chartType === 'market' && purchasePrice !== undefined && purchasePrice !== null && (
            <div className='flex items-center justify-between'>
              <span className='text-sm text-gray-600'>Entry Price</span>
              <span className='font-semibold text-gray-900'>
                {formatCurrency(purchasePrice, currency)}
              </span>
            </div>
          )}

          {change !== null && percentageChange !== null && (
            <div className='flex items-center justify-between border-t pt-2'>
              <span className='text-sm text-gray-600'>Change</span>
              <div className={cn('flex items-center gap-1 font-semibold', changeColor)}>
                <ChangeIcon className='h-3 w-3' />
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

// Clean KPI Card
const KPICard = ({
  title,
  value,
  icon,
  isLoading,
  className = '',
  trend
}: {
  title: string;
  value: React.ReactNode;
  icon: React.ElementType;
  isLoading: boolean;
  className?: string;
  trend?: 'up' | 'down' | 'neutral';
}) => {
  const Icon = icon;
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : null;

  return (
    <Card className='border bg-white shadow-sm dark:bg-white/10'>
      <CardContent className='p-4'>
        <div className='mb-2 flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <Icon className='h-4 w-4 text-gray-500 dark:text-gray-200' />
            <span className='text-sm font-medium text-gray-600 dark:text-gray-300'>{title}</span>
          </div>
          {TrendIcon && (
            <TrendIcon
              className={cn('h-4 w-4', {
                'text-green-600': trend === 'up',
                'text-red-600': trend === 'down'
              })}
            />
          )}
        </div>

        {isLoading ? (
          <Skeleton className='h-7 w-3/4' />
        ) : (
          <SingleLineEllipsis className={cn('text-xl font-bold text-gray-900', className)}>
            {value}
          </SingleLineEllipsis>
        )}
      </CardContent>
    </Card>
  );
};

const InvestmentInsightModal: React.FC<InvestmentInsightModalProps> = ({
  isOpen,
  onOpenChange,
  investment,
  accountCurrency
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const {
    data: performanceData,
    isLoading,
    isError
  } = useQuery<InvestmentPerformanceData | null>({
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

  const gainLossTrend = (performanceMetrics?.totalGainLoss ?? 0) >= 0 ? 'up' : 'down';

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'max-h-[95vh] gap-0 overflow-y-auto p-0 shadow-lg',
          isExpanded ? 'w-[98vw] max-w-none' : 'w-[95vw] max-w-6xl'
        )}
        hideClose
      >
        {/* Header */}
        <DialogHeader className='px-6 py-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <div className='rounded-lg p-2'>
                <Building2 className='text-primary h-5 w-5' />
              </div>
              <div>
                <DialogTitle className='text-foreground text-xl font-bold'>
                  {investment.symbol}
                </DialogTitle>
                <DialogDescription className='text-secondary'>
                  {performanceData?.currentMarketData?.companyName ||
                    (isLoading ? 'Loading...' : 'Investment Analysis')}
                </DialogDescription>
              </div>
            </div>

            <div className='flex items-center gap-2'>
              <Badge variant='secondary' className='text-xs'>
                <Activity className='mr-1 h-3 w-3' />
                Live
              </Badge>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => setIsExpanded(!isExpanded)}
                className='h-8 w-8 p-0'
              >
                {isExpanded ? <Minimize2 className='h-4 w-4' /> : <Maximize2 className='h-4 w-4' />}
              </Button>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => onOpenChange(false)}
                className='h-8 w-8 p-0'
              >
                <X className='h-4 w-4' />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className='h-full space-y-6 p-6'>
          {/* Performance Summary */}
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
            <KPICard
              title='Market Value'
              value={formatCurrency(performanceMetrics?.currentMarketValue || 0, accountCurrency)}
              icon={DollarSign}
              isLoading={isLoading}
              className='text-blue-600'
            />
            <KPICard
              title='Total Gain/Loss'
              value={
                <span
                  className={
                    (performanceMetrics?.totalGainLoss ?? 0) >= 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  }
                >
                  {formatCurrency(performanceMetrics?.totalGainLoss || 0, accountCurrency)}
                </span>
              }
              icon={TrendingUp}
              isLoading={isLoading}
              trend={gainLossTrend}
            />
            <KPICard
              title='Gain/Loss %'
              value={
                <span
                  className={
                    (performanceMetrics?.gainLossPercentage ?? 0) >= 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  }
                >
                  {(performanceMetrics?.gainLossPercentage || 0).toFixed(2)}%
                </span>
              }
              icon={Percent}
              isLoading={isLoading}
              trend={gainLossTrend}
            />
            <KPICard
              title='Total Dividends'
              value={formatCurrency(investment.dividend ?? 0, accountCurrency)}
              icon={DollarSign}
              isLoading={false}
              className='text-purple-600'
            />
          </div>

          {/* Main Content */}
          <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
            {/* Investment Details */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2 text-lg'>
                  <Share className='h-5 w-5' />
                  Investment Details
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='grid grid-cols-1 gap-4'>
                  <div>
                    <p className='text-sm text-gray-500'>Shares</p>
                    <p className='text-lg font-semibold'>{investment.shares ?? 0}</p>
                  </div>
                  <div>
                    <p className='text-sm text-gray-500'>Purchase Price</p>
                    <SingleLineEllipsis className='text-lg font-semibold'>
                      {formatCurrency(investment.purchasePrice ?? 0, accountCurrency)}
                    </SingleLineEllipsis>
                  </div>
                  <div>
                    <p className='text-sm text-gray-500'>Total Investment</p>
                    <SingleLineEllipsis className='text-lg font-semibold'>
                      {formatCurrency(investment.investedAmount ?? 0, accountCurrency)}
                    </SingleLineEllipsis>
                  </div>
                  <div>
                    <p className='text-sm text-gray-500'>Holding Period</p>
                    <p className='text-lg font-semibold'>
                      {performanceMetrics?.holdingDuration || 'N/A'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Chart */}
            <Card className='lg:col-span-2'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2 text-lg'>
                  <Activity className='h-5 w-5' />
                  Performance Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='h-[300px] w-full'>
                  {isLoading ? (
                    <div className='flex h-full items-center justify-center'>
                      <div className='text-center'>
                        <div className='mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600'></div>
                        <p className='text-sm text-gray-500'>Loading performance data...</p>
                      </div>
                    </div>
                  ) : gainLossChartData.length > 1 ? (
                    <ChartContainer config={{}} className='h-full w-full'>
                      <ResponsiveContainer>
                        <RechartsAreaChart
                          data={gainLossChartData}
                          margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient id='positiveGradient' x1='0' y1='0' x2='0' y2='1'>
                              <stop
                                offset='5%'
                                stopColor='var(--color-positive)'
                                stopOpacity={0.2}
                              />
                              <stop
                                offset='70%'
                                stopColor='var(--color-positive)'
                                stopOpacity={0.1}
                              />
                              <stop offset='100%' stopColor='var(--color-card)' stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id='negativeGradient' x1='0' y1='0' x2='0' y2='1'>
                              <stop offset='5%' stopColor='var(--color-card)' stopOpacity={0} />
                              <stop
                                offset='95%'
                                stopColor='var(--color-negative)'
                                stopOpacity={0.3}
                              />
                              <stop
                                offset='100%'
                                stopColor='var(--color-negative)'
                                stopOpacity='0.5'
                              />
                            </linearGradient>

                            <filter id='glow' x='-10%' y='-10%' width='140%' height='140%'>
                              <feGaussianBlur stdDeviation='1' result='coloredBlur' />
                              <feMerge>
                                <feMergeNode in='coloredBlur' />
                                <feMergeNode in='SourceGraphic' />
                              </feMerge>
                            </filter>
                          </defs>
                          <CartesianGrid strokeDasharray='3 3' className='stroke-gray-200' />
                          <XAxis
                            dataKey='date'
                            tickFormatter={(tick) => format(parseISO(tick), 'MMM dd')}
                            className='text-gray-500'
                            fontSize={12}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            domain={['auto', 'auto']}
                            tickFormatter={yAxisFormatter}
                            className='text-gray-500'
                            fontSize={12}
                            axisLine={false}
                            tickLine={false}
                          />
                          <ChartTooltip
                            cursor={{
                              stroke: 'rgba(59, 130, 246, 0.3)',
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
                            stroke='rgba(156, 163, 175, 0.5)'
                            strokeDasharray='3 3'
                            strokeWidth={1}
                          />
                          <Area
                            type='monotone'
                            dataKey='positive'
                            stroke='#10b981'
                            fill='url(#positiveGradient)'
                            strokeWidth={2}
                            filter='url(#glow)'
                          />
                          <Area
                            type='monotone'
                            dataKey='negative'
                            stroke='#ef4444'
                            fill='url(#negativeGradient)'
                            strokeWidth={2}
                            filter='url(#glow)'
                          />
                        </RechartsAreaChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  ) : (
                    <div className='flex h-full items-center justify-center'>
                      <div className='text-center'>
                        <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100'>
                          <Activity className='h-6 w-6 text-gray-400' />
                        </div>
                        <p className='font-medium text-gray-900'>No Performance Data</p>
                        <p className='text-sm text-gray-500'>
                          Historical performance data is not available for this investment.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InvestmentInsightModal;
