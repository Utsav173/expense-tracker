'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import NoData from '@/components/ui/no-data';
import { DASHBOARD_CARD_CONFIG } from '@/config/dashboard-config';
import { DashboardControls } from '@/components/dashboard/dashboard-controls';
import { useDashboardData } from '@/components/dashboard/hooks/useDashboardData';

import Loader from '@/components/ui/loader';
import { BentoGrid, BentoGridItem } from '@/components/ui/bento-grid';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import QueryErrorDisplay from '@/components/ui/query-error-display';
import { Icon } from '@/components/ui/icon';

// Dynamically import heavy components
const FinancialSnapshot = dynamic(
  () => import('@/components/dashboard/financial-snapshot').then((mod) => mod.FinancialSnapshot),
  { ssr: false, loading: () => <Skeleton className='h-full min-h-[200px]' /> }
);
const TrendChartWrapper = dynamic(() => import('@/components/dashboard/trend-chart-wrapper'), {
  ssr: false,
  loading: () => <Skeleton className='h-full min-h-[400px]' />
});
const BudgetProgress = dynamic(
  () => import('@/components/dashboard/budget-progress').then((mod) => mod.BudgetProgress),
  { ssr: false, loading: () => <Skeleton className='h-full min-h-[300px]' /> }
);
const GoalHighlights = dynamic(
  () => import('@/components/dashboard/goal-highlights').then((mod) => mod.GoalHighlights),
  { ssr: false, loading: () => <Skeleton className='h-full min-h-[300px]' /> }
);
const InvestmentSummaryCard = dynamic(
  () =>
    import('@/components/dashboard/investment-summary-card').then(
      (mod) => mod.InvestmentSummaryCard
    ),
  { ssr: false, loading: () => <Skeleton className='h-full min-h-[400px]' /> }
);
const DebtSummaryCard = dynamic(
  () => import('@/components/dashboard/debt-summary-card').then((mod) => mod.DebtSummaryCard),
  { ssr: false, loading: () => <Skeleton className='h-full min-h-[300px]' /> }
);
const AccountListSummary = dynamic(
  () => import('@/components/dashboard/account-list-summary').then((mod) => mod.AccountListSummary),
  { ssr: false, loading: () => <Skeleton className='h-full min-h-[200px]' /> }
);
const QuickStats = dynamic(
  () => import('@/components/dashboard/quick-stats').then((mod) => mod.QuickStats),
  { ssr: false, loading: () => <Skeleton className='h-full min-h-[200px]' /> }
);
const SpendingBreakdown = dynamic(
  () => import('@/components/dashboard/spending-breakdown').then((mod) => mod.SpendingBreakdown),
  { ssr: false, loading: () => <Skeleton className='h-full min-h-[400px]' /> }
);
const FinancialHealth = dynamic(() => import('@/components/dashboard/financial-health'), {
  ssr: false,
  loading: () => <Skeleton className='h-full min-h-[150px]' />
});

const renderSkeleton = () => (
  <div className='mx-auto flex min-h-screen w-full max-w-7xl flex-col items-center justify-center space-y-4 p-3 pt-4 md:space-y-6'>
    <Loader />
  </div>
);

const DashboardPage = () => {
  const [chartType, setChartType] = useState<'line' | 'bar' | 'area'>('line');

  const { data: dashboardPageData, isLoading, isFetching, isError, error } = useDashboardData();

  if (isFetching) {
    return renderSkeleton();
  }

  if (isError && !dashboardPageData) {
    return <QueryErrorDisplay error={error} />;
  }

  if (!isLoading && dashboardPageData && (dashboardPageData?.totalTransaction ?? 0) < 1) {
    return (
      <div className='mx-auto w-full max-w-7xl min-w-0 space-y-4 p-4 pt-6 select-none max-sm:max-w-full md:space-y-6 lg:p-8 lg:pt-8'>
        <NoData
          message='Your Dashboard is Ready! Add some accounts and transactions to see your trends.'
          icon={'layoutGrid'}
          className='h-[calc(100vh-250px)]'
        />
      </div>
    );
  }

  return (
    <div className='mx-auto w-full max-w-7xl space-y-4 p-3 pt-4 select-none md:space-y-6'>
      <BentoGrid>
        <BentoGridItem className='col-span-12 row-span-2 md:col-span-6 lg:col-span-4'>
          <DashboardCardContent
            title={DASHBOARD_CARD_CONFIG.default.financialSnapshot.title}
            description={DASHBOARD_CARD_CONFIG.default.financialSnapshot.description}
            icon={DASHBOARD_CARD_CONFIG.default.financialSnapshot.icon}
          >
            {dashboardPageData ? (
              <FinancialSnapshot
                data={dashboardPageData}
                isLoading={isLoading}
                balanceChartData={dashboardPageData?.balanceChartData}
              />
            ) : null}
          </DashboardCardContent>
        </BentoGridItem>
        <BentoGridItem className='col-span-12 row-span-2 md:col-span-6 lg:col-span-4'>
          <DashboardCardContent
            title={DASHBOARD_CARD_CONFIG.default.quickStats.title}
            description={DASHBOARD_CARD_CONFIG.default.quickStats.description}
            icon={DASHBOARD_CARD_CONFIG.default.quickStats.icon}
          >
            <QuickStats data={dashboardPageData} isLoading={isLoading} />
          </DashboardCardContent>
        </BentoGridItem>
        <BentoGridItem className='col-span-12 row-span-2 md:col-span-6 lg:col-span-4'>
          <DashboardCardContent
            title={DASHBOARD_CARD_CONFIG.default.financialHealth.title}
            description={DASHBOARD_CARD_CONFIG.default.financialHealth.description}
            icon={DASHBOARD_CARD_CONFIG.default.financialHealth.icon}
            noExpand
          >
            <FinancialHealth />
          </DashboardCardContent>
        </BentoGridItem>
        <BentoGridItem className='col-span-12 row-span-2 md:col-span-6 lg:col-span-6'>
          <DashboardCardContent
            title={DASHBOARD_CARD_CONFIG.default.trendChart.title}
            description={DASHBOARD_CARD_CONFIG.default.trendChart.description}
            icon={DASHBOARD_CARD_CONFIG.default.trendChart.icon}
          >
            {dashboardPageData ? (
              <TrendChartWrapper
                data={dashboardPageData}
                chartType={chartType}
                isLoading={isLoading}
                setChartType={setChartType}
              />
            ) : null}
          </DashboardCardContent>
        </BentoGridItem>
        <BentoGridItem className='col-span-12 row-span-2 md:col-span-6 lg:col-span-6'>
          <DashboardCardContent
            title={DASHBOARD_CARD_CONFIG.default.spendingBreakdown.title}
            description={DASHBOARD_CARD_CONFIG.default.spendingBreakdown.description}
            icon={DASHBOARD_CARD_CONFIG.default.spendingBreakdown.icon}
          >
            <SpendingBreakdown className='h-full' />
          </DashboardCardContent>
        </BentoGridItem>
        <BentoGridItem className='col-span-12 row-span-2 md:col-span-6 lg:col-span-4'>
          <DashboardCardContent
            title={DASHBOARD_CARD_CONFIG.default.budgetProgress.title}
            description={DASHBOARD_CARD_CONFIG.default.budgetProgress.description}
            icon={DASHBOARD_CARD_CONFIG.default.budgetProgress.icon}
          >
            <BudgetProgress />
          </DashboardCardContent>
        </BentoGridItem>
        <BentoGridItem className='col-span-12 row-span-2 md:col-span-6 lg:col-span-4'>
          <DashboardCardContent
            title={DASHBOARD_CARD_CONFIG.default.goals.title}
            description={DASHBOARD_CARD_CONFIG.default.goals.description}
            icon={DASHBOARD_CARD_CONFIG.default.goals.icon}
          >
            <GoalHighlights />
          </DashboardCardContent>
        </BentoGridItem>
        <BentoGridItem className='col-span-12 row-span-2 md:col-span-6 lg:col-span-4'>
          <DashboardCardContent
            title={DASHBOARD_CARD_CONFIG.default.debtSummary.title}
            description={DASHBOARD_CARD_CONFIG.default.debtSummary.description}
            icon={DASHBOARD_CARD_CONFIG.default.debtSummary.icon}
          >
            <DebtSummaryCard />
          </DashboardCardContent>
        </BentoGridItem>
        <BentoGridItem className='col-span-12 row-span-2 md:col-span-6 lg:col-span-6'>
          <DashboardCardContent
            title={DASHBOARD_CARD_CONFIG.default.investments.title}
            description={DASHBOARD_CARD_CONFIG.default.investments.description}
            icon={DASHBOARD_CARD_CONFIG.default.investments.icon}
          >
            <InvestmentSummaryCard />
          </DashboardCardContent>
        </BentoGridItem>
        <BentoGridItem className='col-span-12 row-span-2 md:col-span-6 lg:col-span-6'>
          <DashboardCardContent
            title={DASHBOARD_CARD_CONFIG.default.accounts.title}
            description={DASHBOARD_CARD_CONFIG.default.accounts.description}
            icon={DASHBOARD_CARD_CONFIG.default.accounts.icon}
          >
            <AccountListSummary
              accountsInfo={dashboardPageData?.accountsInfo}
              isLoading={isLoading}
              className='h-full'
            />
          </DashboardCardContent>
        </BentoGridItem>
      </BentoGrid>
    </div>
  );
};

// New component to encapsulate the card content and dialog logic
interface DashboardCardContentProps {
  title: string;
  icon?: React.ReactNode;
  description?: string;
  children: React.ReactNode;
  className?: string;
  noExpand?: boolean;
}

const DashboardCardContent: React.FC<DashboardCardContentProps> = ({
  title,
  icon,
  description,
  children,
  className,
  noExpand = false
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <Card className={cn('flex h-full flex-col border-0', className)}>
      <CardHeader className='flex flex-row items-start justify-between space-y-0 pt-4 pb-2'>
        <div className='flex-1 pr-4'>
          <CardTitle className='flex items-center gap-2 text-base font-semibold md:text-lg'>
            {icon} {title}
          </CardTitle>
          {description && (
            <CardDescription className='text-xs md:text-sm'>{description}</CardDescription>
          )}
        </div>
        {!noExpand && (
          <div className='flex shrink-0 items-center space-x-1'>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant='ghost'
                  size='icon'
                  className='hidden h-7 w-7 md:flex'
                  aria-label={'Maximize'}
                >
                  <Icon name='maximize2' className='h-4 w-4' />
                </Button>
              </DialogTrigger>
              <DialogContent className='sm:max-w-6xl'>
                <DialogHeader>
                  <DialogTitle>{title}</DialogTitle>
                  {description && <DialogDescription>{description}</DialogDescription>}
                </DialogHeader>
                <div
                  className={cn(
                    'flex min-h-fit flex-1 flex-col justify-center overflow-y-scroll p-0'
                  )}
                >
                  {children}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardHeader>
      <CardContent className={cn('flex max-h-[600px] flex-1 flex-col p-0')}>{children}</CardContent>
    </Card>
  );
};

export default DashboardPage;
