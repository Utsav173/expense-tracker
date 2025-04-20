'use client';

import React from 'react';
import { DashboardData } from '@/lib/types';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, LineChart, AreaChart } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import NoData from '../ui/no-data';
import { TrendChart } from './trend-chart';
import { DateRange } from 'react-day-picker';

interface TrendChartWrapperProps {
  data: DashboardData | null | undefined;
  chartType: 'line' | 'bar' | 'area';
  isLoading: boolean;
  setChartType: (type: 'line' | 'bar' | 'area') => void;
  className?: string;
  timeRangeOption: string;
  customDateRange?: DateRange;
}

const TrendChartWrapper = ({
  data,
  chartType = 'line',
  isLoading,
  setChartType,
  className,
  timeRangeOption,
  customDateRange
}: TrendChartWrapperProps) => {
  const handleChartTypeChange = (value: string) => {
    setChartType(value as 'line' | 'bar' | 'area');
  };
  const incomeChartData = data?.incomeChartData ?? [];
  const expenseChartData = data?.expenseChartData ?? [];
  const balanceChartData = data?.balanceChartData ?? [];

  const renderContent = () => {
    if (isLoading) {
      return <Skeleton className='h-full w-full' />;
    }
    const hasData =
      incomeChartData.length > 0 || expenseChartData.length > 0 || balanceChartData.length > 0;

    if (!hasData) {
      return <NoData message='No trend data available for the selected period.' icon='inbox' />;
    }

    return (
      <TrendChart
        incomeData={incomeChartData}
        expenseData={expenseChartData}
        balanceData={balanceChartData}
        chartType={chartType}
        currency={data?.accountsInfo?.[0]?.currency ?? 'INR'}
        className='h-full w-full p-2 pt-4'
        setChartType={setChartType}
        timeRangeOption={timeRangeOption}
        customDateRange={customDateRange}
      />
    );
  };

  return (
    <div className='relative h-full'>
      <div className='absolute right-4 top-4 z-10 hidden md:right-20 md:top-[-42px] md:block'>
        {!!setChartType && (
          <Tabs defaultValue={chartType} onValueChange={handleChartTypeChange} className=''>
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
      <div className={'h-[350px] md:h-[400px]'}>{renderContent()}</div>
    </div>
  );
};

export default TrendChartWrapper;
