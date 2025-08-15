import React, { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ChartContainer,
  ChartConfig,
  ChartLegend,
  ChartLegendContent
} from '@/components/ui/chart';
import { Skeleton } from '../ui/skeleton';
import NoData from '../ui/no-data';
import { formatCurrency, cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Icon } from '../ui/icon';
import { format, parseISO } from 'date-fns';

// --- Custom Tooltip Component ---
const CustomTooltip = ({ active, payload, label, currency }: any) => {
  if (active && payload && payload.length) {
    // Assuming the date is in the label, which is typical for time-series charts
    const dateLabel = label ? format(new Date(label), 'MMM d, yyyy') : 'Details';

    return (
      <div className='custom-chart-tooltip min-w-[200px]'>
        <p className='label mb-2 font-semibold'>{dateLabel}</p>
        <div className='space-y-1'>
          {payload.map((pld: any) => (
            <div key={pld.dataKey} className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <span className='h-2.5 w-2.5 rounded-full' style={{ backgroundColor: pld.color }} />
                <p className='text-muted-foreground text-xs capitalize'>{pld.dataKey}</p>
              </div>
              <p className='desc text-xs font-semibold'>{formatCurrency(pld.value, currency)}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

interface FinancialTrendsChartProps {
  data: Array<{
    date: string;
    income: number | null;
    expense: number | null;
    balance: number | null;
  }>;
  isLoading?: boolean;
  currency: string;
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

export const FinancialTrendsChart: React.FC<FinancialTrendsChartProps> = ({
  data,
  isLoading,
  currency
}) => {
  const [chartType, setChartType] = useState('bar');
  const isMobile = useIsMobile();

  const formatYaxis = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      notation: 'compact',
      compactDisplay: 'short',
      maximumFractionDigits: 1
    }).format(value);
  };

  const formatXaxis = (tickItem: string) => {
    // Assuming tickItem is a date string like '2025-08-01'
    return format(new Date(tickItem), 'MMM d');
  };

  if (isLoading) {
    return (
      <div className='flex h-full flex-col'>
        <div className='mb-4 flex justify-end'>
          <Skeleton className='h-9 w-[150px] rounded-lg' />
        </div>
        <Skeleton className='h-[350px] flex-1 rounded-md' />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className='flex h-[440px] items-center justify-center'>
        <NoData message='No trend data available.' icon='inbox' />
      </div>
    );
  }

  const axisTickStyle = {
    fontSize: isMobile ? 10 : 12,
    fill: 'var(--muted-foreground)'
  };
  const yAxisWidth = isMobile ? 40 : 50;
  const barSize = isMobile ? 15 : 20;
  const lineDotRadius = isMobile ? 2 : 3;
  const lineActiveDotRadius = isMobile ? 4 : 5;

  return (
    <ChartContainer config={trendsChartConfig} className='flex h-full w-full flex-col'>
      {/* CORRECTED: Replaced React.Fragment with a div */}
      <div className='flex h-full w-full flex-col'>
        <div className='mb-4 flex items-center justify-between'>
          <ChartLegend content={<ChartLegendContent />} />
          <Tabs defaultValue='bar' onValueChange={(v) => setChartType(v)}>
            <TabsList className='h-8'>
              <TabsTrigger value='bar' className='h-6 px-2 text-xs'>
                <Icon name='barChart' className='mr-1.5 h-3.5 w-3.5' />
                Bar
              </TabsTrigger>
              <TabsTrigger value='line' className='h-6 px-2 text-xs'>
                <Icon name='lineChart' className='mr-1.5 h-3.5 w-3.5' />
                Line
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className='flex-1'>
          {chartType === 'bar' ? (
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
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
                  tick={axisTickStyle}
                  tickFormatter={formatXaxis}
                  interval='preserveStartEnd'
                  minTickGap={isMobile ? 30 : 20}
                />
                <YAxis
                  tickFormatter={formatYaxis}
                  tickLine={false}
                  axisLine={false}
                  tick={axisTickStyle}
                  width={yAxisWidth}
                />
                <Tooltip
                  cursor={{ fill: 'var(--muted)', opacity: 0.5 }}
                  content={<CustomTooltip currency={currency} />}
                />
                <Bar
                  dataKey='income'
                  fill='var(--color-income)'
                  radius={[4, 4, 0, 0]}
                  barSize={barSize}
                />
                <Bar
                  dataKey='expense'
                  fill='var(--color-expense)'
                  radius={[4, 4, 0, 0]}
                  barSize={barSize}
                />
                <Bar
                  dataKey='balance'
                  fill='var(--color-balance)'
                  radius={[4, 4, 0, 0]}
                  barSize={barSize}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width='100%' height='100%'>
              <RechartsLineChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
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
                  tick={axisTickStyle}
                  tickFormatter={formatXaxis}
                  interval='preserveStartEnd'
                  minTickGap={isMobile ? 30 : 20}
                />
                <YAxis
                  tickFormatter={formatYaxis}
                  tickLine={false}
                  axisLine={false}
                  tick={axisTickStyle}
                  width={yAxisWidth}
                />
                <Tooltip
                  cursor={{ stroke: 'var(--border)', strokeDasharray: '3 3' }}
                  content={<CustomTooltip currency={currency} />}
                />
                <Line
                  type='monotone'
                  dataKey='income'
                  stroke='var(--color-income)'
                  strokeWidth={2}
                  dot={{ r: lineDotRadius, strokeWidth: 1, fill: 'var(--background)' }}
                  activeDot={{ r: lineActiveDotRadius, strokeWidth: 1 }}
                  connectNulls
                />
                <Line
                  type='monotone'
                  dataKey='expense'
                  stroke='var(--color-expense)'
                  strokeWidth={2}
                  dot={{ r: lineDotRadius, strokeWidth: 1, fill: 'var(--background)' }}
                  activeDot={{ r: lineActiveDotRadius, strokeWidth: 1 }}
                  connectNulls
                />
                <Line
                  type='monotone'
                  dataKey='balance'
                  stroke='var(--color-balance)'
                  strokeWidth={2}
                  dot={{ r: lineDotRadius, strokeWidth: 1, fill: 'var(--background)' }}
                  activeDot={{ r: lineActiveDotRadius, strokeWidth: 1 }}
                  connectNulls
                />
              </RechartsLineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </ChartContainer>
  );
};
