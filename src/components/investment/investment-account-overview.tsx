'use client';

import React, { useMemo } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useInvestmentAccountDetails } from '@/components/investment/context/investment-account-details-context';
import { KpiCard, KpiCardProps } from '@/components/investment/KpiCard';
import { PerformanceChart } from '@/components/investment/PerformanceChart';
import { InvestmentSummaryCard } from '@/components/investment/InvestmentSummaryCard';

interface InvestmentAccountOverviewProps {
  accountCurrency: string;
  oldestInvestmentDate: Date | undefined;
}

const InvestmentAccountOverview: React.FC<InvestmentAccountOverviewProps> = ({
  accountCurrency,
  oldestInvestmentDate
}) => {
  const isMobile = useIsMobile();
  const {
    summary,
    performanceData,
    performanceMetrics,
    isSummaryLoading,
    isPerformanceLoading,
    selectedTimeRange,
    setSelectedTimeRange,
    customDateRange,
    setCustomDateRange
  } = useInvestmentAccountDetails();

  const kpiCards: KpiCardProps[] = useMemo(() => {
    return [
      {
        title: 'Portfolio Value',
        description: 'Current total value',
        icon: 'indianRupee',
        value: performanceMetrics?.totalValue,
        changePercent: performanceMetrics?.totalReturn,
        colorClass: 'text-primary',
        currency: accountCurrency,
        isLoading: isSummaryLoading
      },
      {
        title: 'Total Invested',
        description: 'Amount contributed',
        icon: 'piggyBank',
        value: performanceMetrics?.totalInvestment,
        colorClass: 'text-blue-600 dark:text-blue-400',
        currency: accountCurrency,
        isLoading: isSummaryLoading
      },
      {
        title: 'Total Dividends',
        description: 'Income received',
        icon: 'indianRupee',
        value: performanceMetrics?.totaldividend,
        valuePrefix: '+',
        colorClass: 'text-green-600 dark:text-green-400',
        currency: accountCurrency,
        isLoading: isSummaryLoading
      }
    ];
  }, [performanceMetrics, accountCurrency, isSummaryLoading]);

  return (
    <div className='space-y-6'>
      {summary !== undefined ? (
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {kpiCards.map((card) => (
            <KpiCard key={card.title} {...card} />
          ))}
        </div>
      ) : null}

      {!isSummaryLoading && performanceMetrics && (
        <InvestmentSummaryCard metrics={performanceMetrics} currency={accountCurrency} />
      )}

      <PerformanceChart
        performanceData={performanceData}
        isLoading={isPerformanceLoading}
        currency={accountCurrency}
        totalInvested={summary?.totalInvestment || 0}
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
