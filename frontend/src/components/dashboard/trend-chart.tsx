'use client';

import React, { useMemo, useState, useCallback } from 'react';
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
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { format } from 'date-fns';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  BarChart,
  LineChart,
  AreaChart
} from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { getTimestampsForRange } from '@/lib/utils';

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
  setChartType?: (type: 'line' | 'bar' | 'area') => void;
  timeRangeOption: string;
  customDateRange?: DateRange;
}

interface ProcessedDataPoint {
  date: string;
  timestamp: number;
  income: number | null;
  expense: number | null;
  balance: number | null;
  incomeChange?: number;
  expenseChange?: number;
  balanceChange?: number;
}

export const TrendChart: React.FC<TrendChartProps> = ({
  incomeData = [],
  expenseData = [],
  balanceData = [],
  className,
  currency = 'INR',
  chartType = 'line',
  setChartType,
  timeRangeOption,
  customDateRange
}) => {
  const [visibleSeries, setVisibleSeries] = useState({
    income: true,
    expense: true,
    balance: true,
    showAll: true
  });
  const [showMobileChartSelector, setShowMobileChartSelector] = useState(false);

  const toggleMobileChartSelector = () => {
    setShowMobileChartSelector(!showMobileChartSelector);
  };

  const handleChartTypeChange = (type: 'line' | 'bar' | 'area') => {
    if (setChartType) {
      setChartType(type);
    }
    setShowMobileChartSelector(false);
  };

  const selectSeries = useCallback(
    (series: 'income' | 'expense' | 'balance' | 'showAll'): void => {
      if (series === 'showAll') {
        setVisibleSeries({
          income: true,
          expense: true,
          balance: true,
          showAll: true
        });
      } else {
        // Count how many series (excluding showAll) are currently visible
        const activeCount = ['income', 'expense', 'balance'].filter(
          (key) => visibleSeries[key as 'income' | 'expense' | 'balance']
        ).length;
        // If only one is active and user tries to turn it off, reset to all
        if (visibleSeries[series] && activeCount === 1) {
          setVisibleSeries({
            income: true,
            expense: true,
            balance: true,
            showAll: true
          });
        } else {
          setVisibleSeries({
            income: series === 'income',
            expense: series === 'expense',
            balance: series === 'balance',
            showAll: false
          });
        }
      }
    },
    [visibleSeries]
  );

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

    if (sortedData.length > 1) {
      for (let i = 1; i < sortedData.length; i++) {
        const current = sortedData[i];
        const previous = sortedData[i - 1];

        if (current.income !== null && previous.income !== null && previous.income !== 0) {
          current.incomeChange =
            ((current.income - previous.income) / Math.abs(previous.income)) * 100;
        }

        if (current.expense !== null && previous.expense !== null && previous.expense !== 0) {
          current.expenseChange =
            ((current.expense - previous.expense) / Math.abs(previous.expense)) * 100;
        }

        if (current.balance !== null && previous.balance !== null && previous.balance !== 0) {
          current.balanceChange =
            ((current.balance - previous.balance) / Math.abs(previous.balance)) * 100;
        }
      }
    }

    return sortedData;
  }, [incomeData, expenseData, balanceData, timeRangeOption, customDateRange]);

  const formatValue = (value: number | null) => {
    if (value === null) return 'N/A';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercentage = (value: number | undefined) => {
    if (value === undefined) return '';
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getTrendIcon = (change: number | undefined, size = 16) => {
    if (change === undefined) return <Minus size={size} />;
    if (change > 0) return <TrendingUp size={size} className='text-green-500' />;
    if (change < 0) return <TrendingDown size={size} className='text-red-500' />;
    return <Minus size={size} className='text-gray-500' />;
  };

  const getInsightText = (dataPoint: ProcessedDataPoint) => {
    const insights = [];
    if (dataPoint.incomeChange !== undefined && Math.abs(dataPoint.incomeChange) >= 5) {
      insights.push(
        `Income ${dataPoint.incomeChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(dataPoint.incomeChange).toFixed(1)}%`
      );
    }
    if (dataPoint.expenseChange !== undefined && Math.abs(dataPoint.expenseChange) >= 5) {
      insights.push(
        `Expenses ${dataPoint.expenseChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(dataPoint.expenseChange).toFixed(1)}%`
      );
    }
    if (dataPoint.balanceChange !== undefined && Math.abs(dataPoint.balanceChange) >= 5) {
      insights.push(
        `Balance ${dataPoint.balanceChange > 0 ? 'improved' : 'declined'} by ${Math.abs(dataPoint.balanceChange).toFixed(1)}%`
      );
    }
    if (dataPoint.income !== null && dataPoint.expense !== null && dataPoint.income > 0) {
      const ratio = dataPoint.expense / dataPoint.income;
      if (ratio > 1) {
        insights.push(
          `Spending exceeded income by ${formatValue(dataPoint.expense - dataPoint.income)}`
        );
      } else if (ratio < 0.7) {
        insights.push(`Strong savings: ${formatValue(dataPoint.income - dataPoint.expense)} saved`);
      }
    }
    return insights;
  };

  const EnhancedTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload as ProcessedDataPoint;
      const insights = getInsightText(dataPoint);
      const hasAnyData = payload.some((entry: any) => entry.value !== null);

      if (!hasAnyData) return null;

      return (
        <div className='max-w-xs rounded-lg border border-border bg-background p-3 shadow-lg'>
          <p className='mb-2 text-sm font-semibold md:text-base'>{label}</p>
          <div className='space-y-1 md:space-y-2'>
            {payload.map((entry: any, index: number) => {
              if (entry.value === null) return null;
              let name = entry.dataKey as string;
              let change: number | undefined;

              if (name === 'income') {
                name = 'Income';
                change = dataPoint.incomeChange;
              } else if (name === 'expense') {
                name = 'Expense';
                change = dataPoint.expenseChange;
              } else if (name === 'balance') {
                name = 'Balance';
                change = dataPoint.balanceChange;
              }

              return (
                <div key={index} className='flex items-center justify-between text-xs md:text-sm'>
                  <div className='flex items-center gap-1 md:gap-2'>
                    <div
                      className='h-2 w-2 rounded-full md:h-3 md:w-3'
                      style={{ backgroundColor: entry.color }}
                    ></div>
                    <span className='capitalize'>{name}:</span>
                  </div>
                  <div className='flex items-center gap-1 md:gap-2'>
                    <span className='font-medium'>{formatValue(entry.value)}</span>
                    {change !== undefined && (
                      <span
                        className={`text-xs ${
                          change > 0
                            ? 'text-green-500'
                            : change < 0
                              ? 'text-red-500'
                              : 'text-gray-500'
                        }`}
                      >
                        {formatPercentage(change)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {insights.length > 0 && (
            <div className='mt-2 border-t border-border pt-2 md:mt-3 md:pt-3'>
              <div className='mb-1 flex items-center gap-1 text-xs font-medium'>
                <Activity size={12} className='text-blue-500' />
                <span>INSIGHTS</span>
              </div>
              <ul className='space-y-1 text-xs'>
                {insights.map((insight, idx) => (
                  <li key={idx} className='text-muted-foreground'>
                    {insight}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const EnhancedLegend = ({ payload }: any) => {
    if (!payload) return null;
    return (
      <div className='mt-1 flex flex-wrap justify-center gap-2 md:mt-2 md:gap-4'>
        <div
          key='show-all-button'
          className={`flex cursor-pointer items-center rounded-full border px-2 py-1 text-xs transition-all md:px-3 md:text-sm ${
            visibleSeries.showAll
              ? `border-blue-300 bg-blue-100 bg-opacity-10 text-blue-600`
              : 'border-gray-200 bg-gray-100 text-gray-500'
          }`}
          onClick={() => selectSeries('showAll')}
        >
          <div
            className={`mr-1 h-2 w-2 rounded-full md:mr-2 md:h-3 md:w-3 ${
              visibleSeries.showAll ? '' : 'opacity-30'
            }`}
            style={{ backgroundColor: '#64748b' }}
          />
          <span>All</span>
        </div>
        {payload.map((entry: any, index: number) => {
          let seriesKey: 'income' | 'expense' | 'balance' | 'showAll';
          if (entry.value === 'Income') seriesKey = 'income';
          else if (entry.value === 'Expense') seriesKey = 'expense';
          else if (entry.value === 'Balance') seriesKey = 'balance';
          else return null;

          const isActive = visibleSeries[seriesKey];

          return (
            <div
              key={`item-${index}`}
              className={`flex cursor-pointer items-center rounded-full border px-2 py-1 text-xs transition-all md:px-3 md:text-sm ${
                isActive ? `border-2 bg-opacity-10` : 'border-gray-200 bg-gray-100 text-gray-400'
              }`}
              style={{
                backgroundColor: isActive ? `${entry.color}20` : undefined,
                borderColor: isActive ? entry.color : undefined,
                color: isActive ? entry.color : undefined
              }}
              onClick={() => selectSeries(seriesKey)}
            >
              <div
                className='mr-1 h-2 w-2 rounded-full md:mr-2 md:h-3 md:w-3'
                style={{
                  backgroundColor: entry.color,
                  opacity: isActive ? 1 : 0.3
                }}
              />
              <span>{entry.value}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const MobileChartTypeSelector = () => {
    return (
      <div className='absolute right-2 top-2 z-20 md:hidden'>
        <div
          className='flex cursor-pointer items-center rounded-md border border-gray-200 bg-white p-1 shadow-sm'
          onClick={toggleMobileChartSelector}
        >
          {chartType === 'line' && <LineChart className='h-4 w-4 text-blue-500' />}
          {chartType === 'bar' && <BarChart className='h-4 w-4 text-blue-500' />}
          {chartType === 'area' && <AreaChart className='h-4 w-4 text-blue-500' />}
        </div>

        {showMobileChartSelector && (
          <div className='absolute right-0 top-8 z-30 rounded-md border border-gray-200 bg-white p-1 shadow-md'>
            <div
              className={`cursor-pointer rounded-md p-2 ${
                chartType === 'line' ? 'bg-blue-50 text-blue-500' : 'hover:bg-gray-50'
              }`}
              onClick={() => handleChartTypeChange('line')}
            >
              <LineChart className='h-4 w-4' />
            </div>
            <div
              className={`cursor-pointer rounded-md p-2 ${
                chartType === 'bar' ? 'bg-blue-50 text-blue-500' : 'hover:bg-gray-50'
              }`}
              onClick={() => handleChartTypeChange('bar')}
            >
              <BarChart className='h-4 w-4' />
            </div>
            <div
              className={`cursor-pointer rounded-md p-2 ${
                chartType === 'area' ? 'bg-blue-50 text-blue-500' : 'hover:bg-gray-50'
              }`}
              onClick={() => handleChartTypeChange('area')}
            >
              <AreaChart className='h-4 w-4' />
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderChart = () => {
    const commonProps = {
      data: processedData,
      margin: { top: 10, right: 10, left: 0, bottom: 0 }
    };
    const chartProps = { ...commonProps, syncId: 'trendsSync' };
    const axisStyle = { fontSize: 11, fontWeight: 400, color: '#64748b' };

    switch (chartType) {
      case 'bar':
        return (
          <RechartsBarChart {...chartProps}>
            <defs>
              <linearGradient id='incomeGradient' x1='0' y1='0' x2='0' y2='1'>
                <stop offset='0%' stopColor='#4ade80' stopOpacity={0.8} />
                <stop offset='100%' stopColor='#4ade80' stopOpacity={0.2} />
              </linearGradient>
              <linearGradient id='expenseGradient' x1='0' y1='0' x2='0' y2='1'>
                <stop offset='0%' stopColor='#f87171' stopOpacity={0.8} />
                <stop offset='100%' stopColor='#f87171' stopOpacity={0.2} />
              </linearGradient>
              <linearGradient id='balanceGradient' x1='0' y1='0' x2='0' y2='1'>
                <stop offset='0%' stopColor='#60a5fa' stopOpacity={0.8} />
                <stop offset='100%' stopColor='#60a5fa' stopOpacity={0.2} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray='3 3' vertical={false} stroke='#f1f5f9' />
            <XAxis
              dataKey='date'
              tickLine={false}
              axisLine={false}
              style={axisStyle}
              tick={{ fontSize: '0.7rem' }}
              interval='preserveStartEnd'
              minTickGap={15}
            />
            <YAxis
              tickFormatter={(value) =>
                new Intl.NumberFormat('en-IN', {
                  notation: 'compact',
                  compactDisplay: 'short'
                }).format(value)
              }
              tickLine={false}
              axisLine={false}
              style={axisStyle}
              width={35}
              tick={{ fontSize: '0.7rem' }}
            />
            <Tooltip content={<EnhancedTooltip />} />
            <Legend content={<EnhancedLegend />} />
            {visibleSeries.income && (
              <Bar
                dataKey='income'
                name='Income'
                fill='url(#incomeGradient)'
                stroke='#22c55e'
                strokeWidth={1}
                radius={[4, 4, 0, 0]}
                animationDuration={800}
                minPointSize={3}
              />
            )}
            {visibleSeries.expense && (
              <Bar
                dataKey='expense'
                name='Expense'
                fill='url(#expenseGradient)'
                stroke='#ef4444'
                strokeWidth={1}
                radius={[4, 4, 0, 0]}
                animationDuration={800}
                minPointSize={3}
              />
            )}
            {visibleSeries.balance && (
              <Bar
                dataKey='balance'
                name='Balance'
                fill='url(#balanceGradient)'
                stroke='#3b82f6'
                strokeWidth={1}
                radius={[4, 4, 0, 0]}
                animationDuration={800}
                minPointSize={3}
              />
            )}
          </RechartsBarChart>
        );
      case 'area':
        return (
          <RechartsAreaChart {...chartProps}>
            <defs>
              <linearGradient id='incomeGradient' x1='0' y1='0' x2='0' y2='1'>
                <stop offset='0%' stopColor='#4ade80' stopOpacity={0.3} />
                <stop offset='100%' stopColor='#4ade80' stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id='expenseGradient' x1='0' y1='0' x2='0' y2='1'>
                <stop offset='0%' stopColor='#f87171' stopOpacity={0.3} />
                <stop offset='100%' stopColor='#f87171' stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id='balanceGradient' x1='0' y1='0' x2='0' y2='1'>
                <stop offset='0%' stopColor='#60a5fa' stopOpacity={0.3} />
                <stop offset='100%' stopColor='#60a5fa' stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray='3 3' vertical={false} stroke='#f1f5f9' />
            <XAxis
              dataKey='date'
              tickLine={false}
              axisLine={false}
              style={axisStyle}
              tick={{ fontSize: '0.7rem' }}
              interval='preserveStartEnd'
              minTickGap={15}
            />
            <YAxis
              tickFormatter={(value) =>
                new Intl.NumberFormat('en-IN', {
                  notation: 'compact',
                  compactDisplay: 'short'
                }).format(value)
              }
              tickLine={false}
              axisLine={false}
              style={axisStyle}
              width={35}
              tick={{ fontSize: '0.7rem' }}
            />
            <Tooltip content={<EnhancedTooltip />} />
            <Legend content={<EnhancedLegend />} />
            {visibleSeries.income && (
              <Area
                type='monotone'
                dataKey='income'
                name='Income'
                stroke='#22c55e'
                strokeWidth={2}
                fill='url(#incomeGradient)'
                activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }}
                animationDuration={800}
                connectNulls
              />
            )}
            {visibleSeries.expense && (
              <Area
                type='monotone'
                dataKey='expense'
                name='Expense'
                stroke='#ef4444'
                strokeWidth={2}
                fill='url(#expenseGradient)'
                activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }}
                animationDuration={800}
                connectNulls
              />
            )}
            {visibleSeries.balance && (
              <Area
                type='monotone'
                dataKey='balance'
                name='Balance'
                stroke='#3b82f6'
                strokeWidth={2}
                fill='url(#balanceGradient)'
                activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }}
                animationDuration={800}
                connectNulls
              />
            )}
          </RechartsAreaChart>
        );
      case 'line':
      default:
        return (
          <RechartsLineChart {...chartProps}>
            <CartesianGrid strokeDasharray='3 3' vertical={false} stroke='#f1f5f9' />
            <XAxis
              dataKey='date'
              tickLine={false}
              axisLine={false}
              style={axisStyle}
              tick={{ fontSize: '0.7rem' }}
              interval='preserveStartEnd'
              minTickGap={15}
            />
            <YAxis
              tickFormatter={(value) =>
                new Intl.NumberFormat('en-IN', {
                  notation: 'compact',
                  compactDisplay: 'short'
                }).format(value)
              }
              tickLine={false}
              axisLine={false}
              style={axisStyle}
              width={35}
              tick={{ fontSize: '0.7rem' }}
            />
            <Tooltip content={<EnhancedTooltip />} />
            <Legend content={<EnhancedLegend />} />
            {visibleSeries.income && (
              <Line
                type='monotone'
                dataKey='income'
                name='Income'
                stroke='#22c55e'
                strokeWidth={2}
                dot={{ r: 2, fill: '#22c55e', strokeWidth: 1, stroke: '#fff' }}
                activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }}
                animationDuration={800}
                connectNulls
              />
            )}
            {visibleSeries.expense && (
              <Line
                type='monotone'
                dataKey='expense'
                name='Expense'
                stroke='#ef4444'
                strokeWidth={2}
                dot={{ r: 2, fill: '#ef4444', strokeWidth: 1, stroke: '#fff' }}
                activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }}
                animationDuration={800}
                connectNulls
              />
            )}
            {visibleSeries.balance && (
              <Line
                type='monotone'
                dataKey='balance'
                name='Balance'
                stroke='#3b82f6'
                strokeWidth={2}
                dot={{ r: 2, fill: '#3b82f6', strokeWidth: 1, stroke: '#fff' }}
                activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }}
                animationDuration={800}
                connectNulls
              />
            )}
          </RechartsLineChart>
        );
    }
  };

  return (
    <div className={`relative h-full w-full ${className}`}>
      <MobileChartTypeSelector />
      <ResponsiveContainer width='100%' height='100%'>
        {renderChart()}
      </ResponsiveContainer>
      {processedData.length === 0 && (
        <div className='absolute inset-0 flex items-center justify-center'>
          <div className='text-center text-gray-500'>
            <div className='mb-2 text-4xl'>📊</div>
            <div className='text-lg font-medium'>No data available</div>
            <div className='text-sm'>No trend data available for the selected period.</div>
          </div>
        </div>
      )}
    </div>
  );
};
