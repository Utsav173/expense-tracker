'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { accountGetDashboard, accountGetDropdown } from '@/lib/endpoints/accounts';
import { goalGetAll } from '@/lib/endpoints/goal';
import { DashboardData, SavingGoal, ApiResponse, AccountDropdown } from '@/lib/types';
import { useToast } from '@/lib/hooks/useToast';
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { DateRange } from 'react-day-picker';

import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';

import NoData from '@/components/ui/no-data';

import {
  RefreshCw,
  Frown,
  LayoutGrid,
  ChevronDown,
  Calendar,
  Eye,
  EyeOff,
  SlidersHorizontal,
  Sun,
  Moon,
  Maximize2,
  Minimize2,
  BarChart,
  LineChart,
  AreaChart
} from 'lucide-react';

import { FinancialSnapshot } from '@/components/dashboard/financial-snapshot';
import TrendChart from '@/components/dashboard/trend-chart';
import { BudgetProgress } from '@/components/dashboard/budget-progress';
import { GoalHighlights } from '@/components/dashboard/goal-highlights';
import { InvestmentSummaryCard } from '@/components/dashboard/investment-summary-card';
import { DebtSummaryCard } from '@/components/dashboard/debt-summary-card';
import { AccountListSummary } from '@/components/dashboard/account-list-summary';
import { QuickStats } from '@/components/dashboard/quick-stats';
import { SpendingBreakdown } from '@/components/dashboard/spending-breakdown';

const DASHBOARD_PRESETS: Record<string, string> = {
  default: 'Default View',
  budgetFocus: 'Budget Focus',
  savingsFocus: 'Savings Focus',
  investmentFocus: 'Investment Focus',
  debtFocus: 'Debt Focus'
};

const TIME_RANGES = [
  { label: '7 Days', value: '7d' },
  { label: '30 Days', value: '30d' },
  { label: 'This Month', value: 'month' },
  { label: 'This Quarter', value: 'quarter' },
  { label: 'Year to Date', value: 'ytd' },
  { label: 'Last 12 Months', value: '12m' },
  { label: 'Custom Range', value: 'custom' }
];

const DashboardPage = () => {
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();

  const [currentPreset, setCurrentPreset] = useState<string>('default');
  const [timeRangeOption, setTimeRangeOption] = useState<string>('month');
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>(undefined);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [compactView, setCompactView] = useState<boolean>(false);
  const [hiddenSections, setHiddenSections] = useState<Set<string>>(new Set());
  const [refreshInterval, setRefreshInterval] = useState<number>(0);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [chartType, setChartType] = useState<'line' | 'bar' | 'area'>('line');

  useEffect(() => {
    const savedPreset = localStorage.getItem('dashboard_preset') || 'default';
    const savedTimeRange = localStorage.getItem('dashboard_timeRangeOption') || 'month';
    const savedCustomRangeFrom = localStorage.getItem('dashboard_customDateRange_from');
    const savedCustomRangeTo = localStorage.getItem('dashboard_customDateRange_to');
    const savedDarkMode = localStorage.getItem('dashboard_darkMode') === 'true';
    const savedCompactView = localStorage.getItem('dashboard_compactView') === 'true';
    const savedHiddenSections = localStorage.getItem('dashboard_hiddenSections');
    const savedRefreshInterval = parseInt(
      localStorage.getItem('dashboard_refreshInterval') || '0',
      10
    );

    setCurrentPreset(DASHBOARD_PRESETS[savedPreset] ? savedPreset : 'default');
    setTimeRangeOption(
      TIME_RANGES.some((r) => r.value === savedTimeRange) ? savedTimeRange : 'month'
    );
    if (savedCustomRangeFrom && savedCustomRangeTo) {
      try {
        setCustomDateRange({
          from: new Date(savedCustomRangeFrom),
          to: new Date(savedCustomRangeTo)
        });
      } catch (e) {
        console.error('Error parsing dates from localStorage', e);
      }
    }
    setIsDarkMode(savedDarkMode);
    setCompactView(savedCompactView);
    if (savedHiddenSections) {
      try {
        setHiddenSections(new Set(JSON.parse(savedHiddenSections)));
      } catch (e) {
        console.error('Failed to parse hidden sections from localStorage', e);
      }
    }
    setRefreshInterval(savedRefreshInterval > 0 ? savedRefreshInterval : 0);

    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const savePreference = (key: string, value: any) => {
    try {
      localStorage.setItem(`dashboard_${key}`, JSON.stringify(value));
    } catch (e) {
      console.error(`Failed to save preference ${key} to localStorage`, e);
    }
  };

  const toggleSectionVisibility = (sectionId: string) => {
    const newHiddenSections = new Set(hiddenSections);
    if (newHiddenSections.has(sectionId)) {
      newHiddenSections.delete(sectionId);
    } else {
      newHiddenSections.add(sectionId);
      if (expandedCard === sectionId) setExpandedCard(null);
    }
    setHiddenSections(newHiddenSections);
    savePreference('hiddenSections', [...newHiddenSections]);
  };

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    savePreference('darkMode', newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const toggleCompactView = () => {
    const newView = !compactView;
    setCompactView(newView);
    savePreference('compactView', newView);
  };

  const changePreset = (preset: string) => {
    setCurrentPreset(preset);
    savePreference('preset', preset);

    let sectionsToHide = new Set<string>();
    switch (preset) {
      case 'budgetFocus':
        sectionsToHide = new Set(['investments', 'debtSummary', 'quickStats', 'accounts']);
        break;
      case 'savingsFocus':
        sectionsToHide = new Set(['spendingBreakdown', 'debtSummary', 'investments']);
        break;
      case 'investmentFocus':
        sectionsToHide = new Set(['budgetProgress', 'quickStats', 'debtSummary', 'goals']);
        break;
      case 'debtFocus':
        sectionsToHide = new Set(['investments', 'spendingBreakdown', 'budgetProgress']);
        break;
      default:
        sectionsToHide = new Set();
    }
    setHiddenSections(sectionsToHide);
    savePreference('hiddenSections', [...sectionsToHide]);

    showSuccess(`Switched to "${DASHBOARD_PRESETS[preset]}" layout`);
  };

  const handleTimeRangeChange = (rangeValue: string) => {
    setTimeRangeOption(rangeValue);
    savePreference('timeRangeOption', rangeValue);

    if (rangeValue !== 'custom') {
      setCustomDateRange(undefined);
      savePreference('customDateRange_from', null);
      savePreference('customDateRange_to', null);
      setTimeout(refetchAll, 0);
    }
  };

  const handleCustomDateSelect = (range: DateRange | undefined) => {
    setCustomDateRange(range);
    if (range?.from && range?.to) {
      savePreference('customDateRange_from', range.from.toISOString());
      savePreference('customDateRange_to', range.to.toISOString());
      setTimeout(refetchAll, 0);
    } else {
      savePreference('customDateRange_from', null);
      savePreference('customDateRange_to', null);
    }
  };

  const toggleCardExpansion = (cardId: string) => {
    if (hiddenSections.has(cardId)) {
      toggleSectionVisibility(cardId);
      setTimeout(() => setExpandedCard(cardId), 0);
    } else {
      setExpandedCard((prev) => (prev === cardId ? null : cardId));
    }
  };

  const handleSetRefreshInterval = (intervalMs: number) => {
    setRefreshInterval(intervalMs);
    savePreference('refreshInterval', intervalMs);
    showSuccess(
      intervalMs > 0
        ? `Dashboard will refresh every ${intervalMs / 60000} minutes.`
        : 'Automatic refresh disabled.'
    );
    refetchAll();
  };

  const queryParams = useMemo(() => {
    const params: { timeRange?: string; startDate?: string; endDate?: string } = {};
    if (timeRangeOption === 'custom' && customDateRange?.from && customDateRange?.to) {
      params.timeRange = 'custom';
      params.startDate = customDateRange.from.toISOString().split('T')[0];
      params.endDate = customDateRange.to.toISOString().split('T')[0];
    } else if (timeRangeOption !== 'custom') {
      params.timeRange = timeRangeOption;
    }
    if (params.timeRange) {
      return params;
    }
    return undefined;
  }, [timeRangeOption, customDateRange]);

  const {
    data: dashboardApiResponse,
    isLoading: isDashboardLoading,
    error: dashboardError,
    isFetching: isDashboardFetching
  } = useQuery<ApiResponse<DashboardData>>({
    queryKey: ['dashboard', queryParams],
    queryFn: () => {
      if (!queryParams) {
        return Promise.reject(new Error('Query parameters are not ready.'));
      }
      return accountGetDashboard(queryParams);
    },
    retry: 1,
    staleTime: 5 * 60 * 1000,
    refetchInterval: refreshInterval > 0 ? refreshInterval : false,
    enabled: !!queryParams
  });

  const {
    data: goalsApiResponse,
    isLoading: isGoalsLoading,
    error: goalsError,
    isFetching: isGoalsFetching
  } = useQuery<ApiResponse<{ data: SavingGoal[] }>>({
    queryKey: ['goalsDashboard'],
    queryFn: () => goalGetAll({ limit: 5 }),
    retry: 1,
    staleTime: 15 * 60 * 1000,
    refetchInterval: refreshInterval > 0 ? refreshInterval : false
  });

  const {
    data: accountsDropdownApiResponse,
    isLoading: isAccountsDropdownLoading,
    error: accountsDropdownError,
    isFetching: isAccountsFetching
  } = useQuery<ApiResponse<AccountDropdown[]>>({
    queryKey: ['accountsDropdownDashboard'],
    queryFn: () => accountGetDropdown(),
    retry: 1,
    staleTime: 30 * 60 * 1000,
    refetchInterval: refreshInterval > 0 ? refreshInterval : false
  });

  const dashboardData = useMemo(
    () =>
      dashboardApiResponse ?? {
        accountsInfo: [],
        transactionsCountByAccount: {},
        totalTransaction: 0,
        mostExpensiveExpense: null,
        cheapestExpense: null,
        mostExpensiveIncome: null,
        cheapestIncome: null,
        incomeChartData: [],
        expenseChartData: [],
        balanceChartData: [],
        overallIncome: 0,
        overallExpense: 0,
        overallBalance: 0,
        overallIncomeChange: 0,
        overallExpenseChange: 0
      },
    [dashboardApiResponse]
  );

  const goalsData = useMemo(() => goalsApiResponse?.data ?? [], [goalsApiResponse]);
  const accountsDropdownData = useMemo(
    () => accountsDropdownApiResponse ?? [],
    [accountsDropdownApiResponse]
  );

  const accountIdToCurrencyMap = useMemo(() => {
    const map = new Map<string, string>();
    accountsDropdownData.forEach((acc: AccountDropdown) => {
      if (acc && acc.id && acc.currency) {
        map.set(acc.id, acc.currency);
      }
    });
    return map;
  }, [accountsDropdownData]);

  const isLoading = useMemo(
    () => isDashboardLoading || isAccountsDropdownLoading || isGoalsLoading,
    [isDashboardLoading, isAccountsDropdownLoading, isGoalsLoading]
  );

  const hasError = useMemo(
    () => !!dashboardError || !!accountsDropdownError || !!goalsError,
    [dashboardError, accountsDropdownError, goalsError]
  );

  const combinedError = useMemo(
    () => dashboardError || accountsDropdownError || goalsError,
    [dashboardError, accountsDropdownError, goalsError]
  );

  const isRefreshing = useMemo(
    () => isDashboardFetching || isGoalsFetching || isAccountsFetching,
    [isDashboardFetching, isGoalsFetching, isAccountsFetching]
  );

  const refetchAll = useCallback(async () => {
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['goalsDashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['accountsDropdownDashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['budgetSummaryDashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['outstandingDebtsDashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['investmentPortfolioSummaryDashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['investmentPortfolioHistoricalDashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['spendingBreakdown'] })
      ]);
    } catch (error) {
      console.error('Error invalidating queries:', error);
      showError('Failed to initiate dashboard refresh.');
    }
  }, [queryClient, showSuccess, showError]);

  const calculateFinancialHealthScore = useCallback(() => {
    const income = dashboardData.overallIncome ?? 0;
    const expense = dashboardData.overallExpense ?? 0;
    const savingsRatio = income > 0 ? Math.max(0, (income - expense) / income) : 0;
    const expenseRatio = income > 0 ? expense / income : expense > 0 ? 1 : 0;
    const incomeGrowth = dashboardData.overallIncomeChange ?? 0;

    let score = 50;

    if (savingsRatio > 0.25) score += 40;
    else if (savingsRatio > 0.15) score += 30;
    else if (savingsRatio > 0.05) score += 15;
    else if (savingsRatio > 0) score += 5;

    if (expenseRatio < 0.6) score += 30;
    else if (expenseRatio < 0.8) score += 20;
    else if (expenseRatio < 0.95) score += 10;

    if (incomeGrowth > 10) score += 30;
    else if (incomeGrowth > 5) score += 20;
    else if (incomeGrowth > 0) score += 10;
    else if (incomeGrowth < -5) score -= 10;

    return Math.min(Math.max(Math.round(score), 0), 100);
  }, [dashboardData]);

  const financialHealthScore = useMemo(
    () => calculateFinancialHealthScore(),
    [calculateFinancialHealthScore]
  );

  const getHealthScoreMeta = (score: number) => {
    if (score > 80)
      return {
        badge: 'Excellent',
        color: 'bg-green-500 text-green-foreground',
        message: 'Your finances are in great shape!'
      };
    if (score > 60)
      return {
        badge: 'Good',
        color: 'bg-yellow-500 text-yellow-foreground',
        message: 'You have a solid financial foundation.'
      };
    if (score > 40)
      return {
        badge: 'Fair',
        color: 'bg-orange-500 text-orange-foreground',
        message: 'Some areas could use improvement.'
      };
    return {
      badge: 'Needs Attention',
      color: 'bg-red-500 text-red-foreground',
      message: 'Focus on improving key financial habits.'
    };
  };
  const healthScoreMeta = getHealthScoreMeta(financialHealthScore);

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

  const renderErrorState = () => {
    useEffect(() => {
      if (combinedError) {
        showError(
          `Dashboard Error: ${(combinedError as Error)?.message || 'Could not load essential data.'}`
        );
      }
    }, [combinedError, showError]);

    return (
      <div className='mx-auto w-full max-w-7xl p-6 lg:p-8'>
        <div className='sticky top-0 z-10 mb-6 flex flex-col gap-4 bg-background/95 pb-3 pt-1 backdrop-blur dark:bg-background/90 sm:flex-row sm:items-center sm:justify-between'>
          <h1 className='text-3xl font-bold'>Dashboard</h1>
          <div className='flex flex-wrap items-center gap-2'>
            <Button variant='outline' size='sm' onClick={refetchAll} disabled={isRefreshing}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Retry
            </Button>
            <Button variant='ghost' size='icon' onClick={toggleDarkMode} className='ml-2'>
              {isDarkMode ? <Sun className='h-4 w-4' /> : <Moon className='h-4 w-4' />}
            </Button>
          </div>
        </div>

        <Alert variant='destructive' className='mt-6'>
          <Frown className='h-4 w-4' />
          <AlertTitle>Oops! Something went wrong.</AlertTitle>
          <AlertDescription>
            We couldn't load your dashboard data. Please check your connection and try refreshing.
            If the problem persists, contact support.
            {combinedError && (
              <div className='mt-2 text-xs text-muted-foreground'>
                Error: {(combinedError as Error).message}
              </div>
            )}
          </AlertDescription>
        </Alert>
      </div>
    );
  };

  const renderNoDataState = () => (
    <div className='mx-auto w-full max-w-7xl space-y-4 p-4 pt-6 md:space-y-6 lg:p-8 lg:pt-8'>
      <div className='sticky top-0 z-10 mb-6 flex flex-col gap-4 bg-background/95 pb-3 pt-1 backdrop-blur dark:bg-background/90 sm:flex-row sm:items-center sm:justify-between'>
        <h1 className='text-3xl font-bold'>Dashboard</h1>
        <div className='flex flex-wrap items-center gap-2'>
          <Button variant='outline' size='sm' onClick={refetchAll} disabled={isRefreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button variant='ghost' size='icon' onClick={toggleDarkMode} className='ml-2'>
            {isDarkMode ? <Sun className='h-4 w-4' /> : <Moon className='h-4 w-4' />}
          </Button>
        </div>
      </div>
      <NoData
        message='Your Dashboard is Ready!'
        icon={LayoutGrid}
        className='h-[calc(100vh-250px)]'
      />
    </div>
  );

  if (isLoading && !isRefreshing) {
    return renderSkeleton();
  }

  if (hasError && !dashboardApiResponse) {
    return renderErrorState();
  }

  if (!isLoading && !hasError && dashboardData.totalTransaction < 2) {
    return renderNoDataState();
  }

  const CardWrapper = ({
    id,
    title,
    description,
    children,
    className = '',
    gridSpanClass = '',
    noPadding = false
  }: {
    id: string;
    title: string;
    description?: string;
    children: React.ReactNode;
    className?: string;
    gridSpanClass?: string;
    noPadding?: boolean;
  }) => {
    const isHidden = hiddenSections.has(id);
    const isExpanded = expandedCard === id;

    if (isHidden && !isExpanded) return null;

    return (
      <Card
        className={`${className} ${isExpanded ? 'col-span-12' : gridSpanClass} ${isHidden ? 'border-dashed opacity-50' : ''} transition-all duration-300`}
      >
        <CardHeader className='flex flex-row items-start justify-between space-y-0 py-3'>
          <div className='flex-1 pr-4'>
            <CardTitle className='text-lg'>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          <div className='flex items-center space-x-1'>
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='h-7 w-7'
                    onClick={() => toggleCardExpansion(id)}
                    disabled={isHidden}
                  >
                    {isExpanded ? (
                      <Minimize2 className='h-4 w-4' />
                    ) : (
                      <Maximize2 className='h-4 w-4' />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isExpanded ? 'Minimize' : 'Maximize'}</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='h-7 w-7'
                    onClick={() => toggleSectionVisibility(id)}
                  >
                    {isHidden ? <Eye className='h-4 w-4' /> : <EyeOff className='h-4 w-4' />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isHidden ? 'Show Section' : 'Hide Section'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardHeader>
        <CardContent className={noPadding ? 'p-0' : ''}>{children}</CardContent>
      </Card>
    );
  };

  return (
    <TooltipProvider>
      <div
        className={`mx-auto w-full max-w-7xl space-y-6 p-4 pt-6 transition-all duration-200 lg:p-8 lg:pt-8 ${compactView ? 'space-y-3' : ''}`}
      >
        <div className='sticky top-0 z-10 flex flex-col gap-4 bg-background/95 pb-3 pt-1 backdrop-blur dark:bg-background/90 sm:flex-row sm:items-center sm:justify-between'>
          <h1 className='text-3xl font-bold'>Dashboard</h1>

          <div className='flex flex-wrap items-center gap-2'>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='outline' size='sm' className='flex items-center gap-2'>
                  <Calendar className='h-4 w-4' />
                  {timeRangeOption === 'custom'
                    ? customDateRange?.from && customDateRange?.to
                      ? `${customDateRange.from.toLocaleDateString()} - ${customDateRange.to.toLocaleDateString()}`
                      : 'Custom Range'
                    : TIME_RANGES.find((r) => r.value === timeRangeOption)?.label || 'Select Range'}
                  <ChevronDown className='h-3 w-3' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                {TIME_RANGES.filter((r) => r.value !== 'custom').map((range) => (
                  <DropdownMenuItem
                    key={range.value}
                    onClick={() => handleTimeRangeChange(range.value)}
                  >
                    {range.label}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DatePickerWithRange
                  trigger={
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      Custom Range...
                    </DropdownMenuItem>
                  }
                  onDateChange={handleCustomDateSelect}
                  initialDate={customDateRange}
                />
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='outline' size='sm' className='flex items-center gap-2'>
                  <LayoutGrid className='h-4 w-4' />
                  {DASHBOARD_PRESETS[currentPreset] || 'Select View'}
                  <ChevronDown className='h-3 w-3' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                {Object.entries(DASHBOARD_PRESETS).map(([key, value]) => (
                  <DropdownMenuItem key={key} onClick={() => changePreset(key)}>
                    {value}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='outline' size='sm' className='flex items-center gap-2'>
                  <SlidersHorizontal className='h-4 w-4' />
                  <span className='hidden sm:inline'>Options</span>
                  <ChevronDown className='h-3 w-3' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end' className='w-56'>
                <DropdownMenuItem onClick={() => alert('Export feature coming soon')}>
                  Export Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.print()}>Print View</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Automatic Refresh</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem onClick={() => handleSetRefreshInterval(0)}>
                      Manual Only {refreshInterval === 0 && '(Active)'}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSetRefreshInterval(5 * 60 * 1000)}>
                      Every 5 Minutes {refreshInterval === 300000 && '(Active)'}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSetRefreshInterval(15 * 60 * 1000)}>
                      Every 15 Minutes {refreshInterval === 900000 && '(Active)'}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSetRefreshInterval(30 * 60 * 1000)}>
                      Every 30 Minutes {refreshInterval === 1800000 && '(Active)'}
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={toggleDarkMode}>
                  <div className='flex w-full items-center justify-between'>
                    <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
                    {isDarkMode ? <Sun className='h-4 w-4' /> : <Moon className='h-4 w-4' />}
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={toggleCompactView}>
                  <div className='flex w-full items-center justify-between'>
                    <span>{compactView ? 'Normal View' : 'Compact View'}</span>
                    {compactView ? (
                      <Maximize2 className='h-4 w-4' />
                    ) : (
                      <Minimize2 className='h-4 w-4' />
                    )}
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant={isRefreshing ? 'outline' : 'default'}
              size='sm'
              onClick={refetchAll}
              disabled={isRefreshing && !isLoading}
              className='min-w-[110px]'
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
            </Button>
          </div>
        </div>

        <Card
          className={`border-l-4 ${healthScoreMeta.color.replace('bg-', 'border-l-').replace('text-.*', '')}`}
        >
          <CardContent className='p-4'>
            <div className='flex flex-col justify-between gap-4 md:flex-row md:items-center'>
              <div>
                <h2 className='mb-1 text-xl font-semibold'>Financial Health Score</h2>
                <p className='text-sm text-muted-foreground'>
                  Overall financial wellness assessment
                </p>
              </div>

              <div className='flex flex-col items-center gap-4 sm:flex-row'>
                <div className='relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-4 border-primary sm:h-24 sm:w-24'>
                  <span className='text-2xl font-bold sm:text-3xl'>{financialHealthScore}</span>
                  <span className='absolute bottom-1 text-[10px] text-muted-foreground sm:bottom-2'>
                    / 100
                  </span>
                </div>

                <div className='text-center sm:text-left'>
                  <Badge className={`mb-1 text-xs ${healthScoreMeta.color}`}>
                    {healthScoreMeta.badge}
                  </Badge>
                  <p className='mb-1 text-sm'>{healthScoreMeta.message}</p>
                  <Button
                    variant='link'
                    size='sm'
                    className='h-auto p-0 text-xs'
                    onClick={() => alert('Show recommendations modal...')}
                  >
                    View Recommendations
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <CardWrapper
          id='financialSnapshot'
          title='Financial Snapshot'
          description='Key metrics overview'
          gridSpanClass='col-span-12'
          noPadding={true}
        >
          <FinancialSnapshot
            data={dashboardData}
            isLoading={isDashboardLoading && !dashboardApiResponse}
          />
        </CardWrapper>

        <div className={`grid grid-cols-12 ${compactView ? 'gap-3' : 'gap-6'}`}>
          <CardWrapper
            id='trendChart'
            title='Financial Trends'
            description={`Income, Expense, Balance (${TIME_RANGES.find((r) => r.value === timeRangeOption)?.label || 'Custom'})`}
            gridSpanClass='col-span-12 lg:col-span-8'
            noPadding={true}
          >
            <div className='absolute right-20 top-[14px] z-10 hidden md:block'>
              <Tabs
                defaultValue={chartType}
                onValueChange={(value: string) => setChartType(value as 'line' | 'bar' | 'area')}
                className=''
              >
                <TabsList className='h-7'>
                  <TabsTrigger value='line' className='px-2 py-1 text-xs'>
                    <LineChart className='h-3 w-3' />
                  </TabsTrigger>
                  <TabsTrigger value='bar' className='px-2 py-1 text-xs'>
                    <BarChart className='h-3 w-3' />
                  </TabsTrigger>
                  <TabsTrigger value='area' className='px-2 py-1 text-xs'>
                    <AreaChart className='h-3 w-3' />
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div className={expandedCard === 'trendChart' ? 'h-[600px]' : 'h-[350px] md:h-[400px]'}>
              <TrendChart
                incomeData={dashboardData.incomeChartData}
                expenseData={dashboardData.expenseChartData}
                balanceData={dashboardData.balanceChartData}
                chartType={chartType}
                isLoading={isDashboardLoading && !dashboardApiResponse}
                expanded={expandedCard === 'trendChart'}
                className='h-full w-full pt-4'
              />
            </div>
          </CardWrapper>

          <CardWrapper
            id='spendingBreakdown'
            title='Spending Breakdown'
            description='Top expense categories'
            gridSpanClass='col-span-12 lg:col-span-4'
            noPadding={true}
          >
            <div
              className={
                expandedCard === 'spendingBreakdown' ? 'h-[600px]' : 'h-[350px] md:h-[400px]'
              }
            >
              <SpendingBreakdown className='h-full w-full' />
            </div>
          </CardWrapper>
        </div>

        <div
          className={`grid grid-cols-1 gap-6 md:grid-cols-2 ${expandedCard ? 'xl:grid-cols-2' : 'xl:grid-cols-4'} ${compactView ? 'gap-3' : ''}`}
        >
          <CardWrapper id='budgetProgress' title='Budget Progress' gridSpanClass='col-span-1'>
            <BudgetProgress />
          </CardWrapper>
          <CardWrapper id='goals' title='Goal Highlights' gridSpanClass='col-span-1'>
            <GoalHighlights data={goalsData} isLoading={isGoalsLoading} />
          </CardWrapper>
          <CardWrapper id='investments' title='Investment Summary' gridSpanClass='col-span-1'>
            <InvestmentSummaryCard />
          </CardWrapper>
          <CardWrapper id='debtSummary' title='Debt Summary' gridSpanClass='col-span-1'>
            <DebtSummaryCard />
          </CardWrapper>
        </div>

        <div className={`grid grid-cols-1 gap-6 md:grid-cols-2 ${compactView ? 'gap-3' : ''}`}>
          <CardWrapper
            id='accounts'
            title='Account Balances'
            gridSpanClass='col-span-1'
            noPadding={true}
          >
            <AccountListSummary
              accountsInfo={dashboardData.accountsInfo}
              accountIdToCurrencyMap={accountIdToCurrencyMap}
              isLoading={isDashboardLoading && !dashboardApiResponse}
            />
          </CardWrapper>
          <CardWrapper id='quickStats' title='Quick Stats' gridSpanClass='col-span-1'>
            <QuickStats
              data={dashboardData}
              isLoading={isDashboardLoading && !dashboardApiResponse}
              className='w-full'
            />
          </CardWrapper>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default DashboardPage;
