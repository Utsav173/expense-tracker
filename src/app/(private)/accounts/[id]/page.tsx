'use client';

import { use, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useAccountDetails } from '@/components/account/hooks/useAccountDetails';
import { AccountDetailsHeader } from '@/components/account/account-details-header';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

// Dynamically import the heaviest components
const AccountTransactionsSection = dynamic(
  () => import('@/components/account/account-transactions-section'),
  {
    loading: () => <Skeleton className='h-96 w-full' />,
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

const AccountDetailsPage = ({ params, searchParams }: PageProps) => {
  const { id } = use(params);
  const parsedSearchParams = use(searchParams);
  const isMobile = useIsMobile();
  const { user } = useAuth();

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
    duration,
    handleAmountChange,
    handleTypeChange
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

  const hasTransactions = useMemo(() => {
    return transactionsData?.transactions && transactionsData.transactions.length > 0;
  }, [transactionsData]);

  const isOwner = useMemo(() => {
    return account?.owner?.id === user?.id;
  }, [account?.owner?.id, user?.id]);

  if (!id) {
    return (
      <Alert variant='destructive' className='m-4'>
        <AlertCircle className='h-4 w-4' />
        <AlertDescription>Account ID is required</AlertDescription>
      </Alert>
    );
  }

  if (accountError) {
    return (
      <Alert variant='destructive' className='m-4'>
        <AlertCircle className='h-4 w-4' />
        <AlertDescription>Failed to load account details: {accountError.message}</AlertDescription>
      </Alert>
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
      {/* Header Section */}
      <AccountDetailsHeader
        account={account!}
        isLoading={isAccountLoading}
        refetchData={refetchData}
        isMobile={isMobile}
        isOwner={isOwner}
      />

      {/* Analytics Cards + Chart Section */}
      {isOwner && (
        <div
          className={cn(
            'grid max-h-[70dvh] grid-cols-1 gap-6 overflow-auto select-none max-sm:h-auto',
            hasTransactions && 'lg:grid-cols-2 xl:grid-cols-[1fr_1.5fr]'
          )}
        >
          <AnalyticsCards
            analytics={customAnalytics ?? undefined}
            isLoading={isAnalyticsLoading ?? false}
            account={account ?? undefined}
          />

          {hasTransactions && (
            <Card className='h-full shrink-0 overflow-hidden rounded-lg shadow-lg'>
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

      {/* Transactions Section */}
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
        isOwner={isOwner}
        handleAmountChange={handleAmountChange}
        handleTypeChange={handleTypeChange}
      />
    </div>
  );
};

export default AccountDetailsPage;
