import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { transactionGetCategoryChart } from '@/lib/endpoints/transactions';

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
  ChartLegend,
  ChartLegendContent,
  ChartTooltipContent
} from '@/components/ui/chart';
import { useIsMobile } from '@/hooks/use-mobile';
import Loader from '../ui/loader';

const truncateLabel = (label: string, max: number) =>
  label.length > max ? label.slice(0, max - 1) + '…' : label;

// New custom tooltip for Pie and Donut charts
const CustomTooltipContent = ({ active, payload, totalExpense }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    const { name, value } = data;
    const percentage = totalExpense > 0 ? (value / totalExpense) * 100 : 0;

    return (
      <div className='bg-background/90 min-w-[180px] rounded-lg border p-3 text-sm shadow-lg backdrop-blur-sm'>
        <div className='flex items-center gap-2'>
          <span
            className='h-2.5 w-2.5 shrink-0 rounded-[2px]'
            style={{ backgroundColor: data.payload.fill }}
          />
          <p className='text-foreground font-semibold'>{name}</p>
        </div>
        <p className='text-foreground mt-2 text-lg font-bold'>{formatCurrency(value)}</p>
        <p className='text-muted-foreground text-xs'>{percentage.toFixed(1)}% of total</p>
      </div>
    );
  }

  return null;
};

interface SpendingBreakdownProps {
  className?: string;
  accountId?: string;
  defaultDuration?: DurationOption;
  showDurationSelector?: boolean;
  chartTypes?: ChartType[];
}

type DurationOption = string | 'thisMonth' | 'thisYear' | 'all';
type ChartType = 'pie' | 'donut' | 'column';

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, value } = props;

  return (
    <g>
      <text
        x={cx}
        y={cy - 8}
        dy={8}
        textAnchor='middle'
        fill='var(--muted-foreground)'
        className='text-xs'
      >
        {truncateLabel(payload.name, 12)}
      </text>
      <text
        x={cx}
        y={cy + 8}
        dy={8}
        textAnchor='middle'
        fill='var(--foreground)'
        className='text-lg font-bold'
      >
        {formatCurrency(value)}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        className='drop-shadow-sm'
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 4}
        outerRadius={outerRadius + 8}
        fill={fill}
      />
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
  const isMobile = useIsMobile();

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
      const colorVar =
        item.name === otherCategoryName ? 'chart-neutral' : `chart-${(index % 5) + 1}`;

      config[configKey] = {
        label: item.name,
        color: `var(--${colorVar})`
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
          aria-label={`Vertical bar chart showing spending breakdown for ${durationLabels[duration]}`}
        >
          <ResponsiveContainer width='100%' height='100%'>
            <BarChart
              data={formattedData}
              layout='vertical'
              margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
              barSize={isMobile ? 16 : 22}
            >
              <CartesianGrid
                horizontal={false}
                strokeDasharray='3 3'
                stroke='var(--border)'
                opacity={0.3}
              />
              <XAxis type='number' hide />
              <YAxis
                dataKey='name'
                type='category'
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: isMobile ? 10 : 12, fill: 'var(--muted-foreground)' }}
                tickFormatter={(value) => truncateLabel(value, isMobile ? 10 : 15)}
                width={isMobile ? 80 : 100}
              />
              <ChartTooltip
                cursor={{ fill: 'var(--muted)', opacity: 0.1 }}
                content={
                  <ChartTooltipContent
                    formatter={(value) => formatCurrency(value as number)}
                    nameKey='name'
                  />
                }
              />
              <Bar dataKey='value' radius={[0, 6, 6, 0]} className='drop-shadow-sm'>
                {formattedData.map((entry) => (
                  <Cell
                    key={`cell-${entry.name}`}
                    fill={entry.fill}
                    className='transition-opacity duration-200 hover:opacity-80'
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      );
    }

    if (chartType === 'donut') {
      return (
        <ChartContainer
          config={chartConfig}
          className='mx-auto aspect-square h-[400px] max-sm:h-[280px]'
          aria-label={`Donut chart showing spending breakdown for ${durationLabels[duration]}`}
        >
          <ResponsiveContainer>
            <PieChart>
              <ChartTooltip content={<CustomTooltipContent totalExpense={totalExpense} />} />
              <Pie
                activeIndex={activeIndex}
                activeShape={renderActiveShape}
                data={formattedData}
                dataKey='value'
                nameKey='name'
                cx='50%'
                cy='50%'
                outerRadius={isMobile ? '90%' : '80%'}
                innerRadius={isMobile ? '65%' : '60%'}
                paddingAngle={2}
                onMouseEnter={onPieEnter}
              >
                {formattedData.map((entry) => (
                  <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                ))}
              </Pie>
              <ChartLegend
                content={<ChartLegendContent nameKey='name' />}
                wrapperStyle={{ paddingTop: '20px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      );
    }

    return (
      <ChartContainer
        config={chartConfig}
        className='mx-auto aspect-square h-[400px] max-sm:h-[280px]'
        aria-label={`Pie chart showing spending breakdown for ${durationLabels[duration]}`}
      >
        <ResponsiveContainer>
          <PieChart>
            <ChartTooltip content={<CustomTooltipContent totalExpense={totalExpense} />} />
            <Pie
              data={formattedData}
              dataKey='value'
              nameKey='name'
              cx='50%'
              cy='50%'
              outerRadius={'80%'}
              innerRadius={'0%'}
              paddingAngle={2}
            >
              {formattedData.map((entry) => (
                <Cell key={`cell-${entry.name}`} fill={entry.fill} />
              ))}
            </Pie>
            <ChartLegend
              content={<ChartLegendContent nameKey='name' />}
              wrapperStyle={{ paddingTop: '20px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </ChartContainer>
    );
  };

  return (
    <Card className={cn('flex h-full flex-col shadow-sm', className)}>
      <CardHeader className='flex flex-none gap-2 pb-2'>
        <div className='flex flex-col items-center justify-between gap-4 sm:flex-row'>
          <div className='flex-1'>
            <h3 className='text-lg font-semibold'>Spending Breakdown</h3>
            <p className='text-muted-foreground text-sm'>Top expense categories</p>
          </div>
          {showDurationSelector && (
            <Select value={duration} onValueChange={(v) => setDuration(v as DurationOption)}>
              <SelectTrigger className='border-input/50 hover:border-input h-8 w-[150px] text-xs transition-colors'>
                <SelectValue placeholder='Select Period' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='thisMonth'>This Month</SelectItem>
                <SelectItem value='thisYear'>This Year</SelectItem>
                <SelectItem value='all'>All Time</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
        <div className='pt-4'>
          <Tabs
            defaultValue={chartType}
            onValueChange={(v) => setChartType(v as ChartType)}
            className='w-full'
          >
            <TabsList className={`grid w-full grid-cols-${chartTypes.length} bg-muted/50`}>
              {chartTypes.map((type: string) => (
                <TabsTrigger
                  key={type}
                  value={type}
                  className='data-[state=active]:bg-background transition-all data-[state=active]:shadow-sm'
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className='min-h-[400px] flex-1 pt-4'>
        {isLoading || isFetching ? (
          <Loader />
        ) : error ? (
          <div className='flex h-full items-center justify-center'>
            <NoData message='Could not load spending data.' icon='xCircle' />
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
        <div className='text-muted-foreground bg-muted/20 flex-none border-t p-3 text-center text-xs'>
          Total Expense:{' '}
          <span className='text-foreground font-semibold'>{formatCurrency(totalExpense)}</span>
        </div>
      )}
    </Card>
  );
};
