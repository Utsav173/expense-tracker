import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardDescription } from '@/components/ui/card';
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
  CartesianGrid,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
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
  ChartLegendContent
} from '@/components/ui/chart';
import { useIsMobile } from '@/hooks/use-mobile';
import Loader from '../ui/loader';

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
type ChartType = 'pie' | 'radar' | 'column' | 'donut';

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

// Enhanced custom tooltip component
const CustomTooltip = ({ active, payload, label, totalExpense }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const percentage = totalExpense > 0 ? (data.value / totalExpense) * 100 : 0;

    return (
      <div className='bg-background/95 min-w-[200px] rounded-lg border p-3 shadow-lg backdrop-blur-sm'>
        <div className='mb-2 flex items-center gap-2'>
          <div
            className='h-3 w-3 flex-shrink-0 rounded-full'
            style={{ backgroundColor: data.fill }}
          />
          <p className='text-foreground truncate text-sm font-medium'>{data.name}</p>
        </div>
        <div className='space-y-1'>
          <div className='flex items-center justify-between'>
            <span className='text-muted-foreground text-xs'>Amount:</span>
            <span className='text-foreground text-sm font-semibold'>
              {formatCurrency(data.value)}
            </span>
          </div>
          <div className='flex items-center justify-between'>
            <span className='text-muted-foreground text-xs'>Percentage:</span>
            <span className='text-accent-foreground text-sm font-medium'>
              {percentage.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

// Enhanced column chart tooltip
const ColumnTooltip = ({ active, payload, totalExpense }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const percentage = totalExpense > 0 ? (data.value / totalExpense) * 100 : 0;

    return (
      <div className='bg-background/95 min-w-[180px] rounded-lg border p-3 shadow-lg backdrop-blur-sm'>
        <div className='mb-2 flex items-center gap-2'>
          <div
            className='h-3 w-3 flex-shrink-0 rounded-sm'
            style={{ backgroundColor: data.fill }}
          />
          <p className='text-foreground text-sm font-medium'>{data.name}</p>
        </div>
        <div className='grid grid-cols-2 gap-2 text-xs'>
          <div className='text-muted-foreground'>Amount</div>
          <div className='text-foreground text-right font-semibold'>
            {formatCurrency(data.value)}
          </div>
          <div className='text-muted-foreground'>Share</div>
          <div className='text-accent-foreground text-right font-medium'>
            {percentage.toFixed(1)}%
          </div>
        </div>
      </div>
    );
  }
  return null;
};

// Enhanced radar chart tooltip
const RadarTooltip = ({ active, payload, totalExpense }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const percentage = totalExpense > 0 ? (data.value / totalExpense) * 100 : 0;

    return (
      <div className='bg-background/95 min-w-[180px] rounded-lg border p-3 shadow-lg backdrop-blur-sm'>
        <div className='mb-2 flex items-center gap-2'>
          <div className='bg-primary h-3 w-3 flex-shrink-0 rounded-full' />
          <p className='text-foreground text-sm font-medium'>{data.name}</p>
        </div>
        <div className='grid grid-cols-2 gap-2 text-xs'>
          <div className='text-muted-foreground'>Amount</div>
          <div className='text-foreground text-right font-semibold'>
            {formatCurrency(data.value)}
          </div>
          <div className='text-muted-foreground'>Share</div>
          <div className='text-accent-foreground text-right font-medium'>
            {percentage.toFixed(1)}%
          </div>
        </div>
      </div>
    );
  }
  return null;
};

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
          fill='var(--foreground)'
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
        className='opacity-100 drop-shadow-sm'
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
        className='opacity-80'
        onClick={(e) => e.stopPropagation()}
      />
      <path
        d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`}
        stroke='var(--foreground)'
        strokeWidth={1.5}
        fill='none'
      />
      <circle cx={ex} cy={ey} r={3} fill='var(--foreground)' stroke='none' />
      <text
        x={ex + (cos >= 0 ? 1 : -1) * 12}
        y={ey}
        textAnchor={textAnchor}
        fill='var(--foreground)'
        className='text-sm font-semibold'
      >
        {formatCurrency(value)}
      </text>
      <text
        x={ex + (cos >= 0 ? 1 : -1) * 12}
        y={ey}
        dy={18}
        textAnchor={textAnchor}
        fill='var(--muted-foreground)'
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
  chartTypes = ['pie', 'column', 'radar']
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
      const colorVar = item.name === otherCategoryName ? 'chart-other' : `chart-${(index % 8) + 1}`;

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
          aria-label={`Vertical bar chart showing spending breakdown by category for ${durationLabels[duration]}`}
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
                content={<ColumnTooltip totalExpense={totalExpense} />}
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

    if (chartType === 'radar') {
      const maxValue = Math.max(...formattedData.map((item) => item.value));
      const radarData = formattedData.map((item, index) => ({
        ...item,
        normalizedValue: (item.value / maxValue) * 100,
        color: item.fill,
        angle: (index * 360) / formattedData.length
      }));

      return (
        <ChartContainer
          config={chartConfig}
          className='mx-auto aspect-square h-[450px] max-sm:h-[320px]'
          aria-label={`Radar chart showing spending breakdown by category for ${durationLabels[duration]}`}
        >
          <ResponsiveContainer width='100%' height='100%'>
            <RadarChart
              data={radarData}
              margin={{ top: 40, right: 40, bottom: 40, left: 40 }}
              className='drop-shadow-lg'
            >
              <defs>
                <linearGradient id='radarGradient' x1='0' y1='0' x2='0' y2='1'>
                  <stop offset='0%' stopColor='var(--primary)' stopOpacity={0.3} />
                  <stop offset='100%' stopColor='var(--primary)' stopOpacity={0.05} />
                </linearGradient>
                <filter id='glow'>
                  <feGaussianBlur stdDeviation='2' result='coloredBlur' />
                  <feMerge>
                    <feMergeNode in='coloredBlur' />
                    <feMergeNode in='SourceGraphic' />
                  </feMerge>
                </filter>
              </defs>

              {/* Multi-layer grid for depth */}
              <PolarGrid
                stroke='var(--border)'
                strokeOpacity={0.15}
                strokeWidth={1}
                className='drop-shadow-sm'
              />
              <PolarGrid
                stroke='var(--primary)'
                strokeOpacity={0.08}
                strokeWidth={2}
                strokeDasharray='4 4'
              />

              <PolarAngleAxis
                dataKey='name'
                tick={{
                  fontSize: isMobile ? 11 : 13,
                  fill: 'var(--foreground)',
                  fontWeight: 500
                }}
                tickFormatter={(value) => truncateLabel(value, isMobile ? 8 : 12)}
                className='text-foreground font-medium'
              />

              <PolarRadiusAxis
                angle={90}
                domain={[0, 'dataMax']}
                tick={{
                  fontSize: 9,
                  fill: 'var(--muted-foreground)',
                  fontWeight: 400
                }}
                tickFormatter={(value) => formatCurrency(value)}
                className='text-muted-foreground'
                axisLine={false}
                tickLine={false}
              />

              <ChartTooltip
                content={<RadarTooltip totalExpense={totalExpense} />}
                cursor={{ stroke: 'var(--primary)', strokeWidth: 2, strokeOpacity: 0.5 }}
              />

              {/* Main radar area with gradient */}
              <Radar
                dataKey='value'
                stroke='var(--primary)'
                fill='url(#radarGradient)'
                strokeWidth={3}
                className='drop-shadow-lg'
                dot={{
                  r: 6,
                  fill: 'var(--primary)',
                  strokeWidth: 3,
                  stroke: 'var(--background)',
                  filter: 'url(#glow)'
                }}
                activeDot={{
                  r: 8,
                  fill: 'var(--primary)',
                  strokeWidth: 4,
                  stroke: 'var(--background)',
                  filter: 'url(#glow)'
                }}
              />

              {/* Additional accent radar for visual interest */}
              <Radar
                dataKey='normalizedValue'
                stroke='var(--chart-1)'
                fill='transparent'
                strokeWidth={1}
                strokeOpacity={0.3}
                strokeDasharray='3 3'
                dot={false}
              />
            </RadarChart>
          </ResponsiveContainer>
        </ChartContainer>
      );
    }

    return (
      <ChartContainer
        config={chartConfig}
        className='mx-auto aspect-square h-[400px] max-sm:h-[280px]'
        aria-label={`${chartType} chart showing spending breakdown by category for ${durationLabels[duration]}`}
      >
        <ResponsiveContainer width='100%' height='100%'>
          <PieChart>
            <ChartTooltip cursor={false} content={<CustomTooltip totalExpense={totalExpense} />} />
            <Pie
              activeIndex={activeIndex}
              activeShape={(props: any) =>
                renderActiveShape({ ...props, chartType } as ActiveShapeProps)
              }
              data={formattedData}
              cx='50%'
              cy='50%'
              innerRadius='0%'
              outerRadius={isMobile ? '70%' : '80%'}
              paddingAngle={2}
              dataKey='value'
              nameKey='name'
              onMouseEnter={onPieEnter}
              className='drop-shadow-sm outline-none focus:outline-none'
            >
              {formattedData.map((entry) => (
                <Cell
                  key={`cell-${entry.name}`}
                  fill={entry.fill}
                  className='opacity-90 transition-all duration-200 outline-none hover:scale-105 hover:opacity-100 hover:outline-none focus:outline-none active:outline-none'
                  style={{ outline: 'none', stroke: 'none' }}
                />
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
        <div className='text-muted-foreground bg-muted/20 flex-none border-t p-3 text-center text-xs'>
          Total Expense:{' '}
          <span className='text-foreground font-semibold'>{formatCurrency(totalExpense)}</span>
        </div>
      )}
    </Card>
  );
};
