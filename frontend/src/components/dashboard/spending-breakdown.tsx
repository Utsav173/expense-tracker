import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardDescription } from '@/components/ui/card';
import { transactionGetCategoryChart } from '@/lib/endpoints/transactions';
import { Skeleton } from '@/components/ui/skeleton';
import NoData from '../ui/no-data';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Sector,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useToast } from '@/lib/hooks/useToast';
import { cn } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ChartContainer,
  ChartConfig,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent
} from '@/components/ui/chart';
import { useIsMobile } from '@/hooks/use-mobile'; // Import useIsMobile

const truncateLabel = (label: string, max: number) =>
  label.length > max ? label.slice(0, max - 1) + '…' : label;

interface SpendingBreakdownProps {
  className?: string;
  accountId?: string;
  defaultDuration?: DurationOption;
  showDurationSelector?: boolean;
  chartTypes?: ChartType[];
}

type DurationOption = string | 'thisMonth' | 'thisYear' | 'all';
type ChartType = 'pie' | 'donut' | 'column';

interface ActiveShapeProps {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  startAngle: number;
  endAngle: number;
  fill: string;
  payload: {
    name: string;
    value: number;
  };
  percent: number;
  value: number;
  chartType: ChartType;
}

const renderActiveShape = (props: ActiveShapeProps) => {
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
    value,
    chartType
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
      {chartType === 'donut' && (
        <text
          x={cx}
          y={cy}
          dy={8}
          textAnchor='middle'
          fill={'hsl(var(--foreground))'}
          className='text-base font-semibold'
        >
          {truncateLabel(payload.name, 15)}
        </text>
      )}
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        className='opacity-100'
        onClick={(e) => e.stopPropagation()}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        fill={fill}
        className='opacity-90'
        onClick={(e) => e.stopPropagation()}
      />
      <path
        d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`}
        stroke={'hsl(var(--foreground))'}
        fill='none'
      />
      <circle cx={ex} cy={ey} r={2} fill={'hsl(var(--foreground))'} stroke='none' />
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
        {`(${(percent * 100).toFixed(1)}%)`}
      </text>
    </g>
  );
};

export const SpendingBreakdown: React.FC<SpendingBreakdownProps> = ({
  className,
  accountId,
  defaultDuration = 'thisMonth',
  showDurationSelector = true,
  chartTypes = ['pie', 'column', 'donut']
}) => {
  const [duration, setDuration] = useState<DurationOption>(defaultDuration);
  const [activeIndex, setActiveIndex] = useState(0);
  const [chartType, setChartType] = useState<ChartType>(chartTypes[0]);
  const { showError } = useToast();
  const isMobile = useIsMobile(); // Use the hook

  const {
    data: chartData,
    isLoading,
    error,
    isFetching
  } = useQuery({
    queryKey: ['spendingBreakdown', duration, accountId],
    queryFn: () => transactionGetCategoryChart({ duration, accountId }),
    staleTime: 5 * 60 * 1000,
    retry: 1,
    refetchOnMount: true,
    refetchOnWindowFocus: true
  });

  useEffect(() => {
    if (error) {
      showError(`Spending Breakdown Error: ${(error as Error).message}`);
    }
  }, [error, showError]);

  const { formattedData, chartConfig } = useMemo(() => {
    if (!chartData || !chartData.name) return { formattedData: [], chartConfig: {} };

    const expenseData = chartData.name
      .map((name, index) => ({
        name: name,
        value: chartData.totalExpense[index] || 0
      }))
      .filter((item) => item.value > 0);

    const sortedData = expenseData.sort((a, b) => b.value - a.value);
    const topN = 6;
    const topData = sortedData.slice(0, topN);
    const otherValue = sortedData.slice(topN).reduce((sum, item) => sum + item.value, 0);

    const finalData = [...topData];
    const otherCategoryName = 'Other Categories';
    if (otherValue > 0) {
      finalData.push({ name: otherCategoryName, value: otherValue });
    }

    const config: ChartConfig = {};
    const formatted = finalData.map((item, index) => {
      const configKey = item.name.replace(/[^a-zA-Z0-9]/g, '_');
      const colorVar = item.name === otherCategoryName ? 'chart-other' : `chart-${(index % 8) + 1}`;

      config[configKey] = {
        label: item.name,
        color: `hsl(var(--${colorVar}))`
      };
      return { ...item, fill: `var(--color-${configKey})`, configKey };
    });

    return { formattedData: formatted, chartConfig: config };
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

  const renderChart = () => {
    if (chartType === 'column') {
      return (
        <ChartContainer
          config={chartConfig}
          className='h-[400px] w-full'
          aria-label={`Vertical bar chart showing spending breakdown by category for ${durationLabels[duration]}`} // Accessibility
        >
          <ResponsiveContainer width='100%' height='100%'>
            <BarChart
              data={formattedData}
              layout='vertical'
              margin={{ top: 5, right: 5, left: 5, bottom: 5 }} // Adjust margins
              barSize={isMobile ? 15 : 20} // Smaller bars on mobile
            >
              <CartesianGrid horizontal={false} strokeDasharray='3 3' />
              <XAxis type='number' hide />
              <YAxis
                dataKey='name'
                type='category'
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: isMobile ? 10 : 12 }} // Smaller font on mobile
                tickFormatter={(value) => truncateLabel(value, isMobile ? 10 : 15)} // Shorter labels on mobile
                width={isMobile ? 80 : 100} // Less width on mobile
              />
              <ChartTooltip
                cursor={{ fill: 'hsl(var(--muted))' }}
                content={
                  <ChartTooltipContent
                    nameKey='name'
                    formatter={(value) => formatCurrency(value as number)}
                  />
                }
              />
              <Bar dataKey='value' radius={[0, 4, 4, 0]}>
                {formattedData.map((entry) => (
                  <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      );
    }

    // For Pie and Donut charts
    return (
      <ChartContainer
        config={chartConfig}
        className='mx-auto aspect-square h-[400px] max-sm:h-[280px]'
        aria-label={`${chartType} chart showing spending breakdown by category for ${durationLabels[duration]}`} // Accessibility
      >
        <ResponsiveContainer width='100%' height='100%'>
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  hideLabel
                  formatter={(value, name) => {
                    const percentage = totalExpense > 0 ? (Number(value) / totalExpense) * 100 : 0;
                    return (
                      <div className='flex flex-col'>
                        <span className='text-sm font-medium'>{name}</span>
                        <span className='text-muted-foreground text-xs'>
                          {formatCurrency(value as number)} ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                    );
                  }}
                />
              }
            />
            <Pie
              activeIndex={activeIndex}
              activeShape={(props: any) =>
                renderActiveShape({ ...props, chartType } as ActiveShapeProps)
              }
              data={formattedData}
              cx='50%'
              cy='50%'
              innerRadius={chartType === 'donut' ? '60%' : '0%'}
              outerRadius={isMobile ? '70%' : '80%'} // Slightly smaller on mobile
              paddingAngle={2}
              dataKey='value'
              nameKey='name'
              onMouseEnter={onPieEnter}
              className='outline-none focus:outline-none'
            >
              {formattedData.map((entry) => (
                <Cell
                  key={`cell-${entry.name}`}
                  fill={entry.fill}
                  className='opacity-90 transition-opacity outline-none hover:opacity-100 hover:outline-none focus:outline-none active:outline-none'
                  style={{ outline: 'none', stroke: 'none' }}
                />
              ))}
            </Pie>
            {chartType === 'pie' && formattedData.length > 0 && (
              <ChartLegend content={<ChartLegendContent nameKey='name' />} />
            )}
          </PieChart>
        </ResponsiveContainer>
      </ChartContainer>
    );
  };

  return (
    <Card className={cn('flex h-full flex-col', className)}>
      <CardHeader className='flex flex-none gap-2 pb-2'>
        <div className='flex flex-col items-center justify-between gap-4 sm:flex-row'>
          {showDurationSelector && (
            <Select value={duration} onValueChange={(v) => setDuration(v as DurationOption)}>
              <SelectTrigger className='h-8 w-[150px] text-xs'>
                <SelectValue placeholder='Select Period' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='thisMonth'>This Month</SelectItem>
                <SelectItem value='thisYear'>This Year</SelectItem>
                <SelectItem value='all'>All Time</SelectItem>
              </SelectContent>
            </Select>
          )}
          <Tabs
            defaultValue={chartType}
            onValueChange={(v) => setChartType(v as ChartType)}
            className='w-full'
          >
            <TabsList className={`grid w-full grid-cols-${chartTypes.length}`}>
              {chartTypes.map((type: string) => (
                <TabsTrigger key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
        <CardDescription className='mx-auto mt-2 text-center'>
          Expenses by category for {durationLabels[duration]}.{accountId && ' (Account specific)'}
        </CardDescription>
      </CardHeader>
      <CardContent className='min-h-[400px] flex-1 pt-4'>
        {isLoading || isFetching ? (
          <div className='flex h-full items-center justify-center'>
            <Skeleton className='h-[200px] w-[200px] rounded-full' />
          </div>
        ) : error ? (
          <div className='flex h-full items-center justify-center'>
            <NoData message='Could not load spending data.' icon='x-circle' />
          </div>
        ) : formattedData.length === 0 ? (
          <div className='flex h-full items-center justify-center'>
            <NoData message={`No expense data for ${durationLabels[duration]}.`} icon='inbox' />
          </div>
        ) : (
          <div className='h-full w-full'>{renderChart()}</div>
        )}
      </CardContent>
      {!isLoading && !error && formattedData.length > 0 && (
        <div className='text-muted-foreground flex-none border-t p-3 text-center text-xs'>
          Total Expense:{' '}
          <span className='text-foreground font-medium'>{formatCurrency(totalExpense)}</span>
        </div>
      )}
    </Card>
  );
};
