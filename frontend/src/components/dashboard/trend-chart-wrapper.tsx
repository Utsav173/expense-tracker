'use client';

import React from 'react';
import { DashboardData } from '@/lib/types';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, LineChart, AreaChart } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import NoData from '../ui/no-data';
import { TrendChart } from './trend-chart';

interface TrendChartWrapperProps {
  data: DashboardData | null | undefined;
  chartType: 'line' | 'bar' | 'area';
  isLoading: boolean;
  expanded: boolean;
  setChartType: (type: 'line' | 'bar' | 'area') => void;
  className?: string;
}

const TrendChartWrapper: React.FC<TrendChartWrapperProps> = ({
  data,
  chartType,
  isLoading,
  expanded,
  setChartType,
  className
}) => {
  const handleTabChange = (value: string) => {
    setChartType(value as 'line' | 'bar' | 'area');
  };

  const incomeChartData = data?.incomeChartData ?? [];
  const expenseChartData = data?.expenseChartData ?? [];
  const balanceChartData = data?.balanceChartData ?? [];
  const currency = data?.accountsInfo?.[0]?.currency ?? 'INR';

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
        currency={currency}
        className='h-full w-full p-2 pt-4'
      />
    );
  };

  return (
    <div className='relative h-full'>
      <div className='absolute right-4 top-4 z-10 hidden md:right-20 md:top-[-42px] md:block'>
        <Tabs defaultValue={chartType} onValueChange={handleTabChange} className=''>
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
      </div>
      <div className={expanded ? 'h-[600px]' : 'h-[350px] md:h-[400px]'}>{renderContent()}</div>
    </div>
  );
};

export default TrendChartWrapper;
