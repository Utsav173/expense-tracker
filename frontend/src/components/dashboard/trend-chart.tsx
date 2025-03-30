'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { DateRange } from 'react-day-picker';
import DateRangePicker from '@/components/date-range-picker';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { format, isValid, startOfDay, endOfDay, addDays } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ChartDataPoint {
  x: number; // timestamp in seconds
  y: number;
}

interface TrendChartProps {
  incomeData?: ChartDataPoint[];
  expenseData?: ChartDataPoint[];
  balanceData?: ChartDataPoint[];
  className?: string;
}

type VisibilityKey = 'income' | 'expense' | 'balance';

const chartConfig = {
  income: { label: 'Income', color: 'hsl(142, 76%, 36%)' },
  expense: { label: 'Expense', color: 'hsl(0, 84%, 60%)' },
  balance: { label: 'Balance', color: 'hsl(214, 100%, 49%)' }
};

const formatCurrency = (value: number | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) return '₹0';

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(value);
};

const formatCombinedChartData = (
  incomeData: ChartDataPoint[] = [],
  expenseData: ChartDataPoint[] = [],
  balanceData: ChartDataPoint[] = [],
  dateRange?: DateRange
) => {
  const startTimestamp = dateRange?.from ? startOfDay(dateRange.from).getTime() / 1000 : 0;
  const endTimestamp = dateRange?.to ? endOfDay(dateRange.to).getTime() / 1000 : Infinity;

  const combinedMap = new Map<
    string,
    { date: string; income?: number; expense?: number; balance?: number; timestamp: number }
  >();

  const processData = (data: ChartDataPoint[] = [], key: VisibilityKey) => {
    data.forEach((point) => {
      if (!point || typeof point.x !== 'number' || typeof point.y !== 'number') return;
      if (point.x < startTimestamp || point.x > endTimestamp) return;

      const date = new Date(point.x * 1000);
      if (!isValid(date)) return;

      const dateStr = format(date, 'MMM dd');

      if (!combinedMap.has(dateStr)) {
        combinedMap.set(dateStr, {
          date: dateStr,
          timestamp: point.x
        });
      }

      combinedMap.get(dateStr)![key] = point.y;
    });
  };

  processData(incomeData, 'income');
  processData(expenseData, 'expense');
  processData(balanceData, 'balance');

  // Convert to array and sort chronologically
  return Array.from(combinedMap.values()).sort((a, b) => a.timestamp - b.timestamp);
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className='rounded-md border bg-background p-3 shadow-md'>
      <p className='mb-2 text-sm font-medium'>{label}</p>
      {payload.map((entry: any, index: number) => (
        <div key={`tooltip-${index}`} className='flex justify-between gap-4 text-sm'>
          <span style={{ color: entry.color }}>{entry.name}:</span>
          <span className='font-medium'>{formatCurrency(entry.value)}</span>
        </div>
      ))}
    </div>
  );
};

// Custom legend with toggle functionality
const CustomLegend = ({ payload, visibility, onToggle }: any) => {
  if (!payload) return null;

  return (
    <div className='mb-2 mt-1 flex flex-wrap justify-center gap-3'>
      {payload.map((entry: any, index: number) => {
        const dataKey = entry.dataKey;
        if (!dataKey || !isVisibilityKey(dataKey)) return null;

        const isActive = visibility[dataKey];

        return (
          <Badge
            key={`legend-${index}`}
            variant={isActive ? 'default' : 'outline'}
            className={cn(
              'cursor-pointer px-3 py-1 font-normal',
              isActive ? 'opacity-100' : 'opacity-60'
            )}
            onClick={() => onToggle(dataKey)}
            style={{
              backgroundColor: isActive ? entry.color : 'transparent',
              color: isActive ? 'white' : entry.color,
              borderColor: entry.color
            }}
          >
            {entry.value}
          </Badge>
        );
      })}
    </div>
  );
};

function isVisibilityKey(key: any): key is VisibilityKey {
  return typeof key === 'string' && ['income', 'expense', 'balance'].includes(key);
}

const TrendChart: React.FC<TrendChartProps> = ({
  incomeData = [],
  expenseData = [],
  balanceData = [],
  className
}) => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [visibility, setVisibility] = useState({
    income: true,
    expense: true,
    balance: true
  });

  const combinedChartData = useMemo(
    () => formatCombinedChartData(incomeData, expenseData, balanceData, dateRange),
    [incomeData, expenseData, balanceData, dateRange]
  );

  const dateRangeDescription = useMemo(() => {
    if (dateRange?.from && dateRange?.to) {
      return `Activity from ${format(dateRange.from, 'PPP')} to ${format(dateRange.to, 'PPP')}`;
    }
    return 'Daily activity overview (all time)';
  }, [dateRange]);

  const handleLegendToggle = useCallback((dataKey: VisibilityKey) => {
    setVisibility((prev) => ({ ...prev, [dataKey]: !prev[dataKey] }));
  }, []);

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className='space-y-2 pb-2'>
        <div className='flex flex-row items-center justify-between'>
          <CardTitle>Income, Expense & Balance Trend</CardTitle>
          <DateRangePicker
            dateRange={dateRange}
            setDateRange={setDateRange}
            className='w-auto sm:w-[280px]'
          />
        </div>
        <CardDescription>{dateRangeDescription}</CardDescription>
      </CardHeader>

      <CardContent className='px-0 pt-4 sm:px-2'>
        {combinedChartData.length > 0 ? (
          <>
            <CustomLegend
              payload={Object.entries(chartConfig).map(([key, config]) => ({
                value: config.label,
                color: config.color,
                dataKey: key
              }))}
              visibility={visibility}
              onToggle={handleLegendToggle}
            />

            <ResponsiveContainer width='100%' height={350}>
              <ComposedChart
                data={combinedChartData}
                margin={{ top: 5, right: 20, left: 10, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray='3 3' vertical={false} strokeOpacity={0.3} />
                <XAxis
                  dataKey='date'
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  padding={{ left: 10, right: 10 }}
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  interval='preserveStartEnd'
                />
                <YAxis
                  yAxisId='left'
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={formatCurrency}
                  width={60}
                />
                <Tooltip content={<CustomTooltip />} />

                {/* Render visible bars and lines */}
                {visibility.income && (
                  <Bar
                    yAxisId='left'
                    dataKey='income'
                    name='Income'
                    fill={chartConfig.income.color}
                    radius={[4, 4, 0, 0]}
                    barSize={12}
                    maxBarSize={20}
                  />
                )}

                {visibility.expense && (
                  <Bar
                    yAxisId='left'
                    dataKey='expense'
                    name='Expense'
                    fill={chartConfig.expense.color}
                    radius={[4, 4, 0, 0]}
                    barSize={12}
                    maxBarSize={20}
                  />
                )}

                {visibility.balance && (
                  <Line
                    yAxisId='left'
                    type='monotone'
                    dataKey='balance'
                    name='Balance'
                    stroke={chartConfig.balance.color}
                    strokeWidth={2}
                    dot={{ r: 1 }}
                    activeDot={{ r: 5 }}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </>
        ) : (
          <div className='flex h-[350px] items-center justify-center'>
            <div className='p-6 text-center'>
              <div className='mb-2 text-3xl'>📊</div>
              <p className='text-muted-foreground'>
                No transaction data available for the selected period.
              </p>
              {dateRange && (
                <button
                  className='mt-2 text-sm text-primary underline'
                  onClick={() => setDateRange(undefined)}
                >
                  Reset date filter
                </button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TrendChart;
