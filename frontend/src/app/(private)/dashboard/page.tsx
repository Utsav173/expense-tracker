'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { accountGetDashboard, accountGetDropdown } from '@/lib/endpoints/accounts';
import { goalGetAll } from '@/lib/endpoints/goal';
import { DashboardData, SavingGoal, ApiResponse, AccountDropdown } from '@/lib/types';
import { useToast } from '@/lib/hooks/useToast';
import React, { useState, useMemo, useCallback, useEffect } from 'react';
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
import { FinancialHealth } from '@/components/dashboard/financial-health';
import { DASHBOARD_PRESETS, DASHBOARD_CARD_CONFIG } from '@/config/dashboard-config';
import { cn } from '@/lib/utils';
import { DashboardControls } from '@/components/dashboard/dashboard-controls';

interface DashboardSettings {
  preset: string;
  timeRangeOption: string;
  customDateRange?: DateRange;
  darkMode: boolean;
  compactView: boolean;
  hiddenSections: string[];
  refreshInterval: number;
}

const initialDashboardSettings: DashboardSettings = {
  preset: 'default',
  timeRangeOption: 'month',
  customDateRange: undefined,
  darkMode: false,
  compactView: false,
  hiddenSections: [],
  refreshInterval: 0
};

const DashboardPage = () => {
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();

  const [dashboardSettings, setDashboardSettings] =
    useState<DashboardSettings>(initialDashboardSettings);

  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [chartType, setChartType] = useState<'line' | 'bar' | 'area'>('line');

  const currentPreset = dashboardSettings.preset;
  const timeRangeOption = dashboardSettings.timeRangeOption;
  const customDateRange = dashboardSettings.customDateRange;
  const isDarkMode = dashboardSettings.darkMode;
  const compactView = dashboardSettings.compactView;
  const hiddenSections = useMemo(
    () => new Set(dashboardSettings.hiddenSections || []),
    [dashboardSettings.hiddenSections]
  );
  const refreshInterval = dashboardSettings.refreshInterval;

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
        if (expandedCard === sectionId) setExpandedCard(null);
      }
      updateSettings({ hiddenSections: Array.from(newHiddenSections) });
    },
    [dashboardSettings.hiddenSections, expandedCard, updateSettings]
  );

  const toggleDarkMode = useCallback(() => {
    updateSettings({ darkMode: !dashboardSettings.darkMode });
  }, [dashboardSettings.darkMode, updateSettings]);

  const toggleCompactView = useCallback(() => {
    updateSettings({ compactView: !dashboardSettings.compactView });
  }, [dashboardSettings.compactView, updateSettings]);

  const refetchAll = useCallback(async () => {
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['dashboardData'] }),
        queryClient.invalidateQueries({ queryKey: ['goalsDashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['accountsDropdownDashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['budgetSummaryDashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['outstandingDebtsDashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['investmentPortfolioSummaryDashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['investmentPortfolioHistoricalDashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['spendingBreakdown'] })
      ]);
      showSuccess('Dashboard data refreshed.');
    } catch (error) {
      console.error('Error invalidating queries:', error);
      showError('Failed to initiate dashboard refresh.');
    }
  }, [queryClient, showSuccess, showError]);

  const changePreset = useCallback(
    (presetKey: string) => {
      const config = DASHBOARD_CARD_CONFIG[presetKey] || DASHBOARD_CARD_CONFIG['default'];
      const sectionsToHide = Object.entries(config)
        .filter(([, value]) => !value.visible)
        .map(([key]) => key);
      updateSettings({ preset: presetKey, hiddenSections: sectionsToHide });
      setExpandedCard(null);
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
      if (rangeValue !== 'custom') {
        setTimeout(() => refetchAll(), 0);
      }
    },
    [dashboardSettings.customDateRange, refetchAll, updateSettings]
  );

  const handleCustomDateSelect = useCallback(
    (range: DateRange | undefined) => {
      updateSettings({
        customDateRange: range,
        timeRangeOption: range?.from && range?.to ? 'custom' : dashboardSettings.timeRangeOption
      });
      if (range?.from && range?.to) {
        setTimeout(() => refetchAll(), 0);
      }
    },
    [dashboardSettings.timeRangeOption, refetchAll, updateSettings]
  );

  const toggleCardExpansion = useCallback(
    (cardId: string) => {
      const currentHidden = new Set(dashboardSettings.hiddenSections);
      if (currentHidden.has(cardId)) {
        toggleSectionVisibility(cardId);
        setTimeout(() => setExpandedCard(cardId), 50);
      } else {
        setExpandedCard((prev) => (prev === cardId ? null : cardId));
      }
    },
    [dashboardSettings.hiddenSections, toggleSectionVisibility]
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

  const queryParams = useMemo(() => {
    const params: { timeRange?: string; startDate?: string; endDate?: string } = {};
    if (
      timeRangeOption === 'custom' &&
      customDateRange?.from instanceof Date &&
      customDateRange?.to instanceof Date
    ) {
      params.timeRange = 'custom';
      try {
        params.startDate = customDateRange.from.toISOString().split('T')[0];
        params.endDate = customDateRange.to.toISOString().split('T')[0];
      } catch (e) {
        console.error('Error converting custom dates to ISO string:', e);
        return undefined;
      }
    } else if (timeRangeOption !== 'custom') {
      params.timeRange = timeRangeOption;
    }
    return params.timeRange ? params : undefined;
  }, [timeRangeOption, customDateRange]);

  const {
    data: dashboardData,
    isLoading: isDashboardLoading,
    error: dashboardError,
    isFetching: isDashboardFetching
  } = useQuery({
    queryKey: ['dashboardData', queryParams],
    queryFn: () => accountGetDashboard(queryParams),
    retry: 1,
    staleTime: 5 * 60 * 1000,
    refetchInterval: refreshInterval > 0 ? refreshInterval : false,
    enabled: !!queryParams
  });

  const {
    data: goalsData,
    isLoading: isGoalsLoading,
    error: goalsError
  } = useQuery({
    queryKey: ['goalsDashboard'],
    queryFn: () => goalGetAll({ page: 1, limit: 5 }),
    retry: 1,
    staleTime: 15 * 60 * 1000,
    enabled: true
  });

  const {
    data: accountsDropdownData,
    isLoading: isAccountsDropdownLoading,
    error: accountsDropdownError
  } = useQuery({
    queryKey: ['accountsDropdownDashboard'],
    queryFn: accountGetDropdown,
    retry: 1,
    staleTime: 30 * 60 * 1000,
    enabled: true
  });

  const isLoading = isDashboardLoading || isAccountsDropdownLoading || isGoalsLoading;

  const isRefreshing = isDashboardFetching;

  const hasError = useMemo(
    () => !!dashboardError || !!accountsDropdownError || !!goalsError,
    [dashboardError, accountsDropdownError, goalsError]
  );

  const combinedError = useMemo(
    () => dashboardError || accountsDropdownError || goalsError,
    [dashboardError, accountsDropdownError, goalsError]
  );

  const accountIdToCurrencyMap = useMemo(() => {
    const map = new Map<string, string>();
    accountsDropdownData?.forEach((acc: AccountDropdown) => {
      if (acc?.id && acc.currency) {
        map.set(acc.id, acc.currency);
      }
    });
    return map;
  }, [accountsDropdownData]);

  const currentLayoutConfig =
    DASHBOARD_CARD_CONFIG[currentPreset] || DASHBOARD_CARD_CONFIG['default'];

  const cardMap: Record<string, React.ReactNode> = useMemo(
    () => ({
      financialHealth: dashboardData ? <FinancialHealth data={dashboardData} /> : null,
      financialSnapshot: dashboardData ? (
        <FinancialSnapshot data={dashboardData} isLoading={isDashboardLoading} />
      ) : null,
      trendChart: dashboardData ? (
        <TrendChartWrapper
          data={dashboardData}
          chartType={chartType}
          isLoading={isDashboardLoading && !dashboardData}
          expanded={expandedCard === 'trendChart'}
          setChartType={setChartType}
        />
      ) : (
        <NoData />
      ),
      spendingBreakdown: <SpendingBreakdown className='h-full' />,
      budgetProgress: <BudgetProgress />,
      goals: <GoalHighlights data={goalsData?.data} isLoading={isGoalsLoading} />,
      investments: <InvestmentSummaryCard />,
      debtSummary: <DebtSummaryCard />,
      accounts: (
        <AccountListSummary
          accountsInfo={dashboardData?.accountsInfo}
          accountIdToCurrencyMap={accountIdToCurrencyMap}
          isLoading={isDashboardLoading || isAccountsDropdownLoading}
        />
      ),
      quickStats: dashboardData ? (
        <QuickStats data={dashboardData} isLoading={isDashboardLoading} />
      ) : null
    }),
    [
      dashboardData,
      isDashboardLoading,
      isAccountsDropdownLoading,
      isGoalsLoading,
      goalsData,
      chartType,
      expandedCard,
      accountIdToCurrencyMap
    ]
  );

  const renderSkeleton = () => (
    <div className='mx-auto w-full max-w-7xl animate-pulse space-y-6 p-4 pt-6 lg:p-8 lg:pt-8'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <Skeleton className='h-9 w-48 rounded-md' />
        <div className='flex flex-wrap items-center gap-2'>
          <Skeleton className='h-9 w-32 rounded-md' />
          <Skeleton className='h-9 w-32 rounded-md' />
          <Skeleton className='h-9 w-32 rounded-md' />
          <Skeleton className='h-9 w-28 rounded-md' />
        </div>
      </div>
      <Skeleton className='h-28 w-full rounded-lg' />
      <Skeleton className='h-40 w-full rounded-lg' />
      <div className='grid grid-cols-12 gap-6'>
        <Skeleton className='col-span-12 h-[400px] w-full rounded-lg lg:col-span-8' />
        <Skeleton className='col-span-12 h-[400px] w-full rounded-lg lg:col-span-4' />
      </div>
      <div className='grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4'>
        {[...Array(4)].map((_, i) => (
          <Skeleton key={`sk-small-${i}`} className='h-[280px] w-full rounded-lg' />
        ))}
      </div>
      <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
        <Skeleton className='h-[280px] w-full rounded-lg' />
        <Skeleton className='h-[280px] w-full rounded-lg' />
      </div>
    </div>
  );

  const renderErrorState = () => (
    <div className='mx-auto w-full max-w-7xl p-6 lg:p-8'>
      <div className='sticky top-0 z-10 mb-6 flex flex-col gap-4 bg-background/95 pb-3 pt-1 backdrop-blur dark:bg-background/90 sm:flex-row sm:items-center sm:justify-between'>
        <h1 className='text-3xl font-bold'>Dashboard</h1>
        <div className='flex flex-wrap items-center gap-2'>
          <button className='' onClick={refetchAll}>
            Retry
          </button>
        </div>
      </div>
      <Alert variant='destructive' className='mt-6'>
        <Frown className='h-4 w-4' />
        <AlertTitle>Oops! Something went wrong.</AlertTitle>
        <AlertDescription>
          We couldn't load your dashboard data. Please check your connection and try refreshing.
          {combinedError && (
            <div className='mt-2 text-xs text-muted-foreground'>
              Error: {(combinedError as Error).message}
            </div>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );

  if (isLoading && !isRefreshing && !dashboardData) {
    return renderSkeleton();
  }

  if (hasError && !dashboardData) {
    return renderErrorState();
  }

  if (!isLoading && !hasError && dashboardData && dashboardData.totalTransaction < 2) {
    return (
      <div className='mx-auto w-full min-w-0 max-w-7xl space-y-4 p-4 pt-6 max-sm:max-w-full md:space-y-6 lg:p-8 lg:pt-8'>
        <DashboardControls
          currentPreset={currentPreset}
          timeRangeOption={timeRangeOption}
          customDateRange={customDateRange}
          layoutConfig={currentLayoutConfig}
          hiddenSections={hiddenSections}
          refreshInterval={refreshInterval}
          isDarkMode={isDarkMode}
          compactView={compactView}
          isRefreshing={isRefreshing}
          isLoading={isLoading}
          onChangePreset={changePreset}
          onTimeRangeChange={handleTimeRangeChange}
          onCustomDateSelect={handleCustomDateSelect}
          onToggleSectionVisibility={toggleSectionVisibility}
          onSetRefreshInterval={handleSetRefreshInterval}
          onToggleDarkMode={toggleDarkMode}
          onToggleCompactView={toggleCompactView}
          onRefetchAll={refetchAll}
        />
        <NoData
          message='Your Dashboard is Ready! Add some transactions to see your trends.'
          icon={LayoutGrid}
          className='h-[calc(100vh-250px)]'
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'min-w-o mx-auto w-full max-w-7xl space-y-4 pt-6 transition-all duration-200 max-sm:max-w-full md:space-y-6 lg:p-8 lg:pt-8',
        compactView ? 'space-y-3' : ''
      )}
    >
      <DashboardControls
        currentPreset={currentPreset}
        timeRangeOption={timeRangeOption}
        customDateRange={customDateRange}
        layoutConfig={currentLayoutConfig}
        hiddenSections={hiddenSections}
        refreshInterval={refreshInterval}
        isDarkMode={isDarkMode}
        compactView={compactView}
        isRefreshing={isRefreshing}
        isLoading={isLoading}
        onChangePreset={changePreset}
        onTimeRangeChange={handleTimeRangeChange}
        onCustomDateSelect={handleCustomDateSelect}
        onToggleSectionVisibility={toggleSectionVisibility}
        onSetRefreshInterval={handleSetRefreshInterval}
        onToggleDarkMode={toggleDarkMode}
        onToggleCompactView={toggleCompactView}
        onRefetchAll={refetchAll}
      />

      <div className='grid grid-cols-12 gap-4'>
        {Object.entries(currentLayoutConfig)
          .filter(([id]) => !hiddenSections.has(id) || expandedCard === id)
          .map(([id, config]) => (
            <DashboardCardWrapper
              key={id}
              id={id}
              title={config.title}
              description={config.description}
              gridSpanClass={config.gridSpan}
              isExpanded={expandedCard === id}
              isHidden={hiddenSections.has(id)}
              onExpandToggle={toggleCardExpansion}
              onVisibilityToggle={toggleSectionVisibility}
              noPadding={config.noPadding}
            >
              {cardMap[id] || <div>Content for {id}</div>}
            </DashboardCardWrapper>
          ))}
      </div>
    </div>
  );
};

export default DashboardPage;
