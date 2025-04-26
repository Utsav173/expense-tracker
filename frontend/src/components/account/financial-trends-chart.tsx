import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { BarChart2, LineChart } from 'lucide-react';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface FinancialTrendsChartProps {
  data: Array<{
    date: string;
    income: number;
    expense: number;
    balance: number;
  }>;
  isLoading?: boolean;
  currency: string;
}

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

export const FinancialTrendsChart: React.FC<FinancialTrendsChartProps> = ({
  data,
  isLoading,
  currency
}) => {
  const [chartType, setChartType] = useState('bar');

  const formatCurrency = (
    value: number,
    notation?: 'compact' | 'standard' | 'scientific' | 'engineering' | undefined
  ) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      notation
    }).format(value);
  };

  const formatYaxis = (value: number) => {
    return formatCurrency(value, 'compact');
  };

  if (isLoading) {
    return (
      <Card className='border-border/40 border shadow-xs'>
        <CardHeader className='pb-4'>
          <div className='bg-muted h-6 w-48 animate-pulse rounded-md' />
          <div className='bg-muted h-4 w-72 animate-pulse rounded-md opacity-70' />
        </CardHeader>
        <CardContent>
          <div className='bg-muted h-[350px] animate-pulse rounded-md' />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='border-border/40 overflow-hidden border shadow-xs transition-all duration-200'>
      <CardHeader className='flex flex-none gap-2 pb-2'>
        <Tabs defaultValue='bar' className='w-full' onValueChange={(v) => setChartType(v)}>
          <TabsList className='grid w-full grid-cols-2 max-sm:w-full'>
            <TabsTrigger value='bar' className='flex items-center gap-1'>
              <BarChart2 className='h-3.5 w-3.5' />
              <span>Bar</span>
            </TabsTrigger>
            <TabsTrigger value='line' className='flex items-center gap-1'>
              <LineChart className='h-3.5 w-3.5' />
              <span>Line</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>

      <CardContent className='px-2 pt-0 pb-0'>
        {chartType === 'bar' && (
          <div className='ring-offset-background focus-visible:ring-ring mt-2 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden'>
            <div className='px-1'>
              <ResponsiveContainer width='100%' height={320}>
                <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                  <defs>
                    <linearGradient id='incomeGradient' x1='0' y1='0' x2='0' y2='1'>
                      <stop offset='5%' stopColor={chartConfig.income.color} stopOpacity={0.8} />
                      <stop offset='95%' stopColor={chartConfig.income.color} stopOpacity={0.4} />
                    </linearGradient>
                    <linearGradient id='expenseGradient' x1='0' y1='0' x2='0' y2='1'>
                      <stop offset='5%' stopColor={chartConfig.expense.color} stopOpacity={0.8} />
                      <stop offset='95%' stopColor={chartConfig.expense.color} stopOpacity={0.4} />
                    </linearGradient>
                    <linearGradient id='balanceGradient' x1='0' y1='0' x2='0' y2='1'>
                      <stop offset='5%' stopColor={chartConfig.balance.color} stopOpacity={0.8} />
                      <stop offset='95%' stopColor={chartConfig.balance.color} stopOpacity={0.4} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray='3 3'
                    vertical={false}
                    horizontal={false}
                    stroke='hsl(var(--border)/0.5)'
                  />
                  <XAxis
                    dataKey='date'
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis
                    tickFormatter={formatYaxis}
                    tick={{ fontSize: 12 }}
                    tickLine={true}
                    dx={-10}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className='border-border/40 bg-popover rounded-lg border p-3 shadow-md backdrop-blur-[2px]'>
                            <p className='mb-2 font-medium'>{label}</p>
                            <div className='grid grid-cols-[auto_auto] gap-x-2 gap-y-1'>
                              {payload.map((entry, index) => (
                                <React.Fragment key={`tooltip-item-${index}`}>
                                  <div className='flex items-center gap-2'>
                                    <div
                                      className='h-2 w-2 rounded-full'
                                      style={{ backgroundColor: entry.color }}
                                    />
                                    <span className='text-muted-foreground text-sm'>
                                      {entry.name}:
                                    </span>
                                  </div>
                                  <span className='text-right text-sm font-medium'>
                                    {formatCurrency(entry.value as number)}
                                  </span>
                                </React.Fragment>
                              ))}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                    cursor={{ fill: '#f0f0f0' }}
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
          </div>
        )}

        {chartType === 'line' && (
          <div className='ring-offset-background focus-visible:ring-ring mt-2 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden'>
            <div className='px-1'>
              <ResponsiveContainer width='100%' height={320}>
                <RechartsLineChart
                  data={data}
                  margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
                >
                  <defs>
                    <linearGradient id='incomeAreaGradient' x1='0' y1='0' x2='0' y2='1'>
                      <stop offset='5%' stopColor={chartConfig.income.color} stopOpacity={0.1} />
                      <stop offset='95%' stopColor={chartConfig.income.color} stopOpacity={0.01} />
                    </linearGradient>
                    <linearGradient id='expenseAreaGradient' x1='0' y1='0' x2='0' y2='1'>
                      <stop offset='5%' stopColor={chartConfig.expense.color} stopOpacity={0.1} />
                      <stop offset='95%' stopColor={chartConfig.expense.color} stopOpacity={0.01} />
                    </linearGradient>
                    <linearGradient id='balanceAreaGradient' x1='0' y1='0' x2='0' y2='1'>
                      <stop offset='5%' stopColor={chartConfig.balance.color} stopOpacity={0.1} />
                      <stop offset='95%' stopColor={chartConfig.balance.color} stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray='3 3'
                    vertical={false}
                    horizontal={false}
                    stroke='hsl(var(--border)/0.5)'
                  />
                  <XAxis
                    dataKey='date'
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis
                    tickFormatter={formatYaxis}
                    tick={{ fontSize: 12 }}
                    tickLine={true}
                    dx={-10}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className='border-border/40 bg-popover rounded-lg border p-3 shadow-md backdrop-blur-[2px]'>
                            <p className='mb-2 font-medium'>{label}</p>
                            <div className='grid grid-cols-[auto_auto] gap-x-2 gap-y-1'>
                              {payload.map((entry, index) => (
                                <React.Fragment key={`tooltip-item-${index}`}>
                                  <div className='flex items-center gap-2'>
                                    <div
                                      className='h-2 w-2 rounded-full'
                                      style={{ backgroundColor: entry.color }}
                                    />
                                    <span className='text-muted-foreground text-sm'>
                                      {entry.name}:
                                    </span>
                                  </div>
                                  <span className='text-right text-sm font-medium'>
                                    {formatCurrency(entry.value as number)}
                                  </span>
                                </React.Fragment>
                              ))}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                    cursor={{ fill: 'none' }}
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
          </div>
        )}
      </CardContent>
    </Card>
  );
};
