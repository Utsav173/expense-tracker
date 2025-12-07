'use client';

import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { budgetGetSummary } from '@/lib/endpoints/budget';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ComposedChart,
  Treemap,
  Cell
} from 'recharts';
import { ChartContainer, ChartTooltip } from '@/components/ui/chart';
import { cn, formatCurrency } from '@/lib/utils';
import { useAuth } from '@/components/providers/auth-provider';

interface BudgetOverviewProps {
  month: number;
  year: number;
  period: string;
}

const BudgetOverview = ({ month, year, period }: BudgetOverviewProps) => {
  const { session } = useAuth();
  const currency = session?.user?.preferredCurrency || 'INR';

  const { data: summaryData, isLoading } = useQuery({
    queryKey: ['budget-summary', period, month, year],
    queryFn: () => {
      if (period === 'thisYear') {
        return budgetGetSummary({ duration: 'thisYear' });
      }
      return budgetGetSummary({ month: String(month), year: String(year) });
    }
  });

  const stats = useMemo(() => {
    if (!summaryData) return { totalBudget: 0, totalSpent: 0, remaining: 0, percentageUsed: 0 };
    const totalBudget = summaryData.reduce((acc, item) => acc + item.budgetedAmount, 0);
    const totalSpent = summaryData.reduce((acc, item) => acc + item.actualSpend, 0);
    const remaining = totalBudget - totalSpent;
    const percentageUsed = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
    return { totalBudget, totalSpent, remaining, percentageUsed };
  }, [summaryData]);

  const insights = useMemo(() => {
    if (!summaryData || summaryData.length === 0) return [];
    const insightsList = [];

    const overBudget = summaryData.filter((item) => item.actualSpend > item.budgetedAmount);
    if (overBudget.length > 0) {
      insightsList.push({
        type: 'warning',
        message: `Exceeded budget in ${overBudget.length} categories: ${overBudget.map((i) => i.categoryName).join(', ')}.`
      });
    }

    const highSpending = summaryData.filter(
      (item) =>
        item.actualSpend > item.budgetedAmount * 0.8 && item.actualSpend <= item.budgetedAmount
    );
    if (highSpending.length > 0) {
      insightsList.push({
        type: 'alert',
        message: `Nearing limit in: ${highSpending.map((i) => i.categoryName).join(', ')}.`
      });
    }

    const wellManaged = summaryData.filter((item) => item.actualSpend < item.budgetedAmount * 0.5);
    if (wellManaged.length > 0 && wellManaged.length < summaryData.length) {
      insightsList.push({
        type: 'success',
        message: `Great job saving on ${wellManaged.length} categories!`
      });
    }

    if (insightsList.length === 0) {
      insightsList.push({
        type: 'info',
        message: 'Your budget looks balanced so far. Keep it up!'
      });
    }

    return insightsList;
  }, [summaryData]);

  const processedData = useMemo(() => {
    if (!summaryData) return [];

    const sorted = [...summaryData].sort((a, b) => b.budgetedAmount - a.budgetedAmount);

    let dataToProcess = sorted;

    if (sorted.length > 8) {
      const top8 = sorted.slice(0, 8);
      const others = sorted.slice(8);

      const otherItem = {
        category: 'others',
        categoryName: 'Others',
        budgetedAmount: others.reduce((acc, curr) => acc + curr.budgetedAmount, 0),
        actualSpend: others.reduce((acc, curr) => acc + curr.actualSpend, 0),
        breakdown: others
      };

      dataToProcess = [...top8, otherItem];
    }

    return dataToProcess.map((item) => {
      const isOverBudget = item.actualSpend > item.budgetedAmount;
      const withinBudget = isOverBudget ? item.budgetedAmount : item.actualSpend;
      const overBudget = isOverBudget ? item.actualSpend - item.budgetedAmount : 0;
      const cappingRef = item.budgetedAmount > 0 ? item.budgetedAmount : item.actualSpend;
      const visualOverBudget = Math.min(overBudget, cappingRef * 0.5);

      const remaining = isOverBudget ? 0 : item.budgetedAmount - item.actualSpend;
      const utilizationPercent =
        item.budgetedAmount > 0 ? (item.actualSpend / item.budgetedAmount) * 100 : 0;

      return {
        ...item,
        withinBudget,
        overBudget,
        visualOverBudget,
        remaining,
        isOverBudget,
        utilizationPercent,
        total: Math.max(item.budgetedAmount, item.actualSpend)
      };
    });
  }, [summaryData]);

  const treemapData = useMemo(() => {
    if (!summaryData || summaryData.length === 0) return [];

    return summaryData
      .map((item) => {
        const percent =
          item.budgetedAmount > 0 ? (item.actualSpend / item.budgetedAmount) * 100 : 0;

        return {
          name: item.categoryName,
          size: item.actualSpend,
          percent: percent,
          budget: item.budgetedAmount,
          spent: item.actualSpend
        };
      })
      .filter((item) => item.size > 0)
      .sort((a, b) => b.size - a.size);
  }, [summaryData]);

  if (isLoading) {
    return <OverviewSkeleton />;
  }

  if (!summaryData || summaryData.length === 0) {
    return (
      <Card className='bg-muted/50 border-dashed'>
        <CardContent className='flex flex-col items-center justify-center py-10 text-center'>
          <Icon name='pieChart' className='text-muted-foreground mb-4 h-10 w-10' />
          <p className='text-muted-foreground text-lg font-medium'>
            No budget data for this period
          </p>
          <p className='text-muted-foreground text-sm'>
            Add a budget/transactions to see insights, or change filter from above.
          </p>
        </CardContent>
      </Card>
    );
  }

  const paletteStyle = {
    '--budget-spent': '#8b5cf6',
    '--budget-over': '#f43f5e',
    '--budget-over-chart': '#f43f5e',
    '--budget-warning': '#f59e0b',
    '--budget-info': '#6366f1',
    '--budget-spent-bg': '#8b5cf61a',
    '--budget-over-bg': '#f43f5e1a',
    '--budget-warning-bg': '#f59e0b1a',
    '--budget-info-bg': '#6366f11a'
  } as React.CSSProperties;

  const chartConfig = {
    withinBudget: {
      label: 'Spent (Within Budget)',
      color: 'var(--budget-spent)'
    },
    overBudget: {
      label: 'Over Budget',
      color: 'var(--budget-over)'
    },
    remaining: {
      label: 'Remaining',
      color: 'hsl(var(--muted))'
    }
  };

  return (
    <div
      className='animate-in fade-in slide-in-from-bottom-4 space-y-6 duration-500'
      style={{ ...paletteStyle } as React.CSSProperties}
    >
      <style suppressHydrationWarning>{`
        .dark {
          --budget-spent: #a78bfa;   
          --budget-over: #fb7185;    
          --budget-over-chart: #f43f5e;
          --budget-warning: #fbbf24;
          --budget-info: #818cf8;
          --budget-spent-bg: #a78bfa26;
          --budget-over-bg: #fb718526;
          --budget-warning-bg: #fbbf2426;
          --budget-info-bg: #818cf826;
        }
      `}</style>

      <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
        <SummaryCard
          title='Total Budget'
          value={stats.totalBudget}
          icon='wallet'
          trend='Total planned'
          variant='default'
          currency={currency}
        />
        <SummaryCard
          title='Total Spent'
          value={stats.totalSpent}
          icon='creditCard'
          trend={`${stats.percentageUsed.toFixed(1)}% used`}
          progress={Math.min(stats.percentageUsed, 100)}
          variant='destructive'
          isOverBudget={stats.percentageUsed > 100}
          currency={currency}
        />
        <SummaryCard
          title='Remaining Total'
          value={stats.remaining}
          icon='piggyBank'
          trend='Available funds'
          variant={stats.remaining < 0 ? 'destructive' : 'success'}
          currency={currency}
        />
      </div>

      <div className='grid grid-cols-1 gap-6 xl:grid-cols-5'>
        <Card className='overflow-hidden shadow-sm xl:col-span-3'>
          <CardHeader className='pb-2'>
            <CardTitle className='flex items-center gap-2 text-base font-semibold'>
              <Icon name='barChart' className='text-primary h-4 w-4' />
              Budget vs Actual
            </CardTitle>
          </CardHeader>
          <CardContent className='px-2 pb-4 sm:px-4'>
            <div className='h-[280px] w-full sm:h-[350px] lg:h-[380px]'>
              <ChartContainer config={chartConfig} className='h-full w-full'>
                <ComposedChart
                  data={processedData}
                  margin={{ top: 0, right: 0, bottom: 0, left: 32 }}
                  layout='vertical'
                  barSize={22}
                  barGap={0}
                >
                  <CartesianGrid horizontal={false} strokeDasharray='3 3' stroke='var(--muted)' />
                  <XAxis
                    type='number'
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => formatCurrency(value, currency, 'compact')}
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                    tickMargin={8}
                  />
                  <YAxis
                    dataKey='categoryName'
                    type='category'
                    tickLine={false}
                    axisLine={false}
                    width={100}
                    tick={({ x, y, payload }) => {
                      const name = payload.value || '';
                      const maxLength = 12;
                      const truncated =
                        name.length > maxLength ? name.slice(0, maxLength) + '…' : name;
                      return (
                        <g transform={`translate(${x},${y})`}>
                          <title>{name}</title>
                          <text
                            x={-4}
                            y={0}
                            dy={4}
                            textAnchor='end'
                            fill='var(--muted-foreground)'
                            fontSize={11}
                            style={{ cursor: name.length > maxLength ? 'help' : 'default' }}
                          >
                            {truncated}
                          </text>
                        </g>
                      );
                    }}
                    tickMargin={4}
                  />
                  <ChartTooltip
                    cursor={{ fill: 'var(--muted)', fillOpacity: 0.15 }}
                    content={({ active, payload }) => {
                      if (!active || !payload || payload.length === 0) return null;

                      const data = payload[0].payload;

                      if (data.categoryName === 'Others' && data.breakdown) {
                        return (
                          <div className='bg-popover border-border z-tooltip rounded-xl border p-3 shadow-xl'>
                            <p className='mb-2 font-semibold'>Others Breakdown</p>
                            <div className='mb-2 max-h-40 space-y-1 overflow-y-auto'>
                              {data.breakdown.map((item: any, idx: number) => (
                                <div
                                  key={idx}
                                  className='flex items-center justify-between gap-4 text-xs'
                                >
                                  <span className='text-muted-foreground max-w-[120px] truncate'>
                                    {item.categoryName}
                                  </span>
                                  <span className='font-mono font-medium'>
                                    {formatCurrency(item.actualSpend, currency)}
                                  </span>
                                </div>
                              ))}
                            </div>
                            <div className='border-border mt-2 border-t pt-2'>
                              <div className='flex items-center justify-between text-sm font-semibold'>
                                <span>Total</span>
                                <span className='font-mono'>
                                  {formatCurrency(data.actualSpend, currency)}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      }

                      const utilizationPercent =
                        data.budgetedAmount > 0
                          ? ((data.actualSpend / data.budgetedAmount) * 100).toFixed(1)
                          : '0';

                      return (
                        <div className='bg-popover border-border z-tooltip min-w-[180px] rounded-xl border p-3 shadow-xl'>
                          <p className='mb-2 font-semibold'>{data.categoryName}</p>
                          <div className='space-y-1.5'>
                            <div className='flex items-center justify-between gap-4 text-xs'>
                              <span className='text-muted-foreground'>Budgeted</span>
                              <span className='font-mono font-medium'>
                                {formatCurrency(data.budgetedAmount, currency)}
                              </span>
                            </div>
                            <div className='flex items-center justify-between gap-4 text-xs'>
                              <span className='text-muted-foreground'>Spent</span>
                              <span
                                className={cn(
                                  'font-mono font-medium',
                                  data.isOverBudget ? 'text-destructive' : 'text-success'
                                )}
                              >
                                {formatCurrency(data.actualSpend, currency)}
                              </span>
                            </div>
                            {data.isOverBudget && (
                              <div className='flex items-center justify-between gap-4 text-xs'>
                                <span className='text-destructive font-medium'>Over by</span>
                                <span className='text-destructive font-mono font-bold'>
                                  {formatCurrency(data.overBudget, currency)}
                                </span>
                              </div>
                            )}
                            <div className='border-border mt-2 border-t pt-2'>
                              <div className='flex items-center justify-between text-xs'>
                                <span className='text-muted-foreground'>Utilization</span>
                                <span
                                  className={cn(
                                    'font-bold',
                                    data.isOverBudget ? 'text-destructive' : 'text-success'
                                  )}
                                >
                                  {utilizationPercent}%
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <defs>
                    <linearGradient id='successGradient' x1='0' y1='0' x2='1' y2='0'>
                      <stop offset='0%' stopColor='var(--budget-spent)' stopOpacity={0.9} />
                      <stop offset='100%' stopColor='var(--budget-spent)' stopOpacity={1} />
                    </linearGradient>
                    <linearGradient id='overBudgetGradientBase' x1='0' y1='0' x2='1' y2='0'>
                      <stop offset='0%' stopColor='var(--budget-over)' stopOpacity={0.5} />
                      <stop offset='100%' stopColor='var(--budget-over)' stopOpacity={0.6} />
                    </linearGradient>
                    <pattern
                      id='overBudgetPattern'
                      patternUnits='userSpaceOnUse'
                      width='6'
                      height='6'
                      patternTransform='rotate(45)'
                    >
                      <rect width='3' height='6' fill='url(#overBudgetGradientBase)' />
                      <rect
                        x='3'
                        width='3'
                        height='6'
                        fill='url(#overBudgetGradientBase)'
                        fillOpacity='0.2'
                      />
                    </pattern>
                  </defs>
                  <Bar dataKey='withinBudget' stackId='budget'>
                    {processedData.map((entry, index) => {
                      const isEnd = entry.visualOverBudget <= 0 && entry.remaining <= 0;
                      const radius: [number, number, number, number] = isEnd
                        ? [4, 4, 4, 4]
                        : [4, 0, 0, 4];
                      return (
                        <Cell
                          key={`cell-within-${index}`}
                          fill='url(#successGradient)'
                          radius={radius as any}
                        />
                      );
                    })}
                  </Bar>

                  <Bar dataKey='visualOverBudget' stackId='budget'>
                    {processedData.map((entry, index) => {
                      const isStart = entry.withinBudget <= 0;
                      const radius: [number, number, number, number] = isStart
                        ? [4, 4, 4, 4]
                        : [0, 4, 4, 0];
                      return (
                        <Cell
                          key={`cell-over-${index}`}
                          fill='url(#overBudgetPattern)'
                          radius={radius as any}
                        />
                      );
                    })}
                  </Bar>

                  <Bar dataKey='remaining' stackId='budget'>
                    {processedData.map((entry, index) => {
                      const isStart = entry.withinBudget <= 0;
                      const radius: [number, number, number, number] = isStart
                        ? [4, 4, 4, 4]
                        : [0, 4, 4, 0];
                      return (
                        <Cell
                          key={`cell-remaining-${index}`}
                          fill='hsl(var(--muted))'
                          radius={radius as any}
                          fillOpacity={0.3}
                        />
                      );
                    })}
                  </Bar>
                </ComposedChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        <Card className='flex flex-col shadow-sm xl:col-span-2'>
          <CardHeader className='pb-3'>
            <CardTitle className='flex items-center gap-2 text-base font-semibold'>
              <div className='rounded-lg bg-[var(--budget-warning-bg)] p-1.5'>
                <Icon name='sparkles' className='h-4 w-4 text-[var(--budget-warning)]' />
              </div>
              Smart Insights
            </CardTitle>
          </CardHeader>
          <CardContent className='flex flex-1 flex-col gap-5 pb-4'>
            <div className='space-y-2.5'>
              {insights.slice(0, 2).map((insight, idx) => (
                <InsightItem key={idx} insight={insight} />
              ))}
            </div>

            <div className='flex flex-1 flex-col gap-3 border-t pt-4'>
              <h4 className='text-muted-foreground flex items-center gap-2 text-xs font-semibold tracking-wider uppercase'>
                <Icon name='layoutGrid' className='h-3.5 w-3.5' />
                Spending Treemap
              </h4>

              <div className='min-h-[180px] flex-1 sm:min-h-[220px]'>
                <ResponsiveContainer width='100%' height='100%'>
                  <Treemap
                    data={treemapData}
                    dataKey='size'
                    aspectRatio={4 / 3}
                    stroke='hsl(var(--background))'
                    fill='#8884d8'
                    content={<CustomTreemapContent currency={currency} />}
                  >
                    <RechartsTooltip
                      content={({ payload }) => {
                        if (!payload || !payload[0]) return null;
                        const data = payload[0].payload;
                        return (
                          <div className='bg-popover border-border rounded-xl border p-2.5 shadow-xl'>
                            <p className='font-semibold'>{data.name}</p>
                            <p className='text-muted-foreground text-xs'>
                              Spent: {formatCurrency(data.spent, currency)}
                            </p>
                            <p className='text-muted-foreground text-xs'>
                              Budget: {formatCurrency(data.budget, currency)}
                            </p>
                            <p className='mt-1 text-xs font-semibold'>
                              {data.percent?.toFixed(1)}% used
                            </p>
                          </div>
                        );
                      }}
                    />
                  </Treemap>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

type SummaryCardVariant = 'default' | 'destructive' | 'success';

const variantStyles: Record<
  SummaryCardVariant,
  {
    card: string;
    icon: string;
    value?: string;
    trend?: string;
    progressTrack?: string;
    progressFill?: string;
  }
> = {
  default: {
    card: 'border-t-4 border-t-primary shadow-sm hover:shadow-md transition-all',
    icon: 'bg-primary/10 text-primary',
    progressTrack: 'bg-muted',
    progressFill: 'bg-primary'
  },
  destructive: {
    card: 'border-t-4 border-t-[var(--budget-over)] shadow-sm hover:shadow-md transition-all',
    icon: 'bg-[var(--budget-over-bg)] text-[var(--budget-over)]',
    trend: 'text-[var(--budget-over)] font-medium',
    progressTrack: 'bg-[var(--budget-over-bg)]',
    progressFill: 'bg-[var(--budget-over)]'
  },
  success: {
    card: 'border-t-4 border-t-[var(--budget-spent)] shadow-sm hover:shadow-md transition-all',
    icon: 'bg-[var(--budget-spent-bg)] text-[var(--budget-spent)]',
    value: 'text-[var(--budget-spent)]',
    progressTrack: 'bg-[var(--budget-spent-bg)]',
    progressFill: 'bg-[var(--budget-spent)]'
  }
};

const SummaryCard = ({
  title,
  value,
  icon,
  trend,
  variant = 'default',
  isOverBudget,
  progress,
  currency
}: {
  title: string;
  value: number;
  icon: any;
  trend?: string;
  variant?: SummaryCardVariant;
  isOverBudget?: boolean;
  progress?: number;
  currency: string;
}) => {
  const styles = variantStyles[variant];

  return (
    <Card className={cn(styles.card, 'group')}>
      <CardHeader className='relative z-10 flex flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle className='text-sm font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400'>
          {title}
        </CardTitle>
        <div className={cn(styles.icon, 'transition-transform duration-300 group-hover:scale-110')}>
          <Icon name={icon} className='h-4.5 w-4.5' />
        </div>
      </CardHeader>
      <CardContent className='relative z-10 pt-1'>
        <div className={cn('text-2xl font-bold tracking-tight', styles.value)}>
          {formatCurrency(value, currency)}
        </div>

        <div className='mt-3 flex items-center justify-between'>
          {trend && (
            <p
              className={cn(
                'text-xs font-medium',
                isOverBudget
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-gray-500 dark:text-gray-400',
                styles.trend
              )}
            >
              {trend}
            </p>
          )}
        </div>

        {(variant === 'destructive' || variant === 'success') && (
          <div className={cn('mt-3 h-1 w-full rounded-full', styles.progressTrack)}>
            <div
              className={cn('h-full rounded-full transition-all duration-500', styles.progressFill)}
              style={{ width: `${progress ?? (variant === 'success' ? 100 : 0)}%` }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const OverviewSkeleton = () => (
  <div className='space-y-6'>
    <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className='h-28 w-full rounded-2xl' />
      ))}
    </div>
    <div className='grid grid-cols-1 gap-6 xl:grid-cols-5'>
      <Skeleton className='h-[380px] rounded-xl xl:col-span-3' />
      <Skeleton className='h-[380px] rounded-xl xl:col-span-2' />
    </div>
  </div>
);

const CustomTreemapContent = (props: any) => {
  const { x, y, width, height, name, percent, spent, currency } = props;
  if (!name || width < 30 || height < 30) return null;

  const backgroundColor =
    percent > 100
      ? 'var(--budget-over-chart)'
      : percent > 80
        ? 'var(--budget-warning)'
        : 'var(--budget-spent)';

  const strokeColor = 'var(--background)';

  const nameFontSize = width < 60 ? 10 : 12;
  const percentFontSize = width < 60 ? 11 : 14;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={4}
        ry={4}
        style={{
          fill: backgroundColor,
          stroke: strokeColor,
          strokeWidth: 2,
          opacity: 0.9
        }}
      />
      {width > 40 && height > 40 && (
        <>
          <text
            x={x + width / 2}
            y={y + height / 2 - (width < 60 ? 6 : 8)}
            textAnchor='middle'
            fill='white'
            fontSize={nameFontSize}
            fontWeight='600'
            style={{
              textShadow: '0 1px 2px rgba(0,0,0,0.5)',
              pointerEvents: 'none'
            }}
          >
            {name.length > (width < 60 ? 6 : 10) ? name.slice(0, width < 60 ? 6 : 10) + '..' : name}
          </text>
          <text
            x={x + width / 2}
            y={y + height / 2 + (width < 60 ? 6 : 8)}
            textAnchor='middle'
            fill='white'
            fontSize={percentFontSize}
            fontWeight='bold'
            style={{
              textShadow: '0 1px 2px rgba(0,0,0,0.5)',
              pointerEvents: 'none'
            }}
          >
            {percent?.toFixed(0)}%
          </text>
        </>
      )}
    </g>
  );
};

const InsightItem = ({ insight }: { insight: { type: string; message: string } }) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const isLong = insight.message.length > 100;

  const styles = {
    warning:
      'border-l-[var(--budget-over)] bg-[var(--budget-over-bg)] text-[var(--budget-over)] shadow-sm dark:shadow-none',
    alert:
      'border-l-[var(--budget-warning)] bg-[var(--budget-warning-bg)] text-[var(--budget-warning)] shadow-sm dark:shadow-none',
    success:
      'border-l-[var(--budget-spent)] bg-[var(--budget-spent-bg)] text-[var(--budget-spent)] shadow-sm dark:shadow-none',
    info: 'border-l-[var(--budget-info)] bg-[var(--budget-info-bg)] text-[var(--budget-info)] shadow-sm dark:shadow-none'
  };

  const iconColors = {
    warning: 'text-[var(--budget-over)]',
    alert: 'text-[var(--budget-warning)]',
    success: 'text-[var(--budget-spent)]',
    info: 'text-[var(--budget-info)]'
  };

  const type = insight.type as keyof typeof styles;

  return (
    <div
      className={cn(
        'relative flex items-start gap-3 overflow-hidden rounded-lg border border-l-[3px] border-y-transparent border-r-transparent p-3.5 shadow-sm transition-all hover:translate-x-1',
        styles[type] || styles.info
      )}
    >
      <div
        className={cn(
          'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/50 backdrop-blur-sm dark:bg-black/20',
          iconColors[type] || iconColors.info
        )}
      >
        <Icon
          name={
            type === 'warning'
              ? 'alertTriangle'
              : type === 'success'
                ? 'checkCircle'
                : type === 'alert'
                  ? 'alertCircle'
                  : 'info'
          }
          className='h-3.5 w-3.5'
        />
      </div>
      <div className='flex-1'>
        <p className={cn('text-sm leading-relaxed font-medium', !isExpanded && 'line-clamp-2')}>
          {insight.message}
        </p>
        {isLong && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className='mt-1.5 flex items-center gap-1 text-[11px] font-bold tracking-wider uppercase opacity-60 transition-opacity hover:opacity-100'
          >
            {isExpanded ? 'Show Less' : 'View More'}
          </button>
        )}
      </div>
    </div>
  );
};

export default BudgetOverview;
