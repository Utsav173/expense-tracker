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
  ChartLegend,
  ChartLegendContent
} from '@/components/ui/chart';
import Loader from '../ui/loader';
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
    color: 'hsl(155 52% 47%)' // Corresponds to your --green
  },
  expense: {
    label: 'Expense',
    color: 'hsl(20 82% 52%)' // Corresponds to your --red
  },
  balance: {
    label: 'Balance',
    color: 'hsl(260 55% 61%)' // Corresponds to your --blue
  }
} satisfies ChartConfig;

// Custom tooltip component for better styling
const CustomTooltip = ({ active, payload, label, currency }: any) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className='bg-background/95 border-border/50 min-w-[200px] rounded-lg border p-3 shadow-lg backdrop-blur-sm'>
      <p className='text-foreground mb-2 text-sm font-medium'>{label}</p>
      <div className='space-y-1'>
        {payload.map((entry: any, index: number) => (
          <div key={index} className='flex items-center justify-between gap-3'>
            <div className='flex items-center gap-2'>
              <div className='h-2.5 w-2.5 rounded-full' style={{ backgroundColor: entry.color }} />
              <span className='text-muted-foreground text-xs capitalize'>{entry.dataKey}</span>
            </div>
            <span className='text-foreground font-mono text-sm font-medium tabular-nums'>
              {entry.value !== null ? formatCurrency(entry.value, currency) : 'N/A'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

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
        <Loader />
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

  const commonProps = {
    data: processedData,
    margin: { top: 15, right: 15, left: 5, bottom: 5 }
  };

  const axisProps = {
    xAxis: {
      dataKey: 'date',
      tickLine: false,
      axisLine: false,
      tick: { fontSize: 11, fill: 'var(--muted-foreground)' },
      interval: 'preserveStartEnd' as const,
      minTickGap: 20
    },
    yAxis: {
      tickFormatter: formatYaxis,
      tickLine: false,
      axisLine: false,
      tick: { fontSize: 11, fill: 'var(--muted-foreground)' },
      width: 50
    }
  };

  return (
    <div className={`relative h-[320px] w-full ${className}`}>
      <ChartContainer config={trendsChartConfig} className='h-full w-full'>
        <ResponsiveContainer width='100%' height='100%'>
          {chartType === 'bar' ? (
            <RechartsBarChart {...commonProps}>
              <CartesianGrid
                strokeDasharray='3 3'
                vertical={false}
                stroke='var(--border)'
                strokeOpacity={0.3}
              />
              <XAxis {...axisProps.xAxis} />
              <YAxis {...axisProps.yAxis} />
              <ChartTooltip
                cursor={{ fill: '(var(--muted)', fillOpacity: 0.1 }}
                content={<CustomTooltip currency={currency} />}
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar
                dataKey='income'
                fill='var(--color-income)'
                radius={[3, 3, 0, 0]}
                animationDuration={600}
                minPointSize={2}
              />
              <Bar
                dataKey='expense'
                fill='var(--color-expense)'
                radius={[3, 3, 0, 0]}
                animationDuration={600}
                minPointSize={2}
              />
              <Bar
                dataKey='balance'
                fill='var(--color-balance)'
                radius={[3, 3, 0, 0]}
                animationDuration={600}
                minPointSize={2}
              />
            </RechartsBarChart>
          ) : chartType === 'area' ? (
            <RechartsAreaChart {...commonProps}>
              <defs>
                <linearGradient id='incomeGradient' x1='0' y1='0' x2='0' y2='1'>
                  <stop offset='5%' stopColor='var(--color-income)' stopOpacity={0.4} />
                  <stop offset='95%' stopColor='var(--color-income)' stopOpacity={0} />
                </linearGradient>
                <linearGradient id='expenseGradient' x1='0' y1='0' x2='0' y2='1'>
                  <stop offset='5%' stopColor='var(--color-expense)' stopOpacity={0.4} />
                  <stop offset='95%' stopColor='var(--color-expense)' stopOpacity={0} />
                </linearGradient>
                <linearGradient id='balanceGradient' x1='0' y1='0' x2='0' y2='1'>
                  <stop offset='5%' stopColor='var(--color-balance)' stopOpacity={0.4} />
                  <stop offset='95%' stopColor='var(--color-balance)' stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray='3 3'
                vertical={false}
                stroke='var(--border)'
                strokeOpacity={0.3}
              />
              <XAxis {...axisProps.xAxis} />
              <YAxis {...axisProps.yAxis} />
              <ChartTooltip
                cursor={{
                  stroke: 'var(--muted-foreground)',
                  strokeWidth: 1,
                  strokeDasharray: '3 3'
                }}
                content={<CustomTooltip currency={currency} />}
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Area
                type='monotone'
                dataKey='income'
                stroke='var(--color-income)'
                strokeWidth={2}
                fill='url(#incomeGradient)'
                activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--background)' }}
                animationDuration={600}
                connectNulls
              />
              <Area
                type='monotone'
                dataKey='expense'
                stroke='var(--color-expense)'
                strokeWidth={2}
                fill='url(#expenseGradient)'
                activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--background)' }}
                animationDuration={600}
                connectNulls
              />
              <Area
                type='monotone'
                dataKey='balance'
                stroke='var(--color-balance)'
                strokeWidth={2}
                fill='url(#balanceGradient)'
                activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--background)' }}
                animationDuration={600}
                connectNulls
              />
            </RechartsAreaChart>
          ) : (
            <RechartsLineChart {...commonProps}>
              <CartesianGrid
                strokeDasharray='3 3'
                vertical={false}
                stroke='var(--border)'
                strokeOpacity={0.3}
              />
              <XAxis {...axisProps.xAxis} />
              <YAxis {...axisProps.yAxis} />
              <ChartTooltip
                cursor={{
                  stroke: 'var(--muted-foreground)',
                  strokeWidth: 1,
                  strokeDasharray: '3 3'
                }}
                content={<CustomTooltip currency={currency} />}
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Line
                type='monotone'
                dataKey='income'
                stroke='var(--color-income)'
                strokeWidth={2.5}
                dot={{
                  r: 3,
                  fill: 'var(--color-income)',
                  strokeWidth: 2,
                  stroke: 'var(--background)'
                }}
                activeDot={{ r: 6, strokeWidth: 2, stroke: 'var(--background)' }}
                animationDuration={600}
                connectNulls
              />
              <Line
                type='monotone'
                dataKey='expense'
                stroke='var(--color-expense)'
                strokeWidth={2.5}
                dot={{
                  r: 3,
                  fill: 'var(--color-expense)',
                  strokeWidth: 2,
                  stroke: 'var(--background)'
                }}
                activeDot={{ r: 6, strokeWidth: 2, stroke: 'var(--background)' }}
                animationDuration={600}
                connectNulls
              />
              <Line
                type='monotone'
                dataKey='balance'
                stroke='var(--color-balance)'
                strokeWidth={2.5}
                dot={{
                  r: 3,
                  fill: 'var(--color-balance)',
                  strokeWidth: 2,
                  stroke: 'hsl(var(--background))'
                }}
                activeDot={{ r: 6, strokeWidth: 2, stroke: 'hsl(var(--background))' }}
                animationDuration={600}
                connectNulls
              />
            </RechartsLineChart>
          )}
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
};
