import React, { useState } from 'react';
import { FinancialTrendsChart } from './financial-trends-chart';
import { SpendingBreakdown } from '@/components/dashboard/spending-breakdown';
import { cn } from '@/lib/utils';

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
      <div className='flex flex-wrap items-center justify-center gap-2 border-b px-4 py-2 sm:justify-start'>
        <button
          className={cn(
            'flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors sm:flex-initial',
            activeTab === 'trends'
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:bg-muted/50'
          )}
          onClick={() => setActiveTab('trends')}
        >
          Financial Trends
        </button>
        <button
          className={cn(
            'flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors sm:flex-initial',
            activeTab === 'analysis'
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:bg-muted/50'
          )}
          onClick={() => setActiveTab('analysis')}
        >
          Spending Analysis
        </button>
      </div>

      <div className='flex-1 p-2 sm:p-4'>
        {activeTab === 'trends' && (
          <FinancialTrendsChart data={chartData} isLoading={isChartLoading} currency={currency} />
        )}
        {activeTab === 'analysis' && (
          <SpendingBreakdown
            accountId={accountId}
            showDurationSelector={false}
            defaultDuration={duration}
            chartTypes={['column', 'pie']}
          />
        )}
      </div>
    </div>
  );
};
