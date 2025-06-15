'use client';
import React, { useMemo } from 'react';
import {
  LineChart as RechartsLineChart,
  BarChart as RechartsBarChart,
  AreaChart as RechartsAreaChart,
  Line,
  Bar,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer
} from 'recharts';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { getTimestampsForRange, formatCurrency } from '@/lib/utils';
import {
  ChartContainer,
  ChartConfig,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent
} from '@/components/ui/chart';
import { Skeleton } from '../ui/skeleton';
import NoData from '../ui/no-data';

interface ApiChartDataPoint {
  x: number;
  y: number | null;
}

export interface TrendChartProps {
  incomeData: ApiChartDataPoint[];
  expenseData: ApiChartDataPoint[];
  balanceData: ApiChartDataPoint[];
  className?: string;
  currency?: string;
  chartType?: 'line' | 'bar' | 'area';

  timeRangeOption: string;
  customDateRange?: DateRange;
  isLoading?: boolean;
}

interface ProcessedDataPoint {
  date: string;
  timestamp: number;
  income: number | null;
  expense: number | null;
  balance: number | null;
}

const trendsChartConfig = {
  income: {
    label: 'Income',
    color: 'var(--chart-income)'
  },
  expense: {
    label: 'Expense',
    color: 'var(--chart-expense)'
  },
  balance: {
    label: 'Balance',
    color: 'var(--chart-balance)'
  }
} satisfies ChartConfig;

export const TrendChart: React.FC<TrendChartProps> = ({
  incomeData = [],
  expenseData = [],
  balanceData = [],
  className,
  currency = 'INR',
  chartType = 'line',
  timeRangeOption,
  customDateRange,
  isLoading = false
}) => {
  const processedData = useMemo(() => {
    const allIncome = incomeData ?? [];
    const allExpense = expenseData ?? [];
    const allBalance = balanceData ?? [];

    const { startTimestamp, endTimestamp } = getTimestampsForRange(
      timeRangeOption,
      customDateRange
    );

    const filterFn = (point: ApiChartDataPoint) => {
      if (timeRangeOption === 'all' || !startTimestamp || !endTimestamp) {
        return true;
      }

      return point.x >= startTimestamp && point.x <= endTimestamp;
    };

    const filteredIncome = allIncome.filter(filterFn);
    const filteredExpense = allExpense.filter(filterFn);
    const filteredBalance = allBalance.filter(filterFn);

    const dataMap = new Map<number, ProcessedDataPoint>();

    const ensureDataPoint = (timestamp: number) => {
      if (!dataMap.has(timestamp)) {
        dataMap.set(timestamp, {
          date: format(new Date(timestamp * 1000), 'MMM dd'),
          timestamp,
          income: null,
          expense: null,
          balance: null
        });
      }
      return dataMap.get(timestamp)!;
    };

    filteredIncome.forEach((point) => {
      if (point.y !== null) {
        ensureDataPoint(point.x).income = point.y;
      }
    });

    filteredExpense.forEach((point) => {
      if (point.y !== null) {
        ensureDataPoint(point.x).expense = point.y;
      }
    });

    filteredBalance.forEach((point) => {
      if (point.y !== null) {
        ensureDataPoint(point.x).balance = point.y;
      }
    });

    const sortedData = Array.from(dataMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([_, value]) => value);

    return sortedData;
  }, [incomeData, expenseData, balanceData, timeRangeOption, customDateRange]);

  const formatYaxis = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      notation: 'compact',
      compactDisplay: 'short',
      maximumFractionDigits: 1
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className={`relative h-[320px] w-full ${className}`}>
        <Skeleton className='h-full w-full' />
      </div>
    );
  }

  if (processedData.length === 0) {
    return (
      <div className={`relative flex h-[320px] w-full items-center justify-center ${className}`}>
        <NoData message='No trend data for selected period.' />
      </div>
    );
  }

  return (
    <div className={`relative h-[320px] w-full ${className}`}>
      <ChartContainer config={trendsChartConfig} className='h-full w-full'>
        <ResponsiveContainer width='100%' height='100%'>
          {chartType === 'bar' ? (
            <RechartsBarChart
              data={processedData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray='3 3'
                vertical={false}
                stroke='var(--border)'
                strokeOpacity={0.5}
              />
              <XAxis
                dataKey='date'
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                interval='preserveStartEnd'
                minTickGap={15}
              />
              <YAxis
                tickFormatter={formatYaxis}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                width={45}
              />
              {/* Use standardized ChartTooltip */}
              <ChartTooltip
                cursor={{ fill: 'var(--muted)' }}
                content={
                  <ChartTooltipContent
                    formatter={(value) => formatCurrency(value as number, currency)}
                    labelKey='date'
                  />
                }
              />
              {/* Use standardized ChartLegend */}
              <ChartLegend content={<ChartLegendContent />} verticalAlign='top' height={36} />
              <Bar
                dataKey='income'
                fill='var(--color-income)'
                radius={[4, 4, 0, 0]}
                animationDuration={800}
                minPointSize={3}
              />
              <Bar
                dataKey='expense'
                fill='var(--color-expense)'
                radius={[4, 4, 0, 0]}
                animationDuration={800}
                minPointSize={3}
              />
              <Bar
                dataKey='balance'
                fill='var(--color-balance)'
                radius={[4, 4, 0, 0]}
                animationDuration={800}
                minPointSize={3}
              />
            </RechartsBarChart>
          ) : chartType === 'area' ? (
            <RechartsAreaChart
              data={processedData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                {/* Define gradients using CSS variables */}
                <linearGradient id='incomeGradientArea' x1='0' y1='0' x2='0' y2='1'>
                  <stop offset='0%' stopColor='var(--color-income)' stopOpacity={0.3} />
                  <stop offset='100%' stopColor='var(--color-income)' stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id='expenseGradientArea' x1='0' y1='0' x2='0' y2='1'>
                  <stop offset='0%' stopColor='var(--color-expense)' stopOpacity={0.3} />
                  <stop offset='100%' stopColor='var(--color-expense)' stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id='balanceGradientArea' x1='0' y1='0' x2='0' y2='1'>
                  <stop offset='0%' stopColor='var(--color-balance)' stopOpacity={0.3} />
                  <stop offset='100%' stopColor='var(--color-balance)' stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray='3 3'
                vertical={false}
                stroke='var(--border)'
                strokeOpacity={0.5}
              />
              <XAxis
                dataKey='date'
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                interval='preserveStartEnd'
                minTickGap={15}
              />
              <YAxis
                tickFormatter={formatYaxis}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                width={45}
              />
              {/* Use standardized ChartTooltip */}
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    formatter={(value) => formatCurrency(value as number, currency)}
                    labelKey='date'
                  />
                }
              />
              {/* Use standardized ChartLegend */}
              <ChartLegend content={<ChartLegendContent />} verticalAlign='top' height={36} />
              <Area
                type='monotone'
                dataKey='income'
                stroke='var(--color-income)'
                strokeWidth={2}
                fill='url(#incomeGradientArea)'
                activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }}
                animationDuration={800}
                connectNulls
              />
              <Area
                type='monotone'
                dataKey='expense'
                stroke='var(--color-expense)'
                strokeWidth={2}
                fill='url(#expenseGradientArea)'
                activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }}
                animationDuration={800}
                connectNulls
              />
              <Area
                type='monotone'
                dataKey='balance'
                stroke='var(--color-balance)'
                strokeWidth={2}
                fill='url(#balanceGradientArea)'
                activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }}
                animationDuration={800}
                connectNulls
              />
            </RechartsAreaChart>
          ) : (
            <RechartsLineChart
              data={processedData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray='3 3'
                vertical={false}
                stroke='var(--border)'
                strokeOpacity={0.5}
              />
              <XAxis
                dataKey='date'
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                interval='preserveStartEnd'
                minTickGap={15}
              />
              <YAxis
                tickFormatter={formatYaxis}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                width={45}
              />
              {/* Use standardized ChartTooltip */}
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    formatter={(value) => formatCurrency(value as number, currency)}
                    labelKey='date'
                  />
                }
              />
              {/* Use standardized ChartLegend */}
              <ChartLegend content={<ChartLegendContent />} verticalAlign='top' height={36} />
              <Line
                type='monotone'
                dataKey='income'
                stroke='var(--color-income)'
                strokeWidth={2}
                dot={{
                  r: 2,
                  fill: 'var(--color-income)',
                  strokeWidth: 1,
                  stroke: 'var(--background)'
                }}
                activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--background)' }}
                animationDuration={800}
                connectNulls
              />
              <Line
                type='monotone'
                dataKey='expense'
                stroke='var(--color-expense)'
                strokeWidth={2}
                dot={{
                  r: 2,
                  fill: 'var(--color-expense)',
                  strokeWidth: 1,
                  stroke: 'var(--background)'
                }}
                activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--background)' }}
                animationDuration={800}
                connectNulls
              />
              <Line
                type='monotone'
                dataKey='balance'
                stroke='var(--color-balance)'
                strokeWidth={2}
                dot={{
                  r: 2,
                  fill: 'var(--color-balance)',
                  strokeWidth: 1,
                  stroke: 'var(--background)'
                }}
                activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--background)' }}
                animationDuration={800}
                connectNulls
              />
            </RechartsLineChart>
          )}
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
};
