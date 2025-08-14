'use client';

import React, { useMemo, Suspense, use } from 'react';
import dynamic from 'next/dynamic';
import { useAccountDetailsData } from '@/components/account/hooks/useAccountDetailsData';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/components/providers/auth-provider';
import QueryErrorDisplay from '@/components/ui/query-error-display';

const AccountTransactionsSection = dynamic(
  () => import('@/components/account/account-transactions-section'),
  {
    loading: () => <Skeleton className='h-96 w-full' />,
    ssr: false
  }
);

const AccountDetailsHeader = dynamic(
  () =>
    import('@/components/account/account-details-header').then((mod) => mod.AccountDetailsHeader),
  {
    loading: () => <Skeleton className='h-24 w-full' />,
    ssr: false
  }
);

const AnalyticsCards = dynamic(
  () => import('@/components/account/analytics-cards').then((mod) => mod.AnalyticsCards),
  {
    loading: () => <Skeleton className='h-48 w-full' />,
    ssr: false
  }
);

const FinancialTrendsSection = dynamic(
  () =>
    import('@/components/account/financial-trends-section').then(
      (mod) => mod.FinancialTrendsSection
    ),
  {
    loading: () => <Skeleton className='h-48 w-full' />,
    ssr: false
  }
);

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
    minAmount?: string;
    maxAmount?: string;
    type?: string;
  }>;
}

const AccountDetailsPageContent = ({ params, searchParams }: PageProps) => {
  const { id } = use(params);
  const parsedSearchParams = use(searchParams);
  const isMobile = useIsMobile();
  const { session } = useAuth();
  const user = session?.user;

  const {
    account,
    isAccountLoading,
    accountError,
    customAnalytics,
    isAnalyticsLoading,
    chartData,
    isChartLoading,
    transactionsData,
    isTransactionLoading,
    refetchData,
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
    duration,
    handleAmountChange,
    handleTypeChange
  } = useAccountDetailsData(id, parsedSearchParams);

  const transformedChartData = useMemo(() => {
    if (!chartData?.date) return [];

    return chartData.date.map((date: string, i: number) => ({
      date,
      income: chartData.income?.[i],
      expense: chartData.expense?.[i],
      balance: chartData.balance?.[i]
    }));
  }, [chartData]);

  const hasTransactions = useMemo(() => {
    return transactionsData?.transactions && transactionsData.transactions.length > 0;
  }, [transactionsData]);

  const isOwner = useMemo(() => {
    return account?.owner?.id === user?.id;
  }, [account?.owner?.id, user?.id]);

  if (!id) {
    return (
      <QueryErrorDisplay
        error={new Error('Account ID is required')}
        message='Failed to load account details. Please check your connection and try refreshing.'
      />
    );
  }

  if (accountError) {
    return (
      <QueryErrorDisplay
        error={accountError}
        message='Failed to load account details. Please check your connection and try refreshing.'
      />
    );
  }

  if (isAccountLoading) {
    return (
      <div className='mx-auto h-full w-full space-y-6 p-4 md:p-6'>
        <Skeleton className='h-24 w-full' />
        <div className='grid gap-6 lg:grid-cols-[1fr_1.5fr]'>
          <Skeleton className='h-48 w-full' />
          <Skeleton className='h-48 w-full' />
        </div>
        <Skeleton className='h-96 w-full' />
      </div>
    );
  }

  return (
    <div className='mx-auto h-full w-full space-y-6 p-4 md:p-6'>
      <AccountDetailsHeader
        account={account!}
        isLoading={isAccountLoading}
        refetchData={refetchData}
        isMobile={isMobile}
        isOwner={isOwner}
      />

      {isOwner && (
        <div
          className={cn(
            'grid grid-cols-1 gap-6 select-none',
            hasTransactions && 'lg:grid-cols-2 xl:grid-cols-[1fr_1.5fr]'
          )}
        >
          <AnalyticsCards
            analytics={customAnalytics ?? undefined}
            isLoading={isAnalyticsLoading ?? false}
            account={account ?? undefined}
          />

          {hasTransactions && (
            <Card className='overflow-hidden rounded-lg shadow-lg'>
              <FinancialTrendsSection
                chartData={transformedChartData}
                isChartLoading={isChartLoading}
                currency={account?.currency ?? 'INR'}
                accountId={id}
                duration={duration}
              />
            </Card>
          )}
        </div>
      )}

      <AccountTransactionsSection
        transactionsData={transactionsData}
        isTransactionLoading={isTransactionLoading}
        filters={filters}
        handleSort={handleSort}
        page={page}
        handlePageChange={handlePageChange}
        categories={categories}
        setSearchQuery={setSearchQuery}
        handleCategoryChange={handleCategoryChange}
        handleIncomeTypeChange={handleIncomeTypeChange}
        handleDateRangeSelect={handleDateRangeSelect}
        handleClearDateRange={handleClearDateRange}
        handleResetFilters={handleResetFilters}
        refetchData={refetchData}
        isOwner={isOwner}
        handleAmountChange={handleAmountChange}
        handleTypeChange={handleTypeChange}
      />
    </div>
  );
};

const AccountDetailsPage = ({ params, searchParams }: PageProps) => {
  return (
    <Suspense fallback={<Skeleton className='h-screen w-full' />}>
      <AccountDetailsPageContent params={params} searchParams={searchParams} />
    </Suspense>
  );
};

export default AccountDetailsPage;
