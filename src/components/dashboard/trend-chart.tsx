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

const CustomTooltipContent = ({ active, payload, currency }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as ProcessedDataPoint;
    const netFlow = (data.income || 0) - (data.expense || 0);
    const netFlowColor =
      netFlow > 0 ? 'text-positive' : netFlow < 0 ? 'text-negative' : 'text-muted-foreground';

    return (
      <div className='bg-background/90 min-w-[180px] rounded-lg border p-3 text-sm shadow-lg backdrop-blur-sm transition-all'>
        <div className='mb-2'>
          <p className='text-foreground font-bold'>
            {format(new Date(data.timestamp * 1000), 'EEEE, MMM d')}
          </p>
        </div>
        <div className='space-y-1'>
          {payload.map((item: any) => (
            <div key={item.dataKey} className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <span
                  className='h-2.5 w-2.5 shrink-0 rounded-[2px]'
                  style={{ backgroundColor: item.color }}
                />
                <p className='text-muted-foreground'>{item.name}</p>
              </div>
              <p className='text-foreground font-semibold'>
                {formatCurrency(item.value, currency)}
              </p>
            </div>
          ))}
        </div>
        <div className='border-border/50 mt-3 border-t pt-2'>
          <div className='flex items-center justify-between'>
            <p className='text-muted-foreground font-semibold'>Net Flow</p>
            <p className={`font-bold ${netFlowColor}`}>{formatCurrency(netFlow, currency)}</p>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

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

    const processPoints = (points: ApiChartDataPoint[], key: 'income' | 'expense' | 'balance') => {
      points.forEach((point) => {
        if (point.y !== null) {
          const entry = dataMap.get(point.x) || {
            timestamp: point.x,
            date: '', // Will be formatted later
            income: null,
            expense: null,
            balance: null
          };
          entry[key] = point.y;
          dataMap.set(point.x, entry);
        }
      });
    };

    processPoints(filteredIncome, 'income');
    processPoints(filteredExpense, 'expense');
    processPoints(filteredBalance, 'balance');

    const sortedData = Array.from(dataMap.values()).sort((a, b) => a.timestamp - b.timestamp);

    if (sortedData.length < 2) {
      return sortedData.map((point) => ({
        ...point,
        date: format(new Date(point.timestamp * 1000), 'MMM dd')
      }));
    }

    const firstTimestamp = sortedData[0].timestamp * 1000;
    const lastTimestamp = sortedData[sortedData.length - 1].timestamp * 1000;
    const dayDifference = (lastTimestamp - firstTimestamp) / (1000 * 60 * 60 * 24);

    const dateFormat = dayDifference > 365 ? "MMM 'yy" : 'MMM dd';

    return sortedData.map((point) => ({
      ...point,
      date: format(new Date(point.timestamp * 1000), dateFormat)
    }));
  }, [incomeData, expenseData, balanceData, timeRangeOption, customDateRange]);

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
    margin: { top: 15, right: 15, left: -20, bottom: 5 }
  };

  const xAxisProps = {
    dataKey: 'date',
    tickLine: false,
    axisLine: false,
    tick: { fontSize: 11, fill: 'var(--muted-foreground)' },
    interval: 'preserveStartEnd' as const,
    minTickGap: 30
  };

  return (
    <div className={`relative h-[320px] w-full ${className}`}>
      <ChartContainer config={trendsChartConfig} className='h-full w-full'>
        <ResponsiveContainer width='100%' height='100%'>
          {chartType === 'bar' ? (
            <RechartsBarChart {...commonProps}>
              <CartesianGrid
                strokeDasharray='3 3'
                vertical
                horizontal
                stroke='var(--muted-foreground)'
                strokeOpacity={1}
              />
              <XAxis {...xAxisProps} />
              <YAxis hide />
              <ChartTooltip
                cursor={{ fill: 'var(--muted)', opacity: 0.1 }}
                content={<CustomTooltipContent currency={currency} />}
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
                vertical
                horizontal
                stroke='var(--muted-foreground)'
                strokeOpacity={1}
              />
              <XAxis {...xAxisProps} />
              <YAxis hide />
              <ChartTooltip
                cursor={{
                  stroke: 'var(--muted-foreground)',
                  strokeWidth: 1,
                  strokeDasharray: '3 3'
                }}
                content={<CustomTooltipContent currency={currency} />}
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
                vertical
                horizontal
                stroke='var(--muted-foreground)'
                strokeOpacity={1}
              />
              <XAxis {...xAxisProps} />
              <YAxis hide />
              <ChartTooltip
                cursor={{
                  stroke: 'var(--muted-foreground)',
                  strokeWidth: 1,
                  strokeDasharray: '3 3'
                }}
                content={<CustomTooltipContent currency={currency} />}
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Line
                type='monotone'
                dataKey='income'
                stroke='var(--color-income)'
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 6, strokeWidth: 2, stroke: 'var(--background)' }}
                animationDuration={600}
                connectNulls
              />
              <Line
                type='monotone'
                dataKey='expense'
                stroke='var(--color-expense)'
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 6, strokeWidth: 2, stroke: 'var(--background)' }}
                animationDuration={600}
                connectNulls
              />
              <Line
                type='monotone'
                dataKey='balance'
                stroke='var(--color-balance)'
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 6, strokeWidth: 2, stroke: 'var(--background)' }}
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
