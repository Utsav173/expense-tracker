import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { BarChart2, LineChart } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  XAxis,
  YAxis
} from 'recharts';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { formatCurrency } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

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

  if (isLoading) {
    return (
      <Card className='border-border/40 border shadow-xs'>
        <CardHeader className='pb-4'>
          <Skeleton className='h-6 w-48 rounded-md' />
          <Skeleton className='h-4 w-72 rounded-md opacity-70' />
        </CardHeader>
        <CardContent>
          <Skeleton className='h-[350px] rounded-md' />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className='border-border/40 flex h-[440px] items-center justify-center border shadow-xs'>
        <NoData message='No trend data available.' icon='inbox' />
      </Card>
    );
  }

  const axisTickStyle = {
    fontSize: isMobile ? 10 : 12,
    fill: 'var(--muted-foreground)'
  };
  const yAxisWidth = isMobile ? 35 : 45;
  const barSize = isMobile ? 15 : 20;
  const lineDotRadius = isMobile ? 2 : 3;
  const lineActiveDotRadius = isMobile ? 4 : 5;

  return (
    <Card className='border-border/40 overflow-hidden border shadow-xs transition-all duration-200'>
      <CardHeader className='flex flex-none gap-2 pb-2'>
        <Tabs defaultValue='bar' className='w-full' onValueChange={(v) => setChartType(v)}>
          <TabsList className='grid w-full grid-cols-2 max-sm:w-full'>
            <TabsTrigger value='bar' className='flex items-center gap-1'>
              <BarChart2 className='h-3.5 w-3.5' />
              <span>Bar</span>
            </TabsTrigger>
            <TabsTrigger value='line' className='flex items-center gap-1'>
              <LineChart className='h-3.5 w-3.5' />
              <span>Line</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>

      <CardContent className='px-2 pt-0 pb-0'>
        <ChartContainer
          config={trendsChartConfig}
          className='h-[320px] w-full'
          aria-label={`Chart showing income, expense, and balance trends as a ${chartType} chart.`}
        >
          {chartType === 'bar' ? (
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart data={data} margin={{ top: 10, right: 5, left: -10, bottom: 0 }}>
                <CartesianGrid
                  strokeDasharray='3 3'
                  vertical={false}
                  horizontal={false}
                  stroke='var(--border)'
                  strokeOpacity={0.5}
                />
                <XAxis
                  dataKey='date'
                  tickLine={false}
                  axisLine={{ stroke: 'var(--border)' }}
                  tick={axisTickStyle}
                  interval='preserveStartEnd'
                  minTickGap={isMobile ? 20 : 15}
                />
                <YAxis
                  tickFormatter={formatYaxis}
                  tickLine={true}
                  dx={-5}
                  axisLine={{ stroke: 'var(--border)' }}
                  tick={axisTickStyle}
                  width={yAxisWidth}
                />
                <ChartTooltip
                  cursor={{ fill: 'var(--muted)' }}
                  content={
                    <ChartTooltipContent
                      formatter={(value) => formatCurrency(value as number, currency)}
                      labelKey='date'
                    />
                  }
                />
                <ChartLegend content={<ChartLegendContent />} verticalAlign='top' height={36} />
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
              <RechartsLineChart data={data} margin={{ top: 10, right: 5, left: -10, bottom: 0 }}>
                <CartesianGrid
                  strokeDasharray='3 3'
                  vertical={false}
                  horizontal={false}
                  stroke='var(--border)'
                  strokeOpacity={0.5}
                />
                <XAxis
                  dataKey='date'
                  tickLine={false}
                  axisLine={{ stroke: 'var(--border)' }}
                  tick={axisTickStyle}
                  interval='preserveStartEnd'
                  minTickGap={isMobile ? 20 : 15}
                />
                <YAxis
                  tickFormatter={formatYaxis}
                  tickLine={true}
                  dx={-5}
                  axisLine={{ stroke: 'var(--border)' }}
                  tick={axisTickStyle}
                  width={yAxisWidth}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      formatter={(value) => formatCurrency(value as number, currency)}
                      labelKey='date'
                    />
                  }
                />
                <ChartLegend content={<ChartLegendContent />} verticalAlign='top' height={36} />
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
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
