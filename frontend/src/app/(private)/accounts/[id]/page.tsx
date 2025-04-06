'use client';

import { use, useMemo } from 'react';
import { AnalyticsCards, IncomeExpenseChart } from '@/components/account';
import { useToast } from '@/lib/hooks/useToast';
import { useAccountDetails } from '@/components/account/hooks/useAccountDetails';
import { AccountDetailsHeader } from '@/components/account/account-details-header';
import { AccountTransactionsSection } from '@/components/account/account-transactions-section';

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
    refetchData
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
  if (analyticsError) {
    showError(`Failed to load analytics: ${analyticsError.message}`);
  }
  if (chartError) {
    showError(`Failed to load chart data: ${chartError.message}`);
  }
  if (transactionError) {
    showError(`Failed to load transactions: ${transactionError.message}`);
  }

  return (
    <div className='mx-auto w-full min-w-0 max-w-7xl space-y-6 p-4 max-sm:p-0 md:p-6 lg:p-8'>
      <AccountDetailsHeader
        account={account}
        isLoading={isAccountLoading}
        refetchData={refetchData}
      />

      <AnalyticsCards
        analytics={customAnalytics}
        isLoading={isAnalyticsLoading}
        account={account}
      />

      {chartData?.date && (
        <section className='rounded-xl bg-white shadow-sm'>
          <IncomeExpenseChart
            data={transformedChartData}
            isLoading={isChartLoading}
            currency={account?.currency ?? 'INR'}
          />
        </section>
      )}

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
    </div>
  );
};

export default AccountDetailsPage;
