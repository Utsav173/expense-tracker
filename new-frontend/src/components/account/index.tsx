import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Trash2, TrendingDown, TrendingUp, Pencil, AlertCircle } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis
} from 'recharts';
import { ApiResponse, AccountDetails, CustomAnalytics, ChartDataType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import DeleteConfirmationModal from '../modals/delete-confirmation-modal';
import { accountDelete } from '@/lib/endpoints/accounts';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { ChartLegend, ChartTooltip } from '../ui/chart';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

interface AccountHeaderProps {
  account: ApiResponse<AccountDetails> | undefined;
  isLoading: boolean;
  router: {
    back: () => void;
  };
  id: string;
}

interface AnalyticsCardsProps {
  analytics: ApiResponse<CustomAnalytics> | undefined;
  isLoading: boolean;
}

interface IncomeExpenseChartProps {
  data: ChartDataType[];
  isLoading: boolean;
}

interface AnalyticsCardData {
  title: string;
  value: number;
  change?: number;
  currency?: string;
  inverse?: boolean;
  isPercentage?: boolean;
}

// Header Component
export const AccountHeader: React.FC<AccountHeaderProps> = ({ account, isLoading, router }) => {
  if (isLoading) {
    return (
      <div className='sticky top-0 z-10 border-b bg-white'>
        <div className='container flex h-16 items-center justify-between'>
          <div className='flex items-center gap-4'>
            <div className='h-8 w-24 animate-pulse rounded bg-gray-200' />
          </div>
          <div className='h-8 w-32 animate-pulse rounded bg-gray-200' />
        </div>
      </div>
    );
  }

  return (
    <div className='sticky top-0 z-10 border-b bg-white'>
      <div className='container flex h-16 items-center justify-between'>
        <div className='flex items-center gap-4'>
          <button
            onClick={() => router.back()}
            className='inline-flex h-9 items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
          >
            <ArrowLeft className='mr-2 h-4 w-4' />
            Back
          </button>
          <h1 className='text-xl font-semibold'>{account?.name}</h1>
          <DeleteConfirmationModal
            title='Delete Account'
            description='Are you sure you want to delete this account? All related transactions will also be deleted.'
            triggerButton={
              <Button size='sm' variant='ghost'>
                <Trash2 size={18} />
              </Button>
            }
            onConfirm={async () => {
              if (account?.id) {
                await accountDelete(account.id);
                router.back();
              }
            }}
          />
        </div>
        <div className='text-lg font-medium text-green-600'>
          {new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: account?.currency || 'INR'
          }).format(account?.balance || 0)}
        </div>
      </div>
    </div>
  );
};

// Analytics Cards Component
export const AnalyticsCards: React.FC<AnalyticsCardsProps> = ({ analytics, isLoading }) => {
  if (isLoading) {
    return (
      <div className='grid gap-4 md:grid-cols-3'>
        {[1, 2, 3].map((i) => (
          <Card key={i} className='animate-pulse'>
            <CardHeader>
              <div className='h-4 w-24 rounded bg-gray-200' />
            </CardHeader>
            <CardContent>
              <div className='h-8 w-32 rounded bg-gray-200' />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards: AnalyticsCardData[] = [
    {
      title: 'Income',
      value: analytics?.income || 0,
      change: analytics?.IncomePercentageChange || 0,
      currency: 'INR'
    },
    {
      title: 'Expense',
      value: analytics?.expense || 0,
      change: analytics?.ExpensePercentageChange || 0,
      currency: 'INR',
      inverse: true
    },
    {
      title: 'Balance Change',
      value: analytics?.BalancePercentageChange || 0,
      isPercentage: true
    }
  ];

  const formatValue = (card: AnalyticsCardData): string => {
    if (card.isPercentage) {
      return `${card.value > 0 ? '+' : ''}${card.value.toFixed(2)}%`;
    }
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: card.currency
    }).format(card.value);
  };

  return (
    <div className='grid gap-4 md:grid-cols-3'>
      {cards.map((card, i) => (
        <Card key={i}>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>{card.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{formatValue(card)}</div>
            {card.change !== undefined && (
              <div className='mt-2 flex items-center space-x-2'>
                {card.change > 0 ? (
                  <TrendingUp
                    className={`h-4 w-4 ${card.inverse ? 'text-red-500' : 'text-green-500'}`}
                  />
                ) : (
                  <TrendingDown
                    className={`h-4 w-4 ${card.inverse ? 'text-green-500' : 'text-red-500'}`}
                  />
                )}
                <p
                  className={`text-xs ${
                    (card.inverse ? card.change < 0 : card.change > 0)
                      ? 'text-green-500'
                      : 'text-red-500'
                  }`}
                >
                  {card.change.toFixed(2)}% from last period
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// Chart Component
interface IncomeExpenseChartProps {
  data: Array<{
    date: string;
    income: number;
    expense: number;
    balance: number;
  }>;
  isLoading: boolean;
}

export const IncomeExpenseChart: React.FC<IncomeExpenseChartProps> = ({ data, isLoading }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className='h-6 w-40 animate-pulse rounded bg-gray-200' />
        </CardHeader>
        <CardContent>
          <div className='h-[350px] animate-pulse rounded bg-gray-200' />
        </CardContent>
      </Card>
    );
  }

  // Check if we have no data to display
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Income vs Expense vs Balance Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className='h-4 w-4' />
            <AlertTitle>No Data Available</AlertTitle>
            <AlertDescription>
              There is no financial data available for the selected period.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Income vs Expense vs Balance Trend</CardTitle>
        <CardDescription>Tracking your financial trends over time</CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue='bar' className='w-full'>
          <TabsList className='mb-4'>
            <TabsTrigger value='bar'>Bar Chart</TabsTrigger>
            <TabsTrigger value='line'>Line Chart</TabsTrigger>
          </TabsList>

          <TabsContent value='bar' className='h-[350px]'>
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis dataKey='date' />
                <YAxis />
                <ChartTooltip
                  formatter={(value: number) => formatCurrency(value)}
                  labelFormatter={(label: any) => `Date: ${label}`}
                />
                <ChartLegend />
                <Bar dataKey='income' name='Income' fill='rgb(34, 197, 94)' radius={[4, 4, 0, 0]} />
                <Bar
                  dataKey='expense'
                  name='Expense'
                  fill='rgb(239, 68, 68)'
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey='balance'
                  name='Balance'
                  fill='rgb(59, 130, 246)'
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value='line' className='h-[350px]'>
            <ResponsiveContainer width='100%' height='100%'>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis dataKey='date' />
                <YAxis />
                <ChartTooltip
                  formatter={(value: number) => formatCurrency(value)}
                  labelFormatter={(label: any) => `Date: ${label}`}
                />
                <ChartLegend />
                <Line
                  type='monotone'
                  dataKey='income'
                  name='Income'
                  stroke='rgb(34, 197, 94)'
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type='monotone'
                  dataKey='expense'
                  name='Expense'
                  stroke='rgb(239, 68, 68)'
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type='monotone'
                  dataKey='balance'
                  name='Balance'
                  stroke='rgb(59, 130, 246)'
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
export default {
  AccountHeader,
  AnalyticsCards,
  IncomeExpenseChart
};
