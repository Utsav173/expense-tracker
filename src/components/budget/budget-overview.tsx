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
  Treemap
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

    // Over budget categories
    const overBudget = summaryData.filter((item) => item.actualSpend > item.budgetedAmount);
    if (overBudget.length > 0) {
      insightsList.push({
        type: 'warning',
        message: `Exceeded budget in ${overBudget.length} categories: ${overBudget.map((i) => i.categoryName).join(', ')}.`
      });
    }

    // High spending categories ( > 80% )
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

    // Good job ( < 50% used and month is > 20th day? - simplistic for now)
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

    // Sort by budgeted amount descending
    const sorted = [...summaryData].sort((a, b) => b.budgetedAmount - a.budgetedAmount);

    if (sorted.length <= 10) return sorted;

    const top10 = sorted.slice(0, 10);
    const others = sorted.slice(10);

    const otherItem = {
      category: 'others',
      categoryName: 'Others',
      budgetedAmount: others.reduce((acc, curr) => acc + curr.budgetedAmount, 0),
      actualSpend: others.reduce((acc, curr) => acc + curr.actualSpend, 0),
      breakdown: others // Store the breakdown for tooltip
    };

    return [...top10, otherItem];
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
      .sort((a, b) => b.size - a.size); // Sort by size descending for better packing
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

  const chartConfig = {
    budgetedAmount: {
      label: 'Budgeted',
      color: 'var(--primary)'
    },
    actualSpend: {
      label: 'Actual Spend',
      color: 'var(--destructive)'
    }
  };

  return (
    <div className='animate-in fade-in slide-in-from-bottom-4 space-y-6 duration-500'>
      {/* Summary Cards */}
      <div className='grid gap-4 md:grid-cols-3'>
        <SummaryCard
          title='Total Budget'
          value={stats.totalBudget}
          icon='wallet'
          trend='Total planned'
          className='rounded-[28px] border border-[#E2E5ED] bg-[#F4F6FA] text-[#1B1D26] shadow-sm shadow-slate-200/40 transition-all duration-300 hover:bg-[#EEF1F8] dark:border-[#272A36] dark:bg-[#16181F] dark:text-[#E2E4EA] dark:shadow-none dark:hover:bg-[#1C1F29]'
          iconClassName='rounded-xl bg-[#E0E4F2] p-3.5 text-[#424966] dark:bg-[#272A36] dark:text-[#A8ACBD]'
          currency={currency}
        />
        <SummaryCard
          title='Total Spent'
          value={stats.totalSpent}
          icon='creditCard'
          trend={`${stats.percentageUsed.toFixed(1)}% used`}
          trendColor={
            stats.percentageUsed > 100
              ? 'text-[#8C1D18] font-medium dark:text-[#F2B8B5]'
              : 'text-[#5C5F66] dark:text-[#9EA3AE]'
          }
          className='rounded-[28px] border border-[#F5E0DE] bg-[#FFF8F7] text-[#3E1A1A] shadow-sm shadow-orange-100/40 transition-all duration-300 hover:bg-[#FFF3F1] dark:border-[#3D2426] dark:bg-[#241819] dark:text-[#F5DEDD] dark:shadow-none dark:hover:bg-[#2B1C1E]'
          iconClassName='rounded-xl bg-[#FAE8E6] p-3.5 text-[#8C1D18] dark:bg-[#3D2426] dark:text-[#F2B8B5]'
          currency={currency}
        />
        <SummaryCard
          title='Remaining'
          value={stats.remaining}
          icon='piggyBank'
          trend='Available funds'
          valueColor={
            stats.remaining < 0
              ? 'text-[#8C1D18] dark:text-[#F2B8B5]'
              : 'text-[#146C43] dark:text-[#8CDAC1]'
          }
          className='rounded-[28px] border border-[#DCEBE4] bg-[#F5FAF8] text-[#12261E] shadow-sm shadow-emerald-100/40 transition-all duration-300 hover:bg-[#EDF7F4] dark:border-[#22362E] dark:bg-[#151F1B] dark:text-[#E0F2EA] dark:shadow-none dark:hover:bg-[#1A2621]'
          iconClassName='rounded-xl bg-[#D6EBE2] p-3.5 text-[#146C43] dark:bg-[#22362E] dark:text-[#8CDAC1]'
          currency={currency}
        />
      </div>

      <div className='grid min-w-0 gap-6 lg:grid-cols-3'>
        {/* Main Chart: Composed Chart (Bullet Style) */}
        <Card className='col-span-1 min-w-0 overflow-hidden shadow-sm lg:col-span-2'>
          <CardHeader>
            <CardTitle>Budget vs Actual</CardTitle>
          </CardHeader>
          <CardContent className='pr-2 pl-0'>
            <div className='h-[300px] w-full sm:h-[400px]'>
              <ChartContainer config={chartConfig} className='h-full w-full'>
                <ComposedChart
                  data={processedData}
                  margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                  layout='vertical'
                >
                  <CartesianGrid
                    horizontal={false}
                    strokeDasharray='3 3'
                    className='stroke-muted/50'
                  />
                  <XAxis
                    type='number'
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => formatCurrency(value, currency, 'compact')}
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                  />
                  <YAxis
                    dataKey='categoryName'
                    type='category'
                    tickLine={false}
                    axisLine={false}
                    width={80}
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                  />
                  <ChartTooltip
                    cursor={{ fill: 'var(--muted)', fillOpacity: 0.2 }}
                    content={({ active, payload }) => {
                      if (!active || !payload || payload.length === 0) return null;

                      const data = payload[0].payload;

                      // Check if this is the "Others" category
                      if (data.categoryName === 'Others' && data.breakdown) {
                        return (
                          <div className='bg-background border-border z-tooltip rounded-lg border p-3 shadow-lg'>
                            <p className='mb-2 font-semibold'>Others Breakdown</p>
                            <div className='mb-2 space-y-1'>
                              {data.breakdown.map((item: any, idx: number) => (
                                <div
                                  key={idx}
                                  className='flex items-center justify-between gap-4 text-xs'
                                >
                                  <span className='text-muted-foreground'>{item.categoryName}</span>
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

                      // Standard tooltip for other categories
                      return (
                        <div className='bg-background border-border z-tooltip min-w-[150px] rounded-lg border p-3 shadow-lg'>
                          <p className='mb-2 font-semibold'>{data.categoryName}</p>
                          <div className='space-y-1.5'>
                            <div className='flex items-center justify-between gap-4 text-xs'>
                              <span className='text-muted-foreground'>Budgeted</span>
                              <span className='font-mono font-medium text-emerald-600 dark:text-emerald-400'>
                                {formatCurrency(data.budgetedAmount, currency)}
                              </span>
                            </div>
                            <div className='flex items-center justify-between gap-4 text-xs'>
                              <span className='text-muted-foreground'>Spent</span>
                              <span className='font-mono font-medium text-rose-600 dark:text-rose-400'>
                                {formatCurrency(data.actualSpend, currency)}
                              </span>
                            </div>
                            <div className='border-border mt-2 border-t pt-2'>
                              <div className='flex items-center justify-between text-xs'>
                                <span className='text-muted-foreground'>Utilization</span>
                                <span
                                  className={cn(
                                    'font-bold',
                                    data.actualSpend > data.budgetedAmount
                                      ? 'text-rose-600'
                                      : 'text-emerald-600'
                                  )}
                                >
                                  {((data.actualSpend / data.budgetedAmount) * 100).toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }}
                  />
                  {/* Budget Bar (Background) */}
                  <Bar
                    dataKey='budgetedAmount'
                    fill='var(--color-budgetedAmount)'
                    barSize={24}
                    radius={[0, 4, 4, 0]}
                    fillOpacity={0.3}
                  />
                  {/* Actual Spend Bar (Foreground) */}
                  <Bar
                    dataKey='actualSpend'
                    fill='var(--color-actualSpend)'
                    barSize={16}
                    radius={[0, 4, 4, 0]}
                  />
                </ComposedChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        {/* Insights & Heatmap */}
        <Card className='col-span-1 flex flex-col shadow-sm'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <div className='rounded-full bg-yellow-100 p-1.5 dark:bg-yellow-900/30'>
                <Icon name='sparkles' className='h-4 w-4 text-yellow-600 dark:text-yellow-400' />
              </div>
              Smart Insights
            </CardTitle>
          </CardHeader>
          <CardContent className='flex-1 space-y-6'>
            <div className='space-y-3'>
              {insights.slice(0, 3).map((insight, idx) => (
                <InsightItem key={idx} insight={insight} />
              ))}
            </div>

            {/* Category Treemap */}
            <div className='space-y-4 border-t pt-4'>
              <div className='flex items-center justify-between'>
                <h4 className='text-muted-foreground flex items-center gap-2 text-xs font-semibold tracking-wider uppercase'>
                  <Icon name='layoutGrid' className='h-3 w-3' />
                  Spending Treemap
                </h4>
              </div>

              <div className='h-[250px] w-full sm:h-[280px]'>
                <ResponsiveContainer width='100%' height='100%'>
                  <Treemap
                    data={treemapData}
                    dataKey='size'
                    aspectRatio={4 / 3}
                    stroke='#fff'
                    fill='#8884d8'
                    content={<CustomTreemapContent currency={currency} />}
                  >
                    <RechartsTooltip
                      content={({ payload }) => {
                        if (!payload || !payload[0]) return null;
                        const data = payload[0].payload;
                        return (
                          <div className='bg-background border-border rounded-lg border p-2 shadow-lg'>
                            <p className='font-semibold'>{data.name}</p>
                            <p className='text-muted-foreground text-xs'>
                              Spent: {formatCurrency(data.spent, currency)}
                            </p>
                            <p className='text-muted-foreground text-xs'>
                              Budget: {formatCurrency(data.budget, currency)}
                            </p>
                            <p className='text-xs font-semibold'>
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

const SummaryCard = ({
  title,
  value,
  icon,
  trend,
  trendColor,
  valueColor,
  className,
  iconClassName,
  currency
}: {
  title: string;
  value: number;
  icon: any;
  trend?: string;
  trendColor?: string;
  valueColor?: string;
  className?: string;
  iconClassName?: string;
  currency: string;
}) => (
  <Card className={cn('shadow-sm transition-all hover:shadow-md', className)}>
    <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
      <CardTitle className='font-medium'>{title}</CardTitle>
      <div className={cn('bg-background/80 rounded-full p-2 backdrop-blur-sm', iconClassName)}>
        <Icon name={icon} className='h-4 w-4' />
      </div>
    </CardHeader>
    <CardContent>
      <div className={cn('text-2xl font-bold', valueColor)}>{formatCurrency(value, currency)}</div>
      {trend && <p className={cn('text-muted-foreground mt-1 text-xs', trendColor)}>{trend}</p>}
    </CardContent>
  </Card>
);

const OverviewSkeleton = () => (
  <div className='space-y-6'>
    <div className='grid gap-4 md:grid-cols-3'>
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className='h-32 w-full rounded-xl' />
      ))}
    </div>
    <div className='grid gap-6 lg:grid-cols-7'>
      <Skeleton className='col-span-4 h-[400px] rounded-xl' />
      <Skeleton className='col-span-3 h-[400px] rounded-xl' />
    </div>
  </div>
);

const CustomTreemapContent = (props: any) => {
  const { x, y, width, height, name, percent, spent, currency } = props;
  if (!name || width < 30 || height < 30) return null;

  // Use actual color values instead of CSS variables for SVG
  const backgroundColor =
    percent > 100
      ? '#ef4444' // Red for over budget
      : percent > 80
        ? '#f97316' // Orange for warning
        : '#10b981'; // Green for healthy

  const strokeColor = '#ffffff'; // White stroke for contrast

  // Responsive font sizes
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

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg border p-3 text-sm shadow-sm transition-colors',
        insight.type === 'warning' &&
          'border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400',
        insight.type === 'alert' &&
          'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/50 dark:bg-orange-950/20 dark:text-orange-400',
        insight.type === 'success' &&
          'border-green-200 bg-green-50 text-green-700 dark:border-green-900/50 dark:bg-green-950/20 dark:text-green-400',
        insight.type === 'info' &&
          'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/20 dark:text-blue-400'
      )}
    >
      <Icon
        name={
          insight.type === 'warning'
            ? 'alertCircle'
            : insight.type === 'success'
              ? 'checkCircle'
              : 'info'
        }
        className='mt-0.5 h-4 w-4 shrink-0'
      />
      <div className='flex-1'>
        <p className={cn('font-medium', !isExpanded && 'line-clamp-2')}>{insight.message}</p>
        {isLong && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className='hover:text-foreground/80 mt-1 text-xs font-semibold underline decoration-dotted underline-offset-2'
          >
            {isExpanded ? 'Show Less' : 'View More'}
          </button>
        )}
      </div>
    </div>
  );
};

export default BudgetOverview;
