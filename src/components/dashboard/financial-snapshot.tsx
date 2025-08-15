import React, { useMemo, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn, formatCurrency } from '@/lib/utils';
import type { AccountAPI } from '@/lib/api/api-types';
import { ChangeIndicator } from '@/components/ui/change-indicator';
import NoData from '../ui/no-data';
import Loader from '../ui/loader';
import { useAuth } from '@/components/providers/auth-provider';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import {
  eachWeekOfInterval,
  startOfWeek,
  endOfWeek,
  eachMonthOfInterval,
  startOfMonth,
  endOfMonth
} from 'date-fns';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';

interface FinancialSnapshotProps {
  data: AccountAPI.DashboardData | null | undefined;
  isLoading: boolean;
  className?: string;
  balanceChartData: AccountAPI.DashboardData['balanceChartData'] | undefined;
}

// Function to aggregate data by week or month
const aggregateData = (data: { timestamp: number; value: number }[]) => {
  if (data.length <= 90) {
    // Show daily for up to 3 months
    return data;
  }

  const firstDate = new Date(data[0].timestamp * 1000);
  const lastDate = new Date(data[data.length - 1].timestamp * 1000);
  const interval = { start: firstDate, end: lastDate };

  let periods;
  let getPeriodStart;
  let getPeriodEnd;

  if (data.length <= 365 * 2) {
    // Group by week for up to 2 years
    periods = eachWeekOfInterval(interval, { weekStartsOn: 1 });
    getPeriodStart = startOfWeek;
    getPeriodEnd = endOfWeek;
  } else {
    // Group by month for longer periods
    periods = eachMonthOfInterval(interval);
    getPeriodStart = startOfMonth;
    getPeriodEnd = endOfMonth;
  }

  return periods
    .map((periodDate) => {
      const start = getPeriodStart(periodDate).getTime() / 1000;
      const end = getPeriodEnd(periodDate).getTime() / 1000;

      const valuesInPeriod = data.filter((d) => d.timestamp >= start && d.timestamp <= end);

      if (valuesInPeriod.length === 0) {
        return null;
      }

      // Use the last value of the period for the most accurate representation of balance
      const lastValue = valuesInPeriod[valuesInPeriod.length - 1].value;

      return {
        timestamp: start,
        value: lastValue
      };
    })
    .filter(Boolean) as { timestamp: number; value: number }[];
};

export const FinancialSnapshot: React.FC<FinancialSnapshotProps> = ({
  data,
  isLoading,
  className,
  balanceChartData
}) => {
  const { session } = useAuth();
  const user = session?.user;
  const preferredCurrency = user?.preferredCurrency || 'INR';
  const cardRef = useRef<HTMLDivElement>(null);

  const { chartData, trend } = useMemo(() => {
    if (!balanceChartData || balanceChartData.length < 2) {
      return { chartData: [], trend: 'neutral' };
    }

    const rawData = balanceChartData.map((d) => ({ timestamp: d.x, value: d.y ?? 0 }));
    const aggregated = aggregateData(rawData);

    if (aggregated.length < 2) {
      return { chartData: [], trend: 'neutral' };
    }

    const firstValue = aggregated[0].value;
    const lastValue = aggregated[aggregated.length - 1].value;

    let trendStatus: 'positive' | 'negative' | 'neutral' = 'neutral';
    if (lastValue > firstValue) {
      trendStatus = 'positive';
    } else if (lastValue < firstValue) {
      trendStatus = 'negative';
    }

    return { chartData: aggregated, trend: trendStatus };
  }, [balanceChartData]);

  useGSAP(
    () => {
      if (chartData.length > 1 && cardRef.current) {
        const sparklinePath = cardRef.current.querySelector('.recharts-area-area path');
        const sparklineGradient = cardRef.current.querySelector('#balanceSparklineBg stop');

        if (sparklinePath) {
          const length = (sparklinePath as SVGPathElement).getTotalLength();
          gsap.set(sparklinePath, { strokeDasharray: length, strokeDashoffset: length });
          gsap.to(sparklinePath, {
            strokeDashoffset: 0,
            duration: 2,
            ease: 'power2.inOut',
            delay: 0.5
          });
        }
        if (sparklineGradient) {
          gsap.fromTo(
            sparklineGradient,
            { attr: { 'stop-opacity': 0 } },
            { attr: { 'stop-opacity': 0.8 }, duration: 1.5, ease: 'power2.in', delay: 1 }
          );
        }
      }
    },
    { scope: cardRef, dependencies: [chartData] }
  );

  if (isLoading) {
    return <Loader />;
  }

  if (!data) {
    return (
      <Card className={cn('col-span-1 sm:col-span-2 lg:col-span-4', className)}>
        <CardContent className='py-10'>
          <NoData message='Snapshot data unavailable.' icon='xCircle' />
        </CardContent>
      </Card>
    );
  }

  const primaryMetric = data.overallBalance;
  const income = data.overallIncome;
  const expense = data.overallExpense;
  const incomeChange = data.overallIncomeChange;
  const expenseChange = data.overallExpenseChange;

  const trendColorVar =
    trend === 'positive'
      ? 'var(--sparkline-color-positive)'
      : trend === 'negative'
        ? 'var(--sparkline-color-negative)'
        : 'var(--sparkline-color-neutral)';

  const gradientOpacity = 'var(--sparkline-gradient-opacity)';

  return (
    <Card
      ref={cardRef}
      className={cn(
        'relative col-span-1 flex h-full justify-center overflow-hidden shadow-md sm:col-span-2 lg:col-span-4',
        className
      )}
    >
      {chartData.length > 1 && (
        <div className='absolute inset-0 z-0 [mask-image:linear-gradient(to_top,transparent_0%,black_60%)] opacity-80 dark:opacity-70'>
          <ResponsiveContainer width='100%' height='100%'>
            <AreaChart
              data={chartData}
              margin={{
                top: 0,
                right: 0,
                left: 0,
                bottom: 0
              }}
            >
              <defs>
                <linearGradient id='balanceSparklineBg' x1='0' y1='0' x2='0' y2='1'>
                  <stop offset='2%' stopColor={trendColorVar} stopOpacity={gradientOpacity} />
                  <stop offset='100%' stopColor={trendColorVar} stopOpacity='0' />
                </linearGradient>
              </defs>
              <Area
                type='monotone'
                dataKey='value'
                stroke={trendColorVar}
                strokeWidth={2.5}
                fill='url(#balanceSparklineBg)'
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <CardContent className='relative z-10 my-auto flex flex-col items-center justify-center space-y-4 py-10 text-center'>
        <div>
          <p className='text-muted-foreground text-sm font-medium'>Overall Net Balance</p>
          <h2
            className={`text-4xl font-bold tracking-tight sm:text-5xl ${
              primaryMetric < 0 ? 'text-destructive' : 'text-foreground'
            }`}
          >
            {formatCurrency(primaryMetric, preferredCurrency)}
          </h2>
        </div>

        <div className='my-auto grid w-full max-w-lg grid-cols-1 gap-6 pt-4 sm:grid-cols-2'>
          <div className='text-center'>
            <p className='text-muted-foreground text-xs'>Total Income (Avg. Change)</p>
            <p className='text-success text-xl font-semibold'>
              {formatCurrency(income, preferredCurrency)}
            </p>
            <ChangeIndicator change={incomeChange} />
          </div>
          <div className='text-center'>
            <p className='text-muted-foreground text-xs'>Total Expense (Avg. Change)</p>
            <p className='text-destructive text-xl font-semibold'>
              {formatCurrency(expense, preferredCurrency)}
            </p>
            <ChangeIndicator change={expenseChange} inverse={true} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
