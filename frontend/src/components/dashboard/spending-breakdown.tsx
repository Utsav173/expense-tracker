import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { transactionGetCategoryChart } from '@/lib/endpoints/transactions';
import { Skeleton } from '@/components/ui/skeleton';
import NoData from '../ui/no-data';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, Sector } from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tag } from 'lucide-react';
import { useToast } from '@/lib/hooks/useToast';
import { cn } from '@/lib/utils';

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  '#a0aec0', // Gray for 'Other'
  '#f6ad55', // Orange fallback
  '#4fd1c5' // Teal fallback
];

interface SpendingBreakdownProps {
  className?: string;
}

type DurationOption = 'thisMonth' | 'thisYear' | 'all';

// Active shape component for the pie chart
const renderActiveShape = (props: any) => {
  const RADIAN = Math.PI / 180;
  const {
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
    payload,
    percent,
    value
  } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <text
        x={cx}
        y={cy}
        dy={8}
        textAnchor='middle'
        fill={fill}
        className='text-base font-semibold'
      >
        {payload.name}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        fill={fill}
      />
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill='none' />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke='none' />
      <text
        x={ex + (cos >= 0 ? 1 : -1) * 12}
        y={ey}
        textAnchor={textAnchor}
        fill='hsl(var(--foreground))'
        className='text-sm'
      >{`${formatCurrency(value)}`}</text>
      <text
        x={ex + (cos >= 0 ? 1 : -1) * 12}
        y={ey}
        dy={18}
        textAnchor={textAnchor}
        fill='hsl(var(--muted-foreground))'
        className='text-xs'
      >
        {`(Rate ${(percent * 100).toFixed(1)}%)`}
      </text>
    </g>
  );
};

export const SpendingBreakdown: React.FC<SpendingBreakdownProps> = ({ className }) => {
  const [duration, setDuration] = useState<DurationOption>('thisMonth');
  const [activeIndex, setActiveIndex] = useState(0);
  const { showError } = useToast();

  const {
    data: chartData,
    isLoading,
    error,
    isFetching
  } = useQuery({
    queryKey: ['spendingBreakdown', duration],
    queryFn: () => transactionGetCategoryChart({ duration }),
    staleTime: 5 * 60 * 1000,
    retry: 1
  });

  useEffect(() => {
    if (error) {
      showError(`Spending Breakdown Error: ${(error as Error).message}`);
    }
  }, [error, showError]);

  const formattedData = useMemo(() => {
    if (!chartData || !chartData.name) return [];

    const expenseData = chartData.name
      .map((name, index) => ({
        name: name,
        value: chartData.totalExpense[index] || 0
      }))
      .filter((item) => item.value > 0);

    const sortedData = expenseData.sort((a, b) => b.value - a.value);
    const topN = 6; // Increased slightly
    const topData = sortedData.slice(0, topN);
    const otherValue = sortedData.slice(topN).reduce((sum, item) => sum + item.value, 0);

    const finalData = [...topData];
    if (otherValue > 0) {
      finalData.push({ name: 'Other Categories', value: otherValue });
    }

    return finalData.map((item, index) => ({
      ...item,
      fill: COLORS[index % COLORS.length]
    }));
  }, [chartData]);

  const totalExpense = useMemo(
    () => formattedData.reduce((sum, item) => sum + item.value, 0),
    [formattedData]
  );

  const durationLabels: Record<DurationOption, string> = {
    thisMonth: 'This Month',
    thisYear: 'This Year',
    all: 'All Time'
  };

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  return (
    <Card className={cn('flex flex-col', className)}>
      <CardHeader className='pb-2'>
        <div className='flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between'>
          <CardTitle className='flex items-center gap-2 text-lg font-semibold'>
            <Tag className='h-5 w-5 text-orange-500' />
            Spending Breakdown
          </CardTitle>
          <Select value={duration} onValueChange={(v) => setDuration(v as DurationOption)}>
            <SelectTrigger className='h-8 w-full text-xs sm:w-[150px]'>
              <SelectValue placeholder='Select Period' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='thisMonth'>This Month</SelectItem>
              <SelectItem value='thisYear'>This Year</SelectItem>
              <SelectItem value='all'>All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <CardDescription>Expenses by category for {durationLabels[duration]}.</CardDescription>
      </CardHeader>
      <CardContent className='flex flex-1 items-center justify-center pb-4 pt-0'>
        {isLoading || isFetching ? (
          <div className='flex h-full min-h-[250px] items-center justify-center'>
            <Skeleton className='h-[200px] w-[200px] rounded-full' />
          </div>
        ) : error ? (
          <div className='flex h-full min-h-[250px] items-center justify-center'>
            <NoData message='Could not load spending data.' icon='x-circle' />
          </div>
        ) : formattedData.length === 0 ? (
          <div className='flex h-full min-h-[250px] items-center justify-center'>
            <NoData message={`No expense data for ${durationLabels[duration]}.`} icon='inbox' />
          </div>
        ) : (
          <ResponsiveContainer width='100%' height={250}>
            <PieChart>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    const percentage = totalExpense > 0 ? (data.value / totalExpense) * 100 : 0;
                    return (
                      <div className='rounded-md border bg-background/80 p-2 shadow-sm backdrop-blur-sm'>
                        <p className='text-sm font-medium'>{data.name}</p>
                        <p className='text-xs text-muted-foreground'>
                          {formatCurrency(data.value)}
                          <span className='font-semibold'> ({percentage.toFixed(1)}%)</span>
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Pie
                activeIndex={activeIndex}
                activeShape={renderActiveShape}
                data={formattedData}
                cx='50%'
                cy='50%'
                innerRadius={60}
                outerRadius={80}
                fill='#8884d8'
                dataKey='value'
                onMouseEnter={onPieEnter}
              >
                {formattedData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.fill}
                    className='outline-none ring-0 focus:outline-none focus:ring-0'
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
      {!isLoading && !error && formattedData.length > 0 && (
        <div className='border-t p-3 text-center text-xs text-muted-foreground'>
          Total Expense:{' '}
          <span className='font-medium text-foreground'>{formatCurrency(totalExpense)}</span>
        </div>
      )}
    </Card>
  );
};
