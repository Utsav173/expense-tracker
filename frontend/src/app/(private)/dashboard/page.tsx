'use client';

import { useToast } from '@/lib/hooks/useToast';
import React, { useState, useMemo, useCallback } from 'react';
import { DateRange } from 'react-day-picker';
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
import { cn } from '@/lib/utils';
import { DashboardControls } from '@/components/dashboard/dashboard-controls';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useAuth } from '@/lib/hooks/useAuth';
import Loader from '@/components/ui/loader';

interface DashboardSettings {
  preset: string;
  timeRangeOption: string;
  customDateRange?: DateRange;
  darkMode: boolean;
  hiddenSections: string[];
  refreshInterval: number;
}

const initialDashboardSettings: DashboardSettings = {
  preset: 'default',
  timeRangeOption: 'thisMonth',
  customDateRange: undefined,
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
    timeRangeOption: dashboardSettings.timeRangeOption,
    customDateRange: dashboardSettings.customDateRange,
    user: user
  });

  const updateSettings = useCallback(
    (updates: Partial<DashboardSettings>) => {
      setDashboardSettings((prev) => ({ ...prev, ...updates }));
      if (
        (updates.timeRangeOption && updates.timeRangeOption !== 'custom') ||
        (updates.timeRangeOption === 'custom' &&
          updates.customDateRange?.from &&
          updates.customDateRange?.to)
      ) {
        setTimeout(() => refetch(), 0);
      }
    },
    [refetch]
  );

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

  const handleTimeRangeChange = useCallback(
    (rangeValue: string) => {
      updateSettings({
        timeRangeOption: rangeValue,
        customDateRange: rangeValue !== 'custom' ? undefined : dashboardSettings.customDateRange
      });
    },
    [dashboardSettings.customDateRange, updateSettings]
  );

  const handleCustomDateSelect = useCallback(
    (range: DateRange | undefined) => {
      updateSettings({
        customDateRange: range,
        timeRangeOption: range?.from && range?.to ? 'custom' : dashboardSettings.timeRangeOption
      });
    },
    [dashboardSettings.timeRangeOption, updateSettings]
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
          isLoading={isLoading && !dashboardPageData?.dashboardSummary}
          setChartType={setChartType}
          timeRangeOption={dashboardSettings.timeRangeOption}
          customDateRange={dashboardSettings.customDateRange}
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
          accountIdToCurrencyMap={dashboardPageData?.accountIdToCurrencyMap ?? new Map()}
          isLoading={isLoading}
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
    <div className='mx-auto w-full max-w-7xl p-6 lg:p-8'>
      <DashboardControls
        currentPreset={dashboardSettings.preset}
        timeRangeOption={dashboardSettings.timeRangeOption}
        customDateRange={dashboardSettings.customDateRange}
        layoutConfig={currentLayoutConfig}
        hiddenSections={hiddenSections}
        refreshInterval={dashboardSettings.refreshInterval}
        isDarkMode={dashboardSettings.darkMode}
        isRefreshing={isFetching}
        isLoading={isLoading}
        onChangePreset={changePreset}
        onTimeRangeChange={handleTimeRangeChange}
        onCustomDateSelect={handleCustomDateSelect}
        onToggleSectionVisibility={toggleSectionVisibility}
        onSetRefreshInterval={handleSetRefreshInterval}
        onToggleDarkMode={toggleDarkMode}
        onRefetchAll={refetchAll}
      />
      <Alert variant='destructive' className='mt-6'>
        <Frown className='h-4 w-4' />
        <AlertTitle>Oops! Something went wrong.</AlertTitle>
        <AlertDescription>
          We couldn't load your dashboard data. Please check your connection and try refreshing.
          {error && (
            <div className='mt-2 text-xs text-muted-foreground'>
              Error: {(error as Error).message}
            </div>
          )}
        </AlertDescription>
      </Alert>
    </div>
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
      <div className='mx-auto w-full min-w-0 max-w-7xl space-y-4 p-4 pt-6 max-sm:max-w-full md:space-y-6 lg:p-8 lg:pt-8'>
        <DashboardControls
          currentPreset={dashboardSettings.preset}
          timeRangeOption={dashboardSettings.timeRangeOption}
          customDateRange={dashboardSettings.customDateRange}
          layoutConfig={currentLayoutConfig}
          hiddenSections={hiddenSections}
          refreshInterval={dashboardSettings.refreshInterval}
          isDarkMode={dashboardSettings.darkMode}
          isRefreshing={isFetching}
          isLoading={isLoading}
          onChangePreset={changePreset}
          onTimeRangeChange={handleTimeRangeChange}
          onCustomDateSelect={handleCustomDateSelect}
          onToggleSectionVisibility={toggleSectionVisibility}
          onSetRefreshInterval={handleSetRefreshInterval}
          onToggleDarkMode={toggleDarkMode}
          onRefetchAll={refetchAll}
        />
        <NoData
          message='Your Dashboard is Ready! Add some accounts and transactions to see your trends.'
          icon={LayoutGrid}
          className='h-[calc(100vh-250px)]'
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'min-w-o mx-auto w-full max-w-7xl space-y-4 transition-all duration-200 max-sm:max-w-full md:space-y-6 lg:p-8 lg:pt-8'
      )}
    >
      <DashboardControls
        currentPreset={dashboardSettings.preset}
        timeRangeOption={dashboardSettings.timeRangeOption}
        customDateRange={dashboardSettings.customDateRange}
        layoutConfig={currentLayoutConfig}
        hiddenSections={hiddenSections}
        refreshInterval={dashboardSettings.refreshInterval}
        isDarkMode={dashboardSettings.darkMode}
        isRefreshing={isFetching}
        isLoading={isLoading}
        onChangePreset={changePreset}
        onTimeRangeChange={handleTimeRangeChange}
        onCustomDateSelect={handleCustomDateSelect}
        onToggleSectionVisibility={toggleSectionVisibility}
        onSetRefreshInterval={handleSetRefreshInterval}
        onToggleDarkMode={toggleDarkMode}
        onRefetchAll={refetchAll}
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

      <div className='grid grid-cols-12 gap-4'>
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
  );
};

export default DashboardPage;
