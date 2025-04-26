'use client';

import React from 'react';
import { DashboardData } from '@/lib/types';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, LineChart, AreaChart } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import NoData from '../ui/no-data';
import { TrendChart } from './trend-chart';
import { useDateRangeFilter } from '@/hooks/useDateRangeFilter';
import { cn } from '@/lib/utils';

interface TrendChartWrapperProps {
  data: DashboardData | null | undefined;
  chartType: 'line' | 'bar' | 'area';
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
  const { dateRange, DateRangeFilter } = useDateRangeFilter({
    className: 'w-fit',
    maxDate: new Date(),
    urlPersistence: false,
    defaultRange: {
      from: new Date(new Date().setDate(new Date().getDate() - 30)),
      to: new Date()
    }
  });

  const handleChartTypeChange = (value: string) => {
    setChartType(value as 'line' | 'bar' | 'area');
  };
  const incomeChartData = data?.incomeChartData ?? [];
  const expenseChartData = data?.expenseChartData ?? [];
  const balanceChartData = data?.balanceChartData ?? [];

  const renderContent = () => {
    if (isLoading) {
      return <Skeleton className='h-full min-h-[400px] w-full' />;
    }
    const hasData =
      incomeChartData.length > 0 || expenseChartData.length > 0 || balanceChartData.length > 0;

    if (!hasData) {
      return (
        <NoData
          message='No trend data available for the selected period.'
          icon='inbox'
          className='min-h-[400px]'
        />
      );
    }

    return (
      <div className='h-full min-h-[400px] w-full'>
        <TrendChart
          incomeData={incomeChartData}
          expenseData={expenseChartData}
          balanceData={balanceChartData}
          chartType={chartType}
          currency={data?.accountsInfo?.[0]?.currency ?? 'INR'}
          className='h-full w-full'
          setChartType={setChartType}
          timeRangeOption={dateRange ? 'custom' : 'thisMonth'}
          customDateRange={dateRange}
        />
      </div>
    );
  };

  return (
    <div className={cn('flex h-full w-full flex-col', className)}>
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
