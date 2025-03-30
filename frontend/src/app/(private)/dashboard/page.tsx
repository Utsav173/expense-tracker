'use client';

import { useQuery } from '@tanstack/react-query';
import { accountGetDashboard } from '@/lib/endpoints/accounts';
import { goalGetAll } from '@/lib/endpoints/goal';
import Loader from '@/components/ui/loader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DashboardData, SavingGoal, ApiResponse } from '@/lib/types';
import { useToast } from '@/lib/hooks/useToast';
import { formatCurrency } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { format } from 'date-fns';
import { BudgetProgress } from '@/components/dashboard/budget-progress';
import { GoalProgress } from '@/components/dashboard/goal-progress';
import { InvestmentSummaryCard } from '@/components/dashboard/investment-summary-card';
import { DebtSummaryCard } from '@/components/dashboard/debt-summary-card';
import NoData from '@/components/ui/no-data';
import React from 'react';

const chartConfig = {
  income: { label: 'Income', color: 'hsl(142, 76%, 36%)' },
  expense: { label: 'Expense', color: 'hsl(0, 84%, 60%)' },
  balance: { label: 'Balance', color: 'hsl(214, 100%, 49%)' }
};

const DashboardPage = () => {
  const { showError } = useToast();

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

  const isLoading = isDashboardLoading || isGoalsLoading;

  if (isLoading && !dashboardApiData) {
    return <Loader />;
  }

  if (dashboardError) showError(`Dashboard Error: ${(dashboardError as Error).message}`);
  if (goalsError) showError(`Goals Error: ${(goalsError as Error).message}`);

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

  const formatCombinedChartData = (
    incomeData: { x: number; y: number }[] = [],
    expenseData: { x: number; y: number }[] = [],
    balanceData: { x: number; y: number }[] = []
  ) => {
    const combinedMap = new Map<
      string,
      { date: string; income?: number; expense?: number; balance?: number }
    >();
    const processData = (
      data: { x: number; y: number }[],
      key: 'income' | 'expense' | 'balance'
    ) => {
      (data || []).forEach((point) => {
        const date = new Date(point.x * 1000);
        if (isNaN(date.getTime())) return;
        const dateStr = format(date, 'MMM dd');
        if (!combinedMap.has(dateStr)) combinedMap.set(dateStr, { date: dateStr });
        combinedMap.get(dateStr)![key] = point.y;
      });
    };
    processData(incomeData, 'income');
    processData(expenseData, 'expense');
    processData(balanceData, 'balance');
    return Array.from(combinedMap.values()).sort(
      (a, b) =>
        new Date(`2000-${a.date.replace(' ', '-')}`).getTime() -
        new Date(`2000-${b.date.replace(' ', '-')}`).getTime()
    );
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

  const combinedChartData = formatCombinedChartData(
    dashboardData.incomeChartData,
    dashboardData.expenseChartData,
    dashboardData.balanceChartData
  );

  const formatYAxis = (value: number) => formatCurrency(value, 'INR');

  return (
    <div className='space-y-6 p-4 md:p-6'>
      <div className='flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center'>
        <h1 className='text-2xl font-bold md:text-3xl'>Dashboard</h1>
      </div>

      {isLoading && !dashboardApiData ? (
        <Loader />
      ) : (
        <>
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
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

          <div className='grid grid-cols-1 gap-6 lg:grid-cols-1'>
            <Card className='lg:col-span-1'>
              <CardHeader>
                <CardTitle>Income, Expense & Balance Trend</CardTitle>
                <CardDescription>Daily activity overview (all time)</CardDescription>
              </CardHeader>
              <CardContent className='pl-2'>
                {combinedChartData.length > 0 ? (
                  <ResponsiveContainer width='100%' height={350}>
                    <ComposedChart
                      data={combinedChartData}
                      margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray='3 3' vertical={false} />
                      <XAxis dataKey='date' fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis
                        yAxisId='left'
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={formatYAxis}
                      />
                      <YAxis
                        yAxisId='right'
                        orientation='right'
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={formatYAxis}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                          fontSize: '12px'
                        }}
                        formatter={(value: number, name: string) => [formatCurrency(value), name]}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Bar
                        yAxisId='left'
                        dataKey='income'
                        name='Income'
                        fill={chartConfig.income.color}
                        radius={[4, 4, 0, 0]}
                        barSize={15}
                      />
                      <Bar
                        yAxisId='left'
                        dataKey='expense'
                        name='Expense'
                        fill={chartConfig.expense.color}
                        radius={[4, 4, 0, 0]}
                        barSize={15}
                      />
                      <Line
                        yAxisId='right'
                        type='monotone'
                        dataKey='balance'
                        name='Balance'
                        stroke={chartConfig.balance.color}
                        strokeWidth={2}
                        dot={false}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                ) : (
                  <div className='flex h-[350px] items-center justify-center'>
                    <NoData message='No transaction data available for chart.' />
                  </div>
                )}
              </CardContent>
            </Card>
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
                  <ul className='space-y-3'>
                    {dashboardData.accountsInfo.map((accountInfo: any) => (
                      <li key={accountInfo.id} className='flex justify-between text-sm'>
                        <span>{accountInfo.name}</span>
                        <span className='font-medium'>
                          {formatCurrency(accountInfo.balance, accountInfo.currency)}
                        </span>
                      </li>
                    ))}
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
                    {formatCurrency(dashboardData.mostExpensiveIncome ?? 0)}
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span>Lowest Income:</span>{' '}
                  <span className='font-medium text-green-500'>
                    {formatCurrency(dashboardData.cheapestIncome ?? 0)}
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span>Highest Expense:</span>{' '}
                  <span className='font-medium text-red-600'>
                    {formatCurrency(dashboardData.mostExpensiveExpense ?? 0)}
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span>Lowest Expense:</span>{' '}
                  <span className='font-medium text-red-500'>
                    {formatCurrency(dashboardData.cheapestExpense ?? 0)}
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
