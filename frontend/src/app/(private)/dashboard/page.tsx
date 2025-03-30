'use client';

import { useQuery } from '@tanstack/react-query';
import { accountGetDashboard } from '@/lib/endpoints/accounts';
import Loader from '@/components/ui/loader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DashboardData } from '@/lib/types';
import { useToast } from '@/lib/hooks/useToast';
import { formatCurrency } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { format } from 'date-fns';

const chartConfig = {
  income: { label: 'Income', color: 'hsl(142, 76%, 36%)' },
  expense: { label: 'Expense', color: 'hsl(0, 84%, 60%)' },
  balance: { label: 'Balance', color: 'hsl(214, 100%, 49%)' }
};

const DashboardPage = () => {
  const { showError } = useToast();
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: accountGetDashboard,
    retry: false,
    staleTime: 5 * 60 * 1000
  });

  if (isLoading) {
    return <Loader />;
  }

  if (error) {
    showError(`Failed to get Dashboard Details : ${(error as Error).message}`);
    return <div className='p-4 text-red-500'>Error loading dashboard data.</div>;
  }

  const dashboardData: DashboardData = data || {
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
    incomeData: { x: number; y: number }[],
    expenseData: { x: number; y: number }[],
    balanceData: { x: number; y: number }[]
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
        // Add null check for data arrays
        const dateStr = format(new Date(point.x * 1000), 'MMM dd');
        if (!combinedMap.has(dateStr)) {
          combinedMap.set(dateStr, { date: dateStr });
        }
        combinedMap.get(dateStr)![key] = point.y;
      });
    };

    processData(incomeData, 'income');
    processData(expenseData, 'expense');
    processData(balanceData, 'balance');

    return Array.from(combinedMap.values()).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  };

  const renderChangeIndicator = (change: number | undefined) => {
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

  const formatYAxis = (value: number) => formatCurrency(value);

  return (
    <div className='space-y-6 p-4 md:p-6'>
      <h1 className='text-2xl font-bold md:text-3xl'>Dashboard</h1>

      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Total Income</CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-2xl font-bold'>{formatCurrency(dashboardData.overallIncome)}</p>
            <div className='mt-1 flex items-center text-xs text-muted-foreground'>
              {renderChangeIndicator(dashboardData.overallIncomeChange)}
              <span className='ml-1'>from last period</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Total Expense</CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-2xl font-bold'>{formatCurrency(dashboardData.overallExpense)}</p>
            <div className='mt-1 flex items-center text-xs text-muted-foreground'>
              {renderChangeIndicator(dashboardData.overallExpenseChange)}
              <span className='ml-1'>from last period</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Net Balance</CardTitle>
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
            <p className='mt-1 text-xs text-muted-foreground'>In selected period</p>
          </CardContent>
        </Card>
      </div>

      <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
        <Card className='lg:col-span-2'>
          <CardHeader>
            <CardTitle>Income & Expense Trend</CardTitle>
            <CardDescription>Daily income and expense over the period</CardDescription>
          </CardHeader>
          <CardContent className='pl-2'>
            {combinedChartData.length > 0 ? (
              <ResponsiveContainer width='100%' height={300}>
                <BarChart
                  data={combinedChartData}
                  margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray='3 3' vertical={false} />
                  <XAxis dataKey='date' fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis
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
                    dataKey='income'
                    name='Income'
                    fill={chartConfig.income.color}
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey='expense'
                    name='Expense'
                    fill={chartConfig.expense.color}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className='py-10 text-center text-sm text-muted-foreground'>
                No income/expense data for chart.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className='lg:col-span-2'>
          <CardHeader>
            <CardTitle>Balance Trend</CardTitle>
            <CardDescription>Daily balance over the period</CardDescription>
          </CardHeader>
          <CardContent className='pl-2'>
            {combinedChartData.length > 0 ? (
              <ResponsiveContainer width='100%' height={300}>
                <LineChart
                  data={combinedChartData}
                  margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray='3 3' vertical={false} />
                  <XAxis dataKey='date' fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis
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
                    formatter={(value: number) => [formatCurrency(value), 'Balance']}
                  />
                  <Line
                    type='monotone'
                    dataKey='balance'
                    stroke={chartConfig.balance.color}
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className='py-10 text-center text-sm text-muted-foreground'>
                No balance data for chart.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
        <Card>
          <CardHeader>
            <CardTitle>Account Overview</CardTitle>
            <CardDescription>Summary of your accounts</CardDescription>
          </CardHeader>
          <CardContent>
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
              <p className='text-sm text-muted-foreground'>
                {' '}
                No accounts found. Add one to get started!
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
            <CardDescription>Key transaction figures</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className='space-y-2 text-sm'>
              <li className='flex justify-between'>
                <span>Highest Income:</span>
                <span className='font-medium text-green-600'>
                  {formatCurrency(dashboardData.mostExpensiveIncome ?? 0)}
                </span>
              </li>
              <li className='flex justify-between'>
                <span>Lowest Income:</span>
                <span className='font-medium text-green-500'>
                  {formatCurrency(dashboardData.cheapestIncome ?? 0)}
                </span>
              </li>
              <li className='flex justify-between'>
                <span>Highest Expense:</span>
                <span className='font-medium text-red-600'>
                  {formatCurrency(dashboardData.mostExpensiveExpense ?? 0)}
                </span>
              </li>
              <li className='flex justify-between'>
                <span>Lowest Expense:</span>
                <span className='font-medium text-red-500'>
                  {formatCurrency(dashboardData.cheapestExpense ?? 0)}
                </span>
              </li>
              {dashboardData?.transactionsCountByAccount &&
                Object.keys(dashboardData.transactionsCountByAccount).length > 0 && (
                  <li className='pt-2'>
                    <p className='font-medium'>Transactions per Account:</p>
                    <ul className='ml-4 list-disc space-y-1 text-xs text-muted-foreground'>
                      {Object.entries(dashboardData.transactionsCountByAccount).map(
                        ([accountName, count]: [string, number]) => (
                          <li key={accountName}>
                            {accountName}: {count}
                          </li>
                        )
                      )}
                    </ul>
                  </li>
                )}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
export default DashboardPage;
