'use client';

import React, { useMemo, useState, useCallback } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend
} from 'recharts';
import { format as formatDate, isValid, startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import NoData from '../ui/no-data';

// --- Types ---

interface ApiChartDataPoint {
  x: number; // Unix timestamp (seconds)
  y: number | null;
}

interface ProcessedChartDataPoint {
  dateLabel: string;
  preciseDateLabel: string;
  timestamp: number;
  income: number | null;
  expense: number | null;
  balance: number | null;
}

interface TrendChartProps {
  incomeData: ApiChartDataPoint[];
  expenseData: ApiChartDataPoint[];
  balanceData: ApiChartDataPoint[];
  className?: string;
  currency?: string;
  chartType?: 'line' | 'bar' | 'area';
}

type VisibilityKey = 'income' | 'expense' | 'balance';

// --- Constants ---

const chartConfig: Record<VisibilityKey, { label: string; color: string }> = {
  income: { label: 'Income', color: 'hsl(var(--chart-2))' },
  expense: { label: 'Expense', color: 'hsl(var(--chart-1))' },
  balance: { label: 'Balance', color: 'hsl(var(--chart-4))' }
};
const DEFAULT_CURRENCY = 'INR';

// --- Helper Functions ---

const formatCurrencyCompact = (value: number | undefined | null, currency: string): string => {
  if (value === null || value === undefined || isNaN(value)) return `${currency}0`;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(value);
};

const formatCurrencyTooltip = (value: number | undefined | null, currency: string): string => {
  if (value === null || value === undefined || isNaN(value)) return `${currency}0.00`;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

const processChartData = (
  incomeData: ApiChartDataPoint[] = [],
  expenseData: ApiChartDataPoint[] = [],
  balanceData: ApiChartDataPoint[] = []
): ProcessedChartDataPoint[] => {
  const combinedMap = new Map<number, Partial<ProcessedChartDataPoint> & { timestamp: number }>();

  const processDataSeries = (data: ApiChartDataPoint[], key: VisibilityKey) => {
    if (!Array.isArray(data)) return; // Ensure data is an array

    data.forEach((point) => {
      // Basic validation for point structure
      if (point?.x === undefined || point.x === null) return;

      const date = new Date(point.x * 1000);
      if (!isValid(date)) return;

      const dayTimestamp = startOfDay(date).getTime() / 1000;
      const value = typeof point.y === 'number' && isFinite(point.y) ? point.y : null; // Ensure finite number

      const existingEntry = combinedMap.get(dayTimestamp);
      const entry = existingEntry || { timestamp: dayTimestamp };

      entry[key] = value;

      combinedMap.set(dayTimestamp, entry);
    });
  };

  processDataSeries(incomeData, 'income');
  processDataSeries(expenseData, 'expense');
  processDataSeries(balanceData, 'balance');

  return Array.from(combinedMap.values())
    .sort((a, b) => a.timestamp - b.timestamp)
    .map((entry) => {
      const dateObj = new Date(entry.timestamp * 1000);

      let calculatedBalance = entry.balance;
      if (calculatedBalance === undefined || calculatedBalance === null) {
        const income = entry.income ?? 0;
        const expense = entry.expense ?? 0;
        calculatedBalance = income - expense;
      }

      return {
        dateLabel: formatDate(dateObj, 'MMM d'),
        preciseDateLabel: formatDate(dateObj, 'PPP'),
        timestamp: entry.timestamp,
        income: entry.income ?? null,
        expense: entry.expense ?? null,
        balance: calculatedBalance
      };
    });
};

function isVisibilityKey(key: any): key is VisibilityKey {
  return typeof key === 'string' && ['income', 'expense', 'balance'].includes(key);
}

// --- Custom Components for Recharts ---

const CustomTooltip = React.memo(({ active, payload, label, currency }: any) => {
  if (!active || !payload || !payload.length) return null;

  const dataPoint = payload[0]?.payload as ProcessedChartDataPoint | undefined;
  const preciseDateLabel = dataPoint?.preciseDateLabel || label; // Fallback just in case

  return (
    <div className='rounded-lg border bg-background/95 p-2 text-xs shadow-lg backdrop-blur-sm'>
      <p className='mb-1 font-medium'>{preciseDateLabel}</p>
      <div className='grid grid-cols-[auto_auto] gap-x-2 gap-y-0.5'>
        {payload
          .filter(
            (entry: any) => entry.value !== null && entry.dataKey && entry.value !== undefined
          )
          .map((entry: any, index: number) => (
            <React.Fragment key={`tooltip-${index}`}>
              <div className='flex items-center gap-1.5'>
                <span
                  className='h-1.5 w-1.5 rounded-full'
                  style={{ backgroundColor: entry.color }}
                />
                <span className='text-muted-foreground'>{entry.name}:</span>
              </div>
              <span className='text-right font-semibold'>
                {formatCurrencyTooltip(entry.value as number, currency)}
              </span>
            </React.Fragment>
          ))}
      </div>
    </div>
  );
});
CustomTooltip.displayName = 'CustomTooltip';

const CustomLegend = React.memo(({ payload, visibility, onToggle }: any) => {
  if (!payload) return null;

  return (
    <div className='mb-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 px-4'>
      {payload.map((entry: any, index: number) => {
        const dataKey = entry.dataKey;
        if (!dataKey || !isVisibilityKey(dataKey)) return null;

        const isActive = visibility[dataKey];

        return (
          <button
            key={`legend-${index}`}
            onClick={() => onToggle(dataKey)}
            className={cn(
              'flex cursor-pointer items-center gap-1.5 rounded-full px-2 py-0.5 text-xs transition-opacity focus:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1',
              isActive ? 'opacity-100' : 'opacity-40 hover:opacity-70'
            )}
            aria-pressed={isActive}
          >
            <span
              className='h-2 w-2 flex-shrink-0 rounded-full'
              style={{ backgroundColor: entry.color }}
            />
            <span
              style={{
                color: isActive ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))'
              }}
            >
              {entry.value}
            </span>
          </button>
        );
      })}
    </div>
  );
});
CustomLegend.displayName = 'CustomLegend';

export const TrendChart: React.FC<TrendChartProps> = ({
  incomeData = [], // Provide default empty arrays
  expenseData = [],
  balanceData = [],
  className,
  currency = DEFAULT_CURRENCY,
  chartType = 'line'
}) => {
  const [visibility, setVisibility] = useState<Record<VisibilityKey, boolean>>({
    income: true,
    expense: true,
    balance: true
  });

  const isMobile = useIsMobile();

  const processedChartData = useMemo(
    () => processChartData(incomeData, expenseData, balanceData),
    [incomeData, expenseData, balanceData]
  );

  const handleLegendToggle = useCallback((dataKey: VisibilityKey) => {
    setVisibility((prev) => ({ ...prev, [dataKey]: !prev[dataKey] }));
  }, []);

  const yAxisDomain = useMemo((): [number, number] => {
    if (!processedChartData || processedChartData.length === 0) return [0, 100];

    let minVal = Infinity;
    let maxVal = -Infinity;
    let hasValidValue = false;

    processedChartData.forEach((dataPoint) => {
      (Object.keys(visibility) as VisibilityKey[]).forEach((key) => {
        if (!visibility[key]) return; // Skip hidden series

        const value = dataPoint[key];
        if (value !== null && typeof value === 'number' && isFinite(value)) {
          minVal = Math.min(minVal, value);
          maxVal = Math.max(maxVal, value);
          hasValidValue = true;
        }
      });
    });

    if (!hasValidValue) return [0, 100];
    if (minVal === Infinity || maxVal === -Infinity) {
      minVal = Math.min(0, minVal);
      maxVal = Math.max(0, maxVal);
    }
    if (minVal === maxVal) {
      const buffer = Math.abs(minVal * 0.1) || 100;
      return [minVal - buffer, maxVal + buffer];
    }

    const range = maxVal - minVal;
    const padding = Math.max(range * 0.15, 20);

    const finalMin = Math.floor(minVal - padding);
    const finalMax = Math.ceil(maxVal + padding);

    if (finalMin >= finalMax) return [finalMin, finalMin + 100];

    return [finalMin, finalMax];
  }, [processedChartData, visibility]);

  if (!processedChartData || processedChartData.length === 0) {
    return (
      <div className={cn('flex h-full w-full items-center justify-center', className)}>
        <NoData message='Not enough data for trends.' icon='inbox' />
      </div>
    );
  }

  return (
    <div className={cn('h-full w-full', className)}>
      <CustomLegend
        payload={Object.entries(chartConfig).map(([key, config]) => ({
          value: config.label,
          color: config.color,
          dataKey: key
        }))}
        visibility={visibility}
        onToggle={handleLegendToggle}
      />

      <ResponsiveContainer width='100%' height='80%'>
        <ComposedChart
          data={processedChartData}
          margin={{ top: 5, right: 10, left: isMobile ? -25 : -15, bottom: 0 }}
          barGap={isMobile ? 1 : 2}
          barCategoryGap={isMobile ? '15%' : '20%'}
        >
          <CartesianGrid strokeDasharray='3 3' vertical={false} stroke='hsl(var(--border)/0.5)' />

          <XAxis
            dataKey='timestamp'
            type='number'
            scale='time'
            domain={['dataMin', 'dataMax']}
            tickFormatter={(unixTime) => formatDate(new Date(unixTime * 1000), 'MMM d')}
            fontSize={10}
            tickLine={false}
            axisLine={false}
            dy={10}
            interval='preserveStartEnd'
            tickCount={isMobile ? 4 : 8}
          />

          <YAxis
            yAxisId='left'
            fontSize={10}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => formatCurrencyCompact(value, currency)}
            width={isMobile ? 45 : 55}
            domain={yAxisDomain}
            allowDataOverflow={false}
          />

          <Tooltip
            content={<CustomTooltip currency={currency} />}
            cursor={{ fill: 'hsl(var(--accent)/0.3)' }}
          />

          <ReferenceLine
            yAxisId='left'
            y={0}
            stroke='hsl(var(--foreground)/0.3)'
            strokeWidth={1}
            label={{
              position: 'insideLeft',
              value: '0',
              fill: 'hsl(var(--muted-foreground))',
              fontSize: 10,
              dy: -5,
              dx: isMobile ? 5 : 10
            }}
          />

          {chartType === 'bar' ? (
            <>
              {visibility.income && (
                <Bar
                  yAxisId='left'
                  dataKey='income'
                  name='Income'
                  fill={chartConfig.income.color}
                  radius={[3, 3, 0, 0]}
                  barSize={isMobile ? 5 : 8}
                  maxBarSize={12}
                  fillOpacity={0.8}
                />
              )}
              {visibility.expense && (
                <Bar
                  yAxisId='left'
                  dataKey='expense'
                  name='Expense'
                  fill={chartConfig.expense.color}
                  radius={[3, 3, 0, 0]}
                  barSize={isMobile ? 5 : 8}
                  maxBarSize={12}
                  fillOpacity={0.8}
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
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                  connectNulls={true}
                />
              )}
            </>
          ) : chartType === 'area' ? (
            <>
              {visibility.income && (
                <Area
                  yAxisId='left'
                  type='monotone'
                  dataKey='income'
                  name='Income'
                  fill={chartConfig.income.color}
                  stroke={chartConfig.income.color}
                  strokeWidth={2}
                  fillOpacity={0.3}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                  connectNulls={true}
                />
              )}
              {visibility.expense && (
                <Area
                  yAxisId='left'
                  type='monotone'
                  dataKey='expense'
                  name='Expense'
                  fill={chartConfig.expense.color}
                  stroke={chartConfig.expense.color}
                  strokeWidth={2}
                  fillOpacity={0.3}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                  connectNulls={true}
                />
              )}
              {visibility.balance && (
                <Line
                  yAxisId='left'
                  type='monotone'
                  dataKey='balance'
                  name='Balance'
                  stroke={chartConfig.balance.color}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                  connectNulls={true}
                />
              )}
            </>
          ) : (
            <>
              {visibility.income && (
                <Line
                  yAxisId='left'
                  type='monotone'
                  dataKey='income'
                  name='Income'
                  stroke={chartConfig.income.color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                  connectNulls={true}
                />
              )}
              {visibility.expense && (
                <Line
                  yAxisId='left'
                  type='monotone'
                  dataKey='expense'
                  name='Expense'
                  stroke={chartConfig.expense.color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                  connectNulls={true}
                />
              )}
              {visibility.balance && (
                <Line
                  yAxisId='left'
                  type='monotone'
                  dataKey='balance'
                  name='Balance'
                  stroke={chartConfig.balance.color}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                  connectNulls={true}
                />
              )}
            </>
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};
