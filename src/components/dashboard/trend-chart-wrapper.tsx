'use client';

import { useMemo, useCallback } from 'react';
import { DashboardData } from '@/lib/types';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, LineChart, AreaChart } from 'lucide-react';
import Loader from '../ui/loader';
import NoData from '../ui/no-data';
import { TrendChart } from './trend-chart';
import { useDateRangeFilter } from '@/components/dashboard/hooks/useDateRangeFilter';
import { cn } from '@/lib/utils';
import { startOfDay, subDays } from 'date-fns';

interface TrendChartWrapperProps {
  data: DashboardData | null | undefined;
  chartType: 'line' | 'bar' | 'area';
  isLoading: boolean;
  setChartType: (type: 'line' | 'bar' | 'area') => void;
  className?: string;
}

const CHART_TYPE_CONFIGS = {
  line: { icon: LineChart, label: 'Line' },
  bar: { icon: BarChart, label: 'Bar' },
  area: { icon: AreaChart, label: 'Area' }
} as const;

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
      from: subDays(startOfDay(new Date()), 30),
      to: startOfDay(new Date())
    }
  });

  const handleChartTypeChange = useCallback(
    (value: string) => {
      setChartType(value as 'line' | 'bar' | 'area');
    },
    [setChartType]
  );

  // Memoize chart data transformation with early returns for performance
  const { chartData, hasData } = useMemo(() => {
    if (!data) return { chartData: [], hasData: false };

    const incomeData = data.incomeChartData || [];
    const expenseData = data.expenseChartData || [];
    const balanceData = data.balanceChartData || [];

    // Early return if no data
    if (!incomeData.length && !expenseData.length && !balanceData.length) {
      return { chartData: [], hasData: false };
    }

    // Use Map for O(1) lookups
    const incomeMap = new Map(incomeData.map((p) => [p.x, p.y ?? null]));
    const expenseMap = new Map(expenseData.map((p) => [p.x, p.y ?? null]));
    const balanceMap = new Map(balanceData.map((p) => [p.x, p.y ?? null]));

    // Get all unique timestamps and sort once
    const allTimestamps = new Set([
      ...incomeData.map((p) => p.x),
      ...expenseData.map((p) => p.x),
      ...balanceData.map((p) => p.x)
    ]);

    const sortedTimestamps = Array.from(allTimestamps).sort((a, b) => a - b);

    const processedData = sortedTimestamps.map((ts) => ({
      date: new Date(ts * 1000).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      }),
      timestamp: ts,
      income: incomeMap.get(ts) ?? null,
      expense: expenseMap.get(ts) ?? null,
      balance: balanceMap.get(ts) ?? null
    }));

    return {
      chartData: processedData,
      hasData: processedData.length > 0
    };
  }, [data]);

  const currency = useMemo(() => data?.accountsInfo?.[0]?.currency ?? 'INR', [data?.accountsInfo]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className='flex h-full min-h-[350px] items-center justify-center'>
          <Loader className='h-8 w-8' />
        </div>
      );
    }

    if (!hasData) {
      return (
        <div className='flex h-full min-h-[350px] items-center justify-center'>
          <NoData message='No trend data available for the selected period.' icon='inbox' />
        </div>
      );
    }

    return (
      <div className='h-full w-full'>
        <TrendChart
          incomeData={data?.incomeChartData ?? []}
          expenseData={data?.expenseChartData ?? []}
          balanceData={data?.balanceChartData ?? []}
          chartType={chartType}
          currency={currency}
          className='h-full w-full'
          timeRangeOption={dateRange ? 'custom' : 'thisMonth'}
          customDateRange={dateRange}
          isLoading={isLoading}
        />
      </div>
    );
  };

  return (
    <div className={cn('flex h-full w-full flex-col overflow-hidden', className)}>
      {/* Responsive header with controls */}
      <div className='bg-card flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4'>
        <div className='flex-1'>
          <DateRangeFilter />
        </div>

        {!!setChartType && (
          <div className='flex justify-center sm:justify-end'>
            <Tabs value={chartType} onValueChange={handleChartTypeChange} className='w-fit'>
              <TabsList className='bg-muted/50 grid h-9 w-full grid-cols-3'>
                {Object.entries(CHART_TYPE_CONFIGS).map(([type, config]) => {
                  const Icon = config.icon;
                  return (
                    <TabsTrigger
                      key={type}
                      value={type}
                      className='hover:bg-background/80 flex items-center gap-1.5 px-3 py-1.5 text-xs transition-all'
                      aria-label={`${config.label} chart`}
                    >
                      <Icon className='h-3.5 w-3.5' />
                      <span className='hidden sm:inline'>{config.label}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </Tabs>
          </div>
        )}
      </div>

      {/* Chart container with responsive height */}
      <div className='flex-1 p-4'>
        <div className='h-full min-h-[350px] w-full'>{renderContent()}</div>
      </div>
    </div>
  );
};

export default TrendChartWrapper;
