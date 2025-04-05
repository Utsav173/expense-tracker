'use client';

import { useQuery } from '@tanstack/react-query';
import { accountGetDashboard, accountGetDropdown } from '@/lib/endpoints/accounts';
import { goalGetAll } from '@/lib/endpoints/goal';
import Loader from '@/components/ui/loader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DashboardData, SavingGoal, ApiResponse, AccountDropdown } from '@/lib/types';
import { useToast } from '@/lib/hooks/useToast';
import { formatCurrency } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { BudgetProgress } from '@/components/dashboard/budget-progress';
import { GoalProgress } from '@/components/dashboard/goal-progress';
import { InvestmentSummaryCard } from '@/components/dashboard/investment-summary-card';
import { DebtSummaryCard } from '@/components/dashboard/debt-summary-card';
import TrendChart from '@/components/dashboard/trend-chart';
import NoData from '@/components/ui/no-data';
import React, { useMemo } from 'react'; // Removed useState

const DashboardPage = () => {
  const { showError } = useToast();
  // Removed dateRange state

  const {
    data: dashboardApiData,
    isLoading: isDashboardLoading,
    error: dashboardError
  } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => accountGetDashboard(),
    retry: false,
    staleTime: 5 * 60 * 1000
  });

  const {
    data: goalsData,
    isLoading: isGoalsLoading,
    error: goalsError
  } = useQuery<ApiResponse<{ data: SavingGoal[] }>>({
    queryKey: ['goalsDashboard'],
    queryFn: () => goalGetAll({ limit: 100 }),
    retry: false,
    staleTime: 15 * 60 * 1000
  });

  const {
    data: accountsDropdownData,
    isLoading: isAccountsDropdownLoading,
    error: accountsDropdownError
  } = useQuery<ApiResponse<AccountDropdown[]>>({
    queryKey: ['accountsDropdownDashboard'],
    queryFn: () => accountGetDropdown(),
    retry: false,
    staleTime: 15 * 60 * 1000
  });

  const accountIdToCurrencyMap = useMemo(() => {
    const map = new Map<string, string>();
    (accountsDropdownData || []).forEach((acc) => {
      map.set(acc.id, acc.currency);
    });
    return map;
  }, [accountsDropdownData]);

  const isLoading = isDashboardLoading || isGoalsLoading || isAccountsDropdownLoading;

  if (isLoading && !dashboardApiData && !accountsDropdownData) {
    return <Loader />;
  }

  if (dashboardError) showError(`Dashboard Error: ${(dashboardError as Error).message}`);
  if (goalsError) showError(`Goals Error: ${(goalsError as Error).message}`);
  if (accountsDropdownError)
    showError(`Accounts Dropdown Error: ${(accountsDropdownError as Error).message}`);

  const dashboardData: DashboardData = dashboardApiData || {
    accountsInfo: [],
    transactionsCountByAccount: {},
    totalTransaction: 0,
    mostExpensiveExpense: 0,
    cheapestExpense: 0,
    mostExpensiveIncome: 0,
    cheapestIncome: 0,
    incomeChartData: [],
    expenseChartData: [],
    balanceChartData: [],
    overallIncome: 0,
    overallExpense: 0,
    overallBalance: 0,
    overallIncomeChange: 0,
    overallExpenseChange: 0
  };

  const renderChangeIndicator = (change: number | undefined | null) => {
    if (change === undefined || change === null || isNaN(change)) return null;
    const isPositive = change > 0;
    const isNegative = change < 0;
    const Icon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;
    const colorClass = isPositive
      ? 'text-green-500'
      : isNegative
        ? 'text-red-500'
        : 'text-gray-500';
    return (
      <span className={`flex items-center text-xs ${colorClass}`}>
        <Icon className='mr-1 h-3 w-3' />
        {change.toFixed(2)}%
      </span>
    );
  };

  return (
    <div className='mx-auto w-full max-w-7xl space-y-4 p-3 pt-4 md:space-y-6'>
      <div className='flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center'>
        <h1 className='text-2xl font-bold md:text-3xl'>Dashboard</h1>
      </div>

      {isLoading && !dashboardApiData ? (
        <Loader />
      ) : dashboardData.totalTransaction < 4 ? (
        <Card>
          <CardHeader>
            <CardTitle>Insufficient Data</CardTitle>
          </CardHeader>
          <CardContent>
            <p>You do not have enough data to visualize dashboard...</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
            {/* Summary Cards remain the same */}
            <Card>
              <CardHeader className='pb-2'>
                <CardTitle className='text-sm font-medium'>Overall Income</CardTitle>
              </CardHeader>
              <CardContent>
                <p className='text-2xl font-bold'>{formatCurrency(dashboardData.overallIncome)}</p>
                <div className='mt-1 flex items-center text-xs text-muted-foreground'>
                  {renderChangeIndicator(dashboardData.overallIncomeChange)}
                  <span className='ml-1'>avg. change</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='pb-2'>
                <CardTitle className='text-sm font-medium'>Overall Expense</CardTitle>
              </CardHeader>
              <CardContent>
                <p className='text-2xl font-bold'>{formatCurrency(dashboardData.overallExpense)}</p>
                <div className='mt-1 flex items-center text-xs text-muted-foreground'>
                  {renderChangeIndicator(dashboardData.overallExpenseChange)}
                  <span className='ml-1'>avg. change</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='pb-2'>
                <CardTitle className='text-sm font-medium'>Overall Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <p className='text-2xl font-bold'>{formatCurrency(dashboardData.overallBalance)}</p>
                <p className='mt-1 text-xs text-muted-foreground'>Across all accounts</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='pb-2'>
                <CardTitle className='text-sm font-medium'>Total Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className='text-2xl font-bold'>{dashboardData.totalTransaction}</p>
                <p className='mt-1 text-xs text-muted-foreground'>All time</p>
              </CardContent>
            </Card>
          </div>

          {/* Render the new TrendChart component */}
          <div className='grid grid-cols-1 gap-6 lg:grid-cols-1'>
            <TrendChart
              incomeData={dashboardData.incomeChartData}
              expenseData={dashboardData.expenseChartData}
              balanceData={dashboardData.balanceChartData}
            />
          </div>

          <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
            <BudgetProgress />
            <GoalProgress data={goalsData?.data || undefined} isLoading={isGoalsLoading} />
            <InvestmentSummaryCard />
            <DebtSummaryCard />
            <Card>
              <CardHeader>
                <CardTitle>Account Overview</CardTitle>
                <CardDescription>Current balance summary</CardDescription>
              </CardHeader>
              <CardContent className='scrollbar h-[250px] overflow-y-auto'>
                {dashboardData.accountsInfo.length ? (
                  <ul className='space-y-4'>
                    {dashboardData.accountsInfo.map((accountInfo: any) => {
                      const currency = accountIdToCurrencyMap.get(accountInfo.id) || 'INR';
                      return (
                        <li key={accountInfo.id} className='text-sm'>
                          <div className='mb-1 flex justify-between'>
                            <span className='font-semibold'>{accountInfo.name}</span>
                            <span className='font-bold'>
                              {formatCurrency(accountInfo.balance, currency)}
                            </span>
                          </div>
                          <div className='flex justify-between text-xs text-muted-foreground'>
                            <span>
                              Income:{' '}
                              <span className='text-green-600'>
                                {formatCurrency(accountInfo.income ?? 0, currency)}
                              </span>
                            </span>
                            <span>
                              Expense:{' '}
                              <span className='text-red-600'>
                                {formatCurrency(accountInfo.expense ?? 0, currency)}
                              </span>
                            </span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <NoData message='No accounts found. Add one!' icon='inbox' />
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats & Counts</CardTitle>
                <CardDescription>Key figures and counts</CardDescription>
              </CardHeader>
              <CardContent className='scrollbar h-[250px] space-y-3 overflow-y-auto text-sm'>
                <div className='flex justify-between'>
                  <span>Highest Income:</span>{' '}
                  <span className='font-medium text-green-600'>
                    {dashboardData.mostExpensiveIncome
                      ? formatCurrency(dashboardData.mostExpensiveIncome)
                      : 'N/A'}
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span>Lowest Income:</span>{' '}
                  <span className='font-medium text-green-500'>
                    {dashboardData.cheapestIncome
                      ? formatCurrency(dashboardData.cheapestIncome)
                      : 'N/A'}
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span>Highest Expense:</span>{' '}
                  <span className='font-medium text-red-600'>
                    {dashboardData.mostExpensiveExpense
                      ? formatCurrency(dashboardData.mostExpensiveExpense)
                      : 'N/A'}
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span>Lowest Expense:</span>{' '}
                  <span className='font-medium text-red-500'>
                    {dashboardData.cheapestExpense
                      ? formatCurrency(dashboardData.cheapestExpense)
                      : 'N/A'}
                  </span>
                </div>
                {dashboardData?.transactionsCountByAccount &&
                  Object.keys(dashboardData.transactionsCountByAccount).length > 0 && (
                    <div className='pt-2'>
                      <p className='mb-1 font-medium'>Transactions per Account:</p>
                      <ul className='space-y-1 text-xs text-muted-foreground'>
                        {Object.entries(dashboardData.transactionsCountByAccount).map(
                          ([accountName, count]) => (
                            <li key={accountName} className='flex justify-between'>
                              <span>{accountName}:</span>
                              <span>{count}</span>
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};
export default DashboardPage;
