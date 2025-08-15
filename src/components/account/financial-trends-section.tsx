import React, { useState } from 'react';
import { FinancialTrendsChart } from './financial-trends-chart';
import { SpendingBreakdown } from '@/components/dashboard/spending-breakdown';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent, CardHeader } from '../ui/card';

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
    <Card className='h-full w-full overflow-hidden border-none'>
      <Tabs value={activeTab} onValueChange={setActiveTab} className='flex h-full flex-col'>
        <CardHeader className='p-4'>
          <TabsList className='grid w-full grid-cols-2 sm:w-auto'>
            <TabsTrigger value='trends'>Financial Trends</TabsTrigger>
            <TabsTrigger value='analysis'>Spending Analysis</TabsTrigger>
          </TabsList>
        </CardHeader>
        <CardContent className='flex-1 p-2 !pt-0 sm:p-4'>
          <TabsContent value='trends' className='h-full'>
            <FinancialTrendsChart data={chartData} isLoading={isChartLoading} currency={currency} />
          </TabsContent>
          <TabsContent value='analysis' className='h-full'>
            <SpendingBreakdown
              accountId={accountId}
              showDurationSelector={false}
              defaultDuration={duration}
              chartTypes={['column', 'pie', 'donut']}
            />
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
};
