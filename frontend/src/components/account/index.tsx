import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { BarChart2, LineChart, TrendingDown, TrendingUp } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend
} from 'recharts';
import { ApiResponse, AccountDetails } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '@/components/ui/badge';

interface AnalyticsCardsProps {
  analytics: ApiResponse<CustomAnalytics> | undefined;
  isLoading: boolean;
  account: ApiResponse<AccountDetails> | undefined;
}

interface AnalyticsCardData {
  title: string;
  value: number;
  change?: number;
  currency?: string;
  inverse?: boolean;
  isPercentage?: boolean;
  totalBalance?: number | null;
}

// Analytics Cards Component
export const AnalyticsCards: React.FC<AnalyticsCardsProps> = ({
  analytics,
  isLoading,
  account
}) => {
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
      currency: account?.currency || 'INR'
    },
    {
      title: 'Expense',
      value: analytics?.expense || 0,
      change: analytics?.ExpensePercentageChange || 0,
      currency: account?.currency || 'INR',
      inverse: true
    },
    {
      title: 'Balance Change',
      value: analytics?.balance || 0,
      change: analytics?.BalancePercentageChange || 0,
      currency: account?.currency || 'INR',
      totalBalance: account?.balance
    }
  ];

  const formatValue = (card: AnalyticsCardData): string => {
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
            <div className='flex items-center gap-0 text-2xl font-bold'>
              {formatValue(card)}
              {card.totalBalance !== undefined && (
                <p className='ml-2 text-xs text-muted-foreground'>
                  Total Balance:{' '}
                  {new Intl.NumberFormat('en-IN', {
                    style: 'currency',
                    currency: card.currency
                  }).format(card.totalBalance as number)}
                </p>
              )}
            </div>
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

// Define chart config for styling
const chartConfig = {
  income: {
    label: 'Income',
    color: 'hsl(142, 76%, 36%)'
  },
  expense: {
    label: 'Expense',
    color: 'hsl(0, 84%, 60%)'
  },
  balance: {
    label: 'Balance',
    color: 'hsl(214, 100%, 49%)'
  }
};

export interface CustomAnalytics {
  income: number;
  expense: number;
  balance: number;
  BalancePercentageChange: number;
  IncomePercentageChange: number;
  ExpensePercentageChange: number;
}

interface IncomeExpenseChartProps {
  data: Array<{
    date: string;
    income: number;
    expense: number;
    balance: number;
  }>;
  isLoading?: boolean;
  customAnalytics?: CustomAnalytics;
  currency: string;
}

export const IncomeExpenseChart: React.FC<IncomeExpenseChartProps> = ({
  data,
  isLoading,
  currency
}) => {
  const [showCharts, setShowCharts] = useState(true);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    const formattedValue = Math.abs(value).toFixed(1);
    return `${value >= 0 ? '+' : '-'}${formattedValue}%`;
  };

  // Use the latest data point if customAnalytics is not provided
  const latestData = data[data.length - 1];

  if (isLoading) {
    return (
      <Card className='border border-border/40 shadow-sm'>
        <CardHeader className='pb-4'>
          <div className='h-6 w-48 animate-pulse rounded-md bg-muted' />
          <div className='h-4 w-72 animate-pulse rounded-md bg-muted opacity-70' />
        </CardHeader>
        <CardContent>
          <div className='h-[350px] animate-pulse rounded-md bg-muted' />
        </CardContent>
        <CardFooter className='border-t border-border/40 bg-muted/5 pt-4'>
          <div className='flex w-full justify-between'>
            <div className='h-5 w-24 animate-pulse rounded-md bg-muted' />
            <div className='h-5 w-24 animate-pulse rounded-md bg-muted' />
          </div>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className='overflow-hidden border border-border/40 shadow-sm transition-all duration-200'>
      {!showCharts ? (
        <div className='flex h-16 w-full items-center justify-center px-4'>
          <Button
            className='flex items-center gap-2 font-medium'
            onClick={() => setShowCharts(true)}
          >
            <BarChart2 className='h-4 w-4' />
            <span>Show Financial Trends</span>
          </Button>
        </div>
      ) : (
        <>
          <CardHeader className='pb-2'>
            <div className='flex items-center justify-between'>
              <div>
                <CardTitle className='text-xl font-semibold tracking-tight'>
                  Financial Trends
                </CardTitle>
                <CardDescription className='mt-1 text-muted-foreground'>
                  Income vs. Expense trends over time
                </CardDescription>
              </div>
              <Button
                variant='ghost'
                size='icon'
                className='h-8 w-8'
                onClick={() => setShowCharts(false)}
              >
                ×
              </Button>
            </div>
          </CardHeader>

          <CardContent className='px-2 pb-0 pt-0'>
            <Tabs defaultValue='bar' className='w-full'>
              <div className='flex items-center justify-between px-4'>
                <div className='flex gap-2'>
                  <Badge variant='outline' className='bg-background/80 font-normal'>
                    Last update: {latestData?.date}
                  </Badge>
                </div>
                <TabsList className='grid w-[180px] grid-cols-2'>
                  <TabsTrigger value='bar' className='flex items-center gap-1'>
                    <BarChart2 className='h-3.5 w-3.5' />
                    <span>Bar</span>
                  </TabsTrigger>
                  <TabsTrigger value='line' className='flex items-center gap-1'>
                    <LineChart className='h-3.5 w-3.5' />
                    <span>Line</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value='bar' className='mt-2'>
                <div className='h-[320px] px-1'>
                  <ResponsiveContainer width='100%' height='100%'>
                    <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                      <defs>
                        <linearGradient id='incomeGradient' x1='0' y1='0' x2='0' y2='1'>
                          <stop
                            offset='5%'
                            stopColor={chartConfig.income.color}
                            stopOpacity={0.8}
                          />
                          <stop
                            offset='95%'
                            stopColor={chartConfig.income.color}
                            stopOpacity={0.4}
                          />
                        </linearGradient>
                        <linearGradient id='expenseGradient' x1='0' y1='0' x2='0' y2='1'>
                          <stop
                            offset='5%'
                            stopColor={chartConfig.expense.color}
                            stopOpacity={0.8}
                          />
                          <stop
                            offset='95%'
                            stopColor={chartConfig.expense.color}
                            stopOpacity={0.4}
                          />
                        </linearGradient>
                        <linearGradient id='balanceGradient' x1='0' y1='0' x2='0' y2='1'>
                          <stop
                            offset='5%'
                            stopColor={chartConfig.balance.color}
                            stopOpacity={0.8}
                          />
                          <stop
                            offset='95%'
                            stopColor={chartConfig.balance.color}
                            stopOpacity={0.4}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray='3 3'
                        vertical={false}
                        stroke='hsl(var(--border)/0.5)'
                      />
                      <XAxis
                        dataKey='date'
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        axisLine={{ stroke: 'hsl(var(--border))' }}
                      />
                      <YAxis
                        tickFormatter={(value) => `$${value / 1000}k`}
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        axisLine={{ stroke: 'hsl(var(--border))' }}
                      />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className='rounded-lg border border-border/40 bg-background/95 p-3 shadow-md backdrop-blur-sm'>
                                <p className='mb-1 font-medium'>{label}</p>
                                {payload.map((entry, index) => (
                                  <div
                                    key={`tooltip-item-${index}`}
                                    className='flex items-center gap-2 py-0.5'
                                  >
                                    <div
                                      className='h-2 w-2 rounded-full'
                                      style={{ backgroundColor: entry.color }}
                                    />
                                    <span className='text-sm text-muted-foreground'>
                                      {entry.name}:
                                    </span>
                                    <span className='text-sm font-medium'>
                                      {formatCurrency(entry.value as number)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend
                        verticalAlign='top'
                        height={36}
                        formatter={(value) => <span className='text-xs font-medium'>{value}</span>}
                      />
                      <Bar
                        dataKey='income'
                        name='Income'
                        fill='url(#incomeGradient)'
                        stroke={chartConfig.income.color}
                        strokeWidth={1}
                        radius={[4, 4, 0, 0]}
                        barSize={20}
                      />
                      <Bar
                        dataKey='expense'
                        name='Expense'
                        fill='url(#expenseGradient)'
                        stroke={chartConfig.expense.color}
                        strokeWidth={1}
                        radius={[4, 4, 0, 0]}
                        barSize={20}
                      />
                      <Bar
                        dataKey='balance'
                        name='Balance'
                        fill='url(#balanceGradient)'
                        stroke={chartConfig.balance.color}
                        strokeWidth={1}
                        radius={[4, 4, 0, 0]}
                        barSize={20}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>

              <TabsContent value='line' className='mt-2'>
                <div className='h-[320px] px-1'>
                  <ResponsiveContainer width='100%' height='100%'>
                    <RechartsLineChart
                      data={data}
                      margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
                    >
                      <defs>
                        <linearGradient id='incomeAreaGradient' x1='0' y1='0' x2='0' y2='1'>
                          <stop
                            offset='5%'
                            stopColor={chartConfig.income.color}
                            stopOpacity={0.1}
                          />
                          <stop
                            offset='95%'
                            stopColor={chartConfig.income.color}
                            stopOpacity={0.01}
                          />
                        </linearGradient>
                        <linearGradient id='expenseAreaGradient' x1='0' y1='0' x2='0' y2='1'>
                          <stop
                            offset='5%'
                            stopColor={chartConfig.expense.color}
                            stopOpacity={0.1}
                          />
                          <stop
                            offset='95%'
                            stopColor={chartConfig.expense.color}
                            stopOpacity={0.01}
                          />
                        </linearGradient>
                        <linearGradient id='balanceAreaGradient' x1='0' y1='0' x2='0' y2='1'>
                          <stop
                            offset='5%'
                            stopColor={chartConfig.balance.color}
                            stopOpacity={0.1}
                          />
                          <stop
                            offset='95%'
                            stopColor={chartConfig.balance.color}
                            stopOpacity={0.01}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray='3 3'
                        vertical={false}
                        stroke='hsl(var(--border)/0.5)'
                      />
                      <XAxis
                        dataKey='date'
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        axisLine={{ stroke: 'hsl(var(--border))' }}
                      />
                      <YAxis
                        tickFormatter={(value) => `$${value / 1000}k`}
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        axisLine={{ stroke: 'hsl(var(--border))' }}
                      />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className='rounded-lg border border-border/40 bg-background/95 p-3 shadow-md backdrop-blur-sm'>
                                <p className='mb-1 font-medium'>{label}</p>
                                {payload.map((entry, index) => (
                                  <div
                                    key={`tooltip-item-${index}`}
                                    className='flex items-center gap-2 py-0.5'
                                  >
                                    <div
                                      className='h-2 w-2 rounded-full'
                                      style={{ backgroundColor: entry.color }}
                                    />
                                    <span className='text-sm text-muted-foreground'>
                                      {entry.name}:
                                    </span>
                                    <span className='text-sm font-medium'>
                                      {formatCurrency(entry.value as number)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend
                        verticalAlign='top'
                        height={36}
                        formatter={(value) => <span className='text-xs font-medium'>{value}</span>}
                      />
                      <Line
                        type='monotone'
                        dataKey='income'
                        name='Income'
                        stroke={chartConfig.income.color}
                        strokeWidth={2}
                        dot={{ r: 3, strokeWidth: 1, fill: 'white' }}
                        activeDot={{ r: 5, strokeWidth: 0 }}
                        animationDuration={1500}
                      />
                      <Line
                        type='monotone'
                        dataKey='expense'
                        name='Expense'
                        stroke={chartConfig.expense.color}
                        strokeWidth={2}
                        dot={{ r: 3, strokeWidth: 1, fill: 'white' }}
                        activeDot={{ r: 5, strokeWidth: 0 }}
                        animationDuration={1500}
                      />
                      <Line
                        type='monotone'
                        dataKey='balance'
                        name='Balance'
                        stroke={chartConfig.balance.color}
                        strokeWidth={2}
                        dot={{ r: 3, strokeWidth: 1, fill: 'white' }}
                        activeDot={{ r: 5, strokeWidth: 0 }}
                        animationDuration={1500}
                      />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </>
      )}
    </Card>
  );
};

export default {
  AnalyticsCards,
  IncomeExpenseChart
};
