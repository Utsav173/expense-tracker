'use client';

import { useToast } from '@/lib/hooks/useToast';
import React, { useState, useMemo, useCallback } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import NoData from '@/components/ui/no-data';
import { Frown, LayoutGrid } from 'lucide-react';
import { FinancialSnapshot } from '@/components/dashboard/financial-snapshot';
import TrendChartWrapper from '@/components/dashboard/trend-chart-wrapper';
import { BudgetProgress } from '@/components/dashboard/budget-progress';
import { GoalHighlights } from '@/components/dashboard/goal-highlights';
import { InvestmentSummaryCard } from '@/components/dashboard/investment-summary-card';
import { DebtSummaryCard } from '@/components/dashboard/debt-summary-card';
import { AccountListSummary } from '@/components/dashboard/account-list-summary';
import { QuickStats } from '@/components/dashboard/quick-stats';
import { SpendingBreakdown } from '@/components/dashboard/spending-breakdown';
import { DashboardCardWrapper } from '@/components/dashboard/dashboard-card-wrapper';
import FinancialHealth from '@/components/dashboard/financial-health';
import { DASHBOARD_PRESETS, DASHBOARD_CARD_CONFIG } from '@/config/dashboard-config';
import { DashboardControls } from '@/components/dashboard/dashboard-controls';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useAuth } from '@/hooks/useAuth';
import Loader from '@/components/ui/loader';

interface DashboardSettings {
  preset: string;
  darkMode: boolean;
  hiddenSections: string[];
  refreshInterval: number;
}

const initialDashboardSettings: DashboardSettings = {
  preset: 'default',
  darkMode: false,
  hiddenSections: [],
  refreshInterval: 0
};

const DashboardPage = () => {
  const { showSuccess, showError } = useToast();
  const { user } = useAuth();

  const [dashboardSettings, setDashboardSettings] =
    useState<DashboardSettings>(initialDashboardSettings);

  const [chartType, setChartType] = useState<'line' | 'bar' | 'area'>('line');

  const currentPreset = dashboardSettings.preset;
  const hiddenSections = useMemo(
    () => new Set(dashboardSettings.hiddenSections || []),
    [dashboardSettings.hiddenSections]
  );

  const {
    data: dashboardPageData,
    isLoading,
    isFetching,
    isError,
    error,
    refetch
  } = useDashboardData({
    user: user,
    timeRangeOption: 'thisMonth',
    customDateRange: undefined
  });

  const updateSettings = useCallback((updates: Partial<DashboardSettings>) => {
    setDashboardSettings((prev) => ({ ...prev, ...updates }));
  }, []);

  const toggleSectionVisibility = useCallback(
    (sectionId: string) => {
      const newHiddenSections = new Set(dashboardSettings.hiddenSections);
      if (newHiddenSections.has(sectionId)) {
        newHiddenSections.delete(sectionId);
      } else {
        newHiddenSections.add(sectionId);
      }
      updateSettings({ hiddenSections: Array.from(newHiddenSections) });
    },
    [dashboardSettings.hiddenSections, updateSettings]
  );

  const toggleDarkMode = useCallback(() => {
    updateSettings({ darkMode: !dashboardSettings.darkMode });
  }, [dashboardSettings.darkMode, updateSettings]);

  const refetchAll = useCallback(async () => {
    try {
      await refetch();
      showSuccess('Dashboard data refreshed.');
    } catch (fetchError) {
      console.error('Error refreshing dashboard:', fetchError);
      showError('Failed to refresh dashboard data.');
    }
  }, [refetch, showSuccess, showError]);

  const changePreset = useCallback(
    (presetKey: string) => {
      const config = DASHBOARD_CARD_CONFIG[presetKey] || DASHBOARD_CARD_CONFIG['default'];
      const sectionsToHide = Object.entries(config)
        .filter(([, value]) => !value.visible)
        .map(([key]) => key);
      updateSettings({ preset: presetKey, hiddenSections: sectionsToHide });
      showSuccess(`Switched to "${DASHBOARD_PRESETS[presetKey]}" layout`);
      refetchAll();
    },
    [showSuccess, refetchAll, updateSettings]
  );

  const handleSetRefreshInterval = useCallback(
    (intervalMs: number) => {
      updateSettings({ refreshInterval: intervalMs });
      showSuccess(
        intervalMs > 0
          ? `Dashboard will refresh every ${intervalMs / 60000} minutes.`
          : 'Automatic refresh disabled.'
      );
      refetchAll();
    },
    [showSuccess, refetchAll, updateSettings]
  );

  const currentLayoutConfig =
    DASHBOARD_CARD_CONFIG[currentPreset] || DASHBOARD_CARD_CONFIG['default'];

  const cardMap: Record<string, React.ReactNode> = useMemo(
    () => ({
      financialHealth: dashboardPageData?.dashboardSummary ? (
        <FinancialHealth data={dashboardPageData.dashboardSummary} />
      ) : null,
      financialSnapshot: dashboardPageData?.dashboardSummary ? (
        <FinancialSnapshot data={dashboardPageData.dashboardSummary} isLoading={isLoading} />
      ) : null,
      trendChart: dashboardPageData?.dashboardSummary ? (
        <TrendChartWrapper
          data={dashboardPageData.dashboardSummary}
          chartType={chartType}
          isLoading={isLoading}
          setChartType={setChartType}
        />
      ) : null,
      spendingBreakdown: <SpendingBreakdown className='h-full' />,
      budgetProgress: <BudgetProgress />,
      goals: <GoalHighlights data={dashboardPageData?.goals ?? undefined} isLoading={isLoading} />,
      investments: <InvestmentSummaryCard />,
      debtSummary: <DebtSummaryCard />,
      accounts: (
        <AccountListSummary
          accountsInfo={dashboardPageData?.dashboardSummary?.accountsInfo}
          isLoading={isLoading}
          className='col-span-12 md:col-span-6 lg:col-span-4'
        />
      ),
      quickStats: dashboardPageData?.dashboardSummary ? (
        <QuickStats data={dashboardPageData.dashboardSummary} isLoading={isLoading} />
      ) : null
    }),
    [dashboardPageData, isLoading, chartType]
  );

  const renderSkeleton = () => (
    <div className='mx-auto w-full max-w-7xl animate-pulse space-y-6 p-4 pt-6 lg:p-8 lg:pt-8'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <Skeleton className='h-9 w-48 rounded-md' />
        <div className='flex flex-wrap items-center gap-2'>
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className='h-9 w-28 rounded-md' />
          ))}
        </div>
      </div>
      <Skeleton className='h-28 w-full rounded-lg' />
      <div className='grid grid-cols-12 gap-6'>
        <Skeleton className='col-span-12 h-[400px] w-full rounded-lg lg:col-span-8' />
        <Skeleton className='col-span-12 h-[400px] w-full rounded-lg lg:col-span-4' />
      </div>
    </div>
  );

  const renderErrorState = () => (
    <Alert variant='destructive' className='max-auto mt-6'>
      <Frown className='h-4 w-4' />
      <AlertTitle>Oops! Something went wrong.</AlertTitle>
      <AlertDescription>
        We couldn't load your dashboard data. Please check your connection and try refreshing.
        {error && (
          <div className='text-muted-foreground mt-2 text-xs'>
            Error: {(error as Error).message}
          </div>
        )}
      </AlertDescription>
    </Alert>
  );

  if (isLoading && !isFetching) {
    return renderSkeleton();
  }

  if (isError && !dashboardPageData) {
    return renderErrorState();
  }

  if (
    !isLoading &&
    dashboardPageData &&
    (dashboardPageData.dashboardSummary?.totalTransaction ?? 0) < 1
  ) {
    return (
      <div className='mx-auto w-full max-w-7xl min-w-0 space-y-4 p-4 pt-6 select-none max-sm:max-w-full md:space-y-6 lg:p-8 lg:pt-8'>
        <NoData
          message='Your Dashboard is Ready! Add some accounts and transactions to see your trends.'
          icon={LayoutGrid}
          className='h-[calc(100vh-250px)]'
        />
      </div>
    );
  }

  return (
    <div className='space-y-4 select-none'>
      <DashboardControls
        currentPreset={dashboardSettings.preset}
        layoutConfig={currentLayoutConfig}
        hiddenSections={hiddenSections}
        refreshInterval={dashboardSettings.refreshInterval}
        isDarkMode={dashboardSettings.darkMode}
        onChangePreset={changePreset}
        onToggleSectionVisibility={toggleSectionVisibility}
        onSetRefreshInterval={handleSetRefreshInterval}
        onToggleDarkMode={toggleDarkMode}
      />

      {isError && dashboardPageData && (
        <Alert variant='destructive' className='mt-4'>
          <Frown className='h-4 w-4' />
          <AlertTitle>Data Update Issue</AlertTitle>
          <AlertDescription>
            Could not update all dashboard sections. Some data might be stale.
            {error && <div className='mt-1 text-xs'>Details: {(error as Error).message}</div>}
          </AlertDescription>
        </Alert>
      )}

      <div className='mx-auto w-full max-w-7xl p-2 max-sm:max-w-full max-sm:p-0'>
        <div className='grid max-w-7xl grid-cols-12 gap-4'>
          {Object.entries(currentLayoutConfig)
            .filter(([id]) => !hiddenSections.has(id))
            .map(([id, config]) => (
              <DashboardCardWrapper
                key={id}
                id={id}
                title={config.title}
                description={config.description}
                gridSpanClass={config.gridSpan}
                isHidden={hiddenSections.has(id)}
                onVisibilityToggle={toggleSectionVisibility}
                icon={config.icon}
              >
                {cardMap[id] ?? <Loader className='my-2' />}
              </DashboardCardWrapper>
            ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
