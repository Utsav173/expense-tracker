'use client';

import { useQuery } from '@tanstack/react-query';
import { accountGetDashboard } from '@/lib/endpoints/accounts';
import Loader from '@/components/ui/loader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardData } from '@/lib/types';
import { useToast } from '@/lib/hooks/useToast';

const DashboardPage = () => {
  const { showError } = useToast();
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: accountGetDashboard,
    retry: false
  });

  if (isLoading) {
    return <Loader />;
  }

  if (error) {
    showError(`Failed to get Dashboard Details : ${(error as Error).message}`);
    return null;
  }

  const dashboardData: DashboardData = data || {
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
  };
  return (
    <div className='space-y-4 p-4'>
      <h1 className='text-2xl font-bold'>Dashboard</h1>

      {/* Summary Cards */}
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader>
            <CardTitle>Total Income</CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-2xl font-bold'>{dashboardData.overallIncome.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Expense</CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-2xl font-bold'>{dashboardData.overallExpense.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Balance</CardTitle>
          </CardHeader>
          <CardContent>
            {' '}
            <p className='text-2xl font-bold'>{dashboardData.overallBalance.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            {' '}
            <CardTitle>Total Transaction</CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-2xl font-bold'>{dashboardData.totalTransaction}</p>{' '}
          </CardContent>
        </Card>
      </div>

      {/*  Placeholders for Charts (Replace with actual charts) */}
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
        <Card>
          <CardHeader>
            <CardTitle>InCome Chart</CardTitle>
          </CardHeader>
          <CardContent>Placeholder for Income Chart</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Expenses Chart</CardTitle>
          </CardHeader>
          <CardContent>Placeholder for Expense Chart</CardContent>
        </Card>
      </div>
      <div>
        <Card>
          <CardHeader>
            <CardTitle>Balance Chart</CardTitle>
          </CardHeader>
          <CardContent> Placeholder for Balance Chart</CardContent>
        </Card>
      </div>

      {/* Top Accounts/recent (optional now, useful later)  */}
      <Card>
        <CardHeader>
          <CardTitle>Account Overview</CardTitle>
        </CardHeader>
        <CardContent>
          {dashboardData.accountsInfo.length ? (
            <ul>
              {dashboardData.accountsInfo.map((accountInfo: any) => (
                <li key={accountInfo.id}>
                  {accountInfo.name} - Balance: {accountInfo.balance} - Income:{' '}
                  {accountInfo?.income} - Expense {accountInfo.expense}
                </li>
              ))}
            </ul>
          ) : (
            <p> No account. Add New account</p>
          )}
        </CardContent>
      </Card>
      <div>
        <Card>
          <CardHeader>
            <CardTitle>Transaction Summary </CardTitle>{' '}
          </CardHeader>
          <CardContent>
            <ul>
              {dashboardData?.transactionsCountByAccount &&
                Object.entries(dashboardData.transactionsCountByAccount).map(
                  ([accountName, count]: any) => (
                    <li key={accountName}>
                      {accountName} : {count}
                    </li>
                  )
                )}
              <li> mostExpensiveExpense : {dashboardData.mostExpensiveExpense}</li>
              <li> cheapestExpense : {dashboardData.cheapestExpense}</li>
              <li> mostExpensiveIncome : {dashboardData.mostExpensiveIncome}</li>
              <li> cheapestIncome: {dashboardData.cheapestIncome}</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
export default DashboardPage;
