import React, { useState } from 'react';
import { FinancialTrendsChart } from './financial-trends-chart';
import { SpendingBreakdown } from '@/components/dashboard/spending-breakdown';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

interface FinancialTrendsSectionProps {
  chartData: Array<{
    date: string;
    income: number | null;
    expense: number | null;
    balance: number | null;
  }>;
  isChartLoading: boolean;
  currency: string;
  accountId: string;
  duration: string;
}

export const FinancialTrendsSection: React.FC<FinancialTrendsSectionProps> = ({
  chartData,
  isChartLoading,
  currency,
  accountId,
  duration
}) => {
  const [activeTab, setActiveTab] = useState('trends');

  return (
    <div className='flex h-full flex-col'>
      <Tabs value={activeTab} onValueChange={setActiveTab} className='flex h-full flex-col'>
        <div className='flex w-full flex-wrap items-center justify-between gap-2 border-b px-4 py-2 sm:justify-start'>
          <TabsList className='grid w-full grid-cols-2 sm:w-auto'>
            <TabsTrigger value='trends'>Financial Trends</TabsTrigger>
            <TabsTrigger value='analysis'>Spending Analysis</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value='trends' className='flex-1 p-2 sm:p-4'>
          <FinancialTrendsChart data={chartData} isLoading={isChartLoading} currency={currency} />
        </TabsContent>
        <TabsContent value='analysis' className='flex-1 p-2 sm:p-4'>
          <SpendingBreakdown
            accountId={accountId}
            showDurationSelector={false}
            defaultDuration={duration}
            chartTypes={['column', 'pie']}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
