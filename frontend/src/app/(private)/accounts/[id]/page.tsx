'use client';

import { use, useMemo } from 'react';
import { useToast } from '@/lib/hooks/useToast';
import { useAccountDetails } from '@/components/account/hooks/useAccountDetails';
import { AccountDetailsHeader } from '@/components/account/account-details-header';
import { AccountTransactionsSection } from '@/components/account/account-transactions-section';
import { useIsMobile } from '@/hooks/use-mobile';
import { AnalyticsCards } from '@/components/account/analytics-cards';
import { FinancialTrendsSection } from '@/components/account/financial-trends-section';
import { Card } from '@/components/ui/card';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    q?: string;
    page?: string;
    sortBy?: string;
    sortOrder?: string;
    categoryId?: string;
    isIncome?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
}

const AccountDetailsPage = ({ params, searchParams }: PageProps) => {
  const { id } = use(params);
  const parsedSearchParams = use(searchParams);
  const { showError } = useToast();
  const isMobile = useIsMobile();

  const {
    account,
    isAccountLoading,
    accountError,
    customAnalytics,
    isAnalyticsLoading,
    analyticsError,
    chartData,
    isChartLoading,
    chartError,
    transactionsData,
    isTransactionLoading,
    transactionError,
    filters,
    setSearchQuery,
    handleCategoryChange,
    handleIncomeTypeChange,
    handleDateRangeSelect,
    handleClearDateRange,
    handleSort,
    page,
    handlePageChange,
    categories,
    handleResetFilters,
    refetchData,
    duration
  } = useAccountDetails(id, parsedSearchParams);

  const transformedChartData = useMemo(() => {
    if (!chartData?.date) return [];

    return chartData.date.map((date: string, i: number) => ({
      date,
      income: chartData.income?.[i],
      expense: chartData.expense?.[i],
      balance: chartData.balance?.[i]
    }));
  }, [chartData]);

  if (!id) {
    showError('Account ID is required');
    return <div className='p-4'>Invalid account ID</div>;
  }

  if (accountError) {
    showError(`Failed to load account details: ${accountError.message}`);
    return <div className='p-4'>Error loading account details.</div>;
  }

  return (
    <div className='mx-auto h-full w-full space-y-6 p-4 md:p-6'>
      {/* Header Section */}
      <AccountDetailsHeader
        account={account!}
        isLoading={isAccountLoading}
        refetchData={refetchData}
        isMobile={isMobile}
      />

      {/* Analytics Cards + Chart Section */}
      <div className='grid gap-6 lg:grid-cols-[1fr_1.5fr]'>
        {/* Analytics Cards */}
        <AnalyticsCards
          analytics={customAnalytics}
          isLoading={isAnalyticsLoading}
          account={account}
        />

        {/* Chart Section */}
        <Card className='overflow-hidden'>
          <FinancialTrendsSection
            chartData={transformedChartData}
            isChartLoading={isChartLoading}
            currency={account?.currency ?? 'INR'}
            accountId={id}
            duration={duration}
          />
        </Card>
      </div>

      {/* Transactions Section */}
      <Card className='overflow-hidden pb-3'>
        <AccountTransactionsSection
          transactionsData={transactionsData ?? undefined}
          isTransactionLoading={isTransactionLoading}
          filters={filters}
          handleSort={handleSort}
          page={page}
          handlePageChange={handlePageChange}
          categories={categories ?? undefined}
          setSearchQuery={setSearchQuery}
          handleCategoryChange={handleCategoryChange}
          handleIncomeTypeChange={handleIncomeTypeChange}
          handleDateRangeSelect={handleDateRangeSelect}
          handleClearDateRange={handleClearDateRange}
          handleResetFilters={handleResetFilters}
          refetchData={refetchData}
        />
      </Card>
    </div>
  );
};

export default AccountDetailsPage;
