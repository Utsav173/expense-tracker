'use client';

import React, { useMemo } from 'react';
import { DashboardData } from '@/lib/types';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, LineChart, AreaChart } from 'lucide-react'; // Keep AreaChart icon if UI allows selection
import { Skeleton } from '../ui/skeleton';
import NoData from '../ui/no-data';
import { TrendChart } from './trend-chart'; // Use the refactored component
import { useDateRangeFilter } from '@/hooks/useDateRangeFilter';
import { cn } from '@/lib/utils';
import { startOfDay, subDays } from 'date-fns';

interface TrendChartWrapperProps {
  data: DashboardData | null | undefined;
  chartType: 'line' | 'bar' | 'area'; // Keep area type if UI supports it
  isLoading: boolean;
  setChartType: (type: 'line' | 'bar' | 'area') => void;
  className?: string;
}

const TrendChartWrapper = ({
  data,
  chartType = 'line',
  isLoading,
  setChartType,
  className
}: TrendChartWrapperProps) => {
  // Date range logic remains in the wrapper
  const { dateRange, DateRangeFilter } = useDateRangeFilter({
    className: 'w-fit',
    maxDate: new Date(),
    urlPersistence: false, // Keep URL persistence off for dashboard controls
    defaultRange: {
      from: subDays(startOfDay(new Date()), 30), // Default to last 30 days from today
      to: startOfDay(new Date())
    }
  });

  const handleChartTypeChange = (value: string) => {
    setChartType(value as 'line' | 'bar' | 'area');
  };

  // Data transformation logic remains the same
  const transformedChartData = useMemo(() => {
    const incomeMap = new Map(data?.incomeChartData?.map((p) => [p.x, p.y ?? null]) ?? []);
    const expenseMap = new Map(data?.expenseChartData?.map((p) => [p.x, p.y ?? null]) ?? []);
    const balanceMap = new Map(data?.balanceChartData?.map((p) => [p.x, p.y ?? null]) ?? []);

    const allTimestamps = new Set([
      ...(data?.incomeChartData?.map((p) => p.x) ?? []),
      ...(data?.expenseChartData?.map((p) => p.x) ?? []),
      ...(data?.balanceChartData?.map((p) => p.x) ?? [])
    ]);

    const sortedTimestamps = Array.from(allTimestamps).sort((a, b) => a - b);

    return sortedTimestamps.map((ts) => ({
      date: new Date(ts * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      income: incomeMap.get(ts) ?? null,
      expense: expenseMap.get(ts) ?? null,
      balance: balanceMap.get(ts) ?? null
    }));
  }, [data]);

  const renderContent = () => {
    if (isLoading) {
      return <Skeleton className='h-full min-h-[400px] w-full' />;
    }
    const hasData = transformedChartData.length > 0;

    if (!hasData) {
      return (
        <NoData
          message='No trend data available for the selected period.'
          icon='inbox'
          className='min-h-[400px]'
        />
      );
    }

    // Pass necessary props to the refactored TrendChart
    return (
      <div className='h-full min-h-[400px] w-full'>
        <TrendChart
          incomeData={data?.incomeChartData ?? []} // Pass original data structure if TrendChart expects it
          expenseData={data?.expenseChartData ?? []}
          balanceData={data?.balanceChartData ?? []}
          chartType={chartType} // Pass the selected chart type
          currency={data?.accountsInfo?.[0]?.currency ?? 'INR'}
          className='h-full w-full'
          timeRangeOption={dateRange ? 'custom' : 'thisMonth'} // Pass time range info
          customDateRange={dateRange} // Pass custom date range
          isLoading={isLoading} // Pass loading state
        />
      </div>
    );
  };

  return (
    <div className={cn('flex h-full w-full flex-col', className)}>
      {/* Controls remain in the wrapper */}
      <div className='flex flex-wrap items-center justify-between gap-4 px-6 py-2'>
        <DateRangeFilter />
        {!!setChartType && (
          <Tabs defaultValue={chartType} onValueChange={handleChartTypeChange}>
            <TabsList className='h-7'>
              <TabsTrigger value='line' className='px-2 py-1 text-xs'>
                <LineChart className='h-3 w-3' />
              </TabsTrigger>
              <TabsTrigger value='bar' className='px-2 py-1 text-xs'>
                <BarChart className='h-3 w-3' />
              </TabsTrigger>
              <TabsTrigger value='area' className='px-2 py-1 text-xs'>
                <AreaChart className='h-3 w-3' />
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}
      </div>
      <div className='min-h-[400px] flex-1 px-4 pb-4'>{renderContent()}</div>
    </div>
  );
};

export default TrendChartWrapper;
