'use client';

import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useInvestmentAccountData } from '@/components/investment/hook/use-investment-account-data';
import { KpiCard, KpiCardProps } from '@/components/investment/KpiCard';
import { PerformanceChart } from '@/components/investment/PerformanceChart';
import { InvestmentSummaryCard } from '@/components/investment/InvestmentSummaryCard';

interface InvestmentAccountOverviewProps {
  accountId: string;
  accountCurrency: string;
  oldestInvestmentDate: Date | undefined;
}

const InvestmentAccountOverview: React.FC<InvestmentAccountOverviewProps> = ({
  accountId,
  accountCurrency,
  oldestInvestmentDate
}) => {
  const isMobile = useIsMobile();
  const {
    summary,
    performanceData,
    performanceMetrics,
    isLoadingSummary,
    isLoadingChart,
    selectedTimeRange,
    setSelectedTimeRange,
    customDateRange,
    setCustomDateRange
  } = useInvestmentAccountData({ accountId, oldestInvestmentDate });

  const kpiCards: Pick<
    KpiCardProps,
    'title' | 'description' | 'icon' | 'value' | 'changePercent' | 'colorClass' | 'valuePrefix'
  >[] = [
    {
      title: 'Portfolio Value',
      description: 'Current total value',
      icon: 'indianRupee',
      value: summary?.totalvalue,
      changePercent: performanceMetrics?.totalReturn,
      colorClass: 'text-primary'
    },
    {
      title: 'Total Invested',
      description: 'Amount contributed',
      icon: 'piggyBank',
      value: summary?.totalinvestment,
      colorClass: 'text-blue-600 dark:text-blue-400'
    },
    {
      title: 'Total Dividends',
      description: 'Income received',
      icon: 'indianRupee',
      value: summary?.totaldividend,
      valuePrefix: '+',
      colorClass: 'text-green-600 dark:text-green-400'
    }
  ];

  return (
    <div className='space-y-6'>
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        {kpiCards.map((card) => (
          <KpiCard
            key={card.title}
            isLoading={isLoadingSummary}
            currency={accountCurrency}
            {...card}
          />
        ))}
      </div>

      {!isLoadingSummary && performanceMetrics && (
        <InvestmentSummaryCard metrics={performanceMetrics} currency={accountCurrency} />
      )}

      <PerformanceChart
        performanceData={performanceData}
        isLoading={isLoadingChart}
        currency={accountCurrency}
        totalInvested={summary?.totalinvestment || 0}
        selectedTimeRange={selectedTimeRange}
        setSelectedTimeRange={setSelectedTimeRange}
        customDateRange={customDateRange}
        setCustomDateRange={setCustomDateRange}
        oldestInvestmentDate={oldestInvestmentDate}
        isMobile={isMobile}
      />
    </div>
  );
};

export default InvestmentAccountOverview;
