'use client';

import React, { useCallback, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Sector,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import {
  AlertCircle,
  BarChart3,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon
} from 'lucide-react';
import { motion } from 'framer-motion';

import { Card, CardContent } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useAuth } from '@/components/providers/auth-provider';
import { cn, formatCurrency } from '@/lib/utils';
import NoData from '../ui/no-data';
import { useIsMobile } from '@/hooks/use-mobile';

interface AiChartRendererProps {
  chart: {
    type: 'auto' | 'bar' | 'line' | 'pie';
    data: any[];
  };
}

const COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  'var(--chart-6)',
  'var(--chart-7)'
];

const CustomTooltipContent = ({ active, payload, currency, chartType }: any) => {
  if (active && payload && payload.length) {
    const data = chartType === 'pie' ? payload[0].payload.payload : payload[0].payload;

    if (!data) return null;

    const name = data.name || data.date || data.category || data.text || data.description;
    return (
      <div className='bg-background/80 min-w-[200px] rounded-lg border p-3 shadow-lg backdrop-blur-sm'>
        <p className='text-foreground mb-2 font-medium'>{`${name}`}</p>
        {Object.entries(data).map(([key, value]) => {
          if (
            key.toLowerCase() !== 'name' &&
            key.toLowerCase() !== 'date' &&
            key.toLowerCase() !== 'category' &&
            key.toLowerCase() !== 'text' &&
            key.toLowerCase() !== 'description' &&
            typeof value === 'number'
          ) {
            return (
              <p key={key} className='text-muted-foreground text-sm'>
                {`${key.charAt(0).toUpperCase() + key.slice(1)}: `}
                <span className='text-foreground font-semibold'>
                  {formatCurrency(value as number, currency)}
                </span>
              </p>
            );
          }
          return null;
        })}
      </div>
    );
  }
  return null;
};

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, value } = props;

  const truncateLabel = (label: string, maxLength = 15) => {
    if (label.length > maxLength) {
      return `${label.substring(0, maxLength)}...`;
    }
    return label;
  };

  return (
    <g className='focus:outline-none' tabIndex={-1}>
      <text
        x={cx}
        y={cy - 10}
        textAnchor='middle'
        fill='var(--muted-foreground)'
        className='text-xs'
      >
        {truncateLabel(payload.name)}
      </text>
      <text
        x={cx}
        y={cy + 10}
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
        className='drop-shadow-md'
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

const AiChartRenderer: React.FC<AiChartRendererProps> = ({ chart }) => {
  const isMobile = useIsMobile();
  const { session } = useAuth();
  const user = session?.user;
  const currency = user?.preferredCurrency || 'INR';
  const [activeIndex, setActiveIndex] = useState(0);

  const onPieEnter = useCallback((_: any, index: number) => {
    setActiveIndex(index);
  }, []);

  const { categoryKey, valueKeys } = useMemo(() => {
    if (!chart.data || chart.data.length === 0) {
      return { categoryKey: undefined, valueKeys: [] };
    }
    const keys = Object.keys(chart.data[0]);
    const catKey = keys.find((k) =>
      ['name', 'category', 'date', 'text', 'description'].includes(k.toLowerCase())
    );
    const valKeys = keys.filter(
      (k) =>
        k !== catKey && typeof chart.data[0][k] === 'number' && k.toLowerCase() !== 'percentage'
    );
    return { categoryKey: catKey, valueKeys: valKeys };
  }, [chart.data]);

  const determineDefaultChartType = useCallback(() => {
    if (valueKeys.length === 1 && categoryKey !== 'date') return 'pie';
    if (categoryKey === 'date') return 'line';
    return 'bar';
  }, [categoryKey, valueKeys.length]);

  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie'>(determineDefaultChartType());

  if (!chart || !chart.data || chart.data.length === 0) {
    return (
      <Card className='mt-4'>
        <CardContent className='p-4'>
          <NoData message='No chart data available for this query.' icon={BarChart3} />
        </CardContent>
      </Card>
    );
  }

  if (!categoryKey || valueKeys.length === 0) {
    return (
      <Card className='mt-4'>
        <CardContent className='p-4'>
          <NoData message='Could not determine how to display the data.' icon={AlertCircle} />
        </CardContent>
      </Card>
    );
  }

  const yAxisFormatter = (tick: number) =>
    new Intl.NumberFormat('en-IN', {
      notation: 'compact',
      compactDisplay: 'short'
    }).format(tick);

  const labelFormatter = (label: string) => {
    if (typeof label !== 'string') {
      return label;
    }
    const maxLength = isMobile ? 10 : 15;
    if (label.length > maxLength) {
      return `${label.substring(0, maxLength)}...`;
    }
    return label;
  };

  const renderChart = () => {
    switch (chartType) {
      case 'pie': {
        if (valueKeys.length > 1) {
          return (
            <div className='text-muted-foreground flex h-full items-center justify-center p-4 text-center text-sm'>
              Pie/Donut charts can only display a single data series. Please select Bar or Line
              chart to compare multiple values.
            </div>
          );
        }
        let dataForPie = chart.data
          .map((item, index) => ({
            name: item[categoryKey],
            value: item[valueKeys[0]],
            fill: COLORS[index % COLORS.length]
          }))
          .sort((a, b) => b.value - a.value);

        if (dataForPie.length > 7) {
          const topItems = dataForPie.slice(0, 6);
          const otherValue = dataForPie.slice(6).reduce((acc, item) => acc + item.value, 0);
          dataForPie = [
            ...topItems,
            { name: 'Others', value: otherValue, fill: 'var(--chart-other)' }
          ];
        }

        return (
          <ResponsiveContainer width='100%' height={300}>
            <PieChart>
              <Pie
                activeIndex={activeIndex}
                activeShape={renderActiveShape}
                data={dataForPie}
                cx='50%'
                cy='50%'
                innerRadius={isMobile ? 50 : 70}
                outerRadius={isMobile ? 70 : 90}
                dataKey='value'
                nameKey='name'
                onMouseEnter={onPieEnter}
              >
                {dataForPie.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.fill}
                    className='stroke-background outline-none focus:outline-none'
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltipContent currency={currency} chartType='pie' />} />
              <Legend
                verticalAlign='bottom'
                iconSize={10}
                formatter={labelFormatter}
                wrapperStyle={{
                  fontSize: isMobile ? '10px' : '12px',
                  paddingTop: isMobile ? '15px' : '20px',
                  lineHeight: '1.5'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        );
      }
      case 'line': {
        return (
          <ResponsiveContainer width='100%' height={300}>
            <LineChart data={chart.data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray='3 3' stroke='var(--border)' />
              <XAxis
                dataKey={categoryKey}
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickMargin={5}
                interval='preserveStartEnd'
                tickFormatter={labelFormatter}
              />
              <YAxis
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={yAxisFormatter}
                width={isMobile ? 40 : 50}
              />
              <Tooltip content={<CustomTooltipContent currency={currency} chartType='line' />} />
              <Legend
                wrapperStyle={{ fontSize: isMobile ? '10px' : '12px' }}
                formatter={labelFormatter}
              />
              {valueKeys.map((key, index) => (
                <Line
                  key={key}
                  type='monotone'
                  dataKey={key}
                  stroke={COLORS[index % COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 3, strokeWidth: 1, fill: 'var(--background)' }}
                  activeDot={{ r: 6, strokeWidth: 2, stroke: 'var(--background)' }}
                  isAnimationActive
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );
      }
      case 'bar':
      default: {
        return (
          <ResponsiveContainer width='100%' height={300}>
            <BarChart data={chart.data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray='3 3' stroke='var(--border)' />
              <XAxis
                dataKey={categoryKey}
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickMargin={5}
                interval={0}
                tickFormatter={labelFormatter}
              />
              <YAxis
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={yAxisFormatter}
                width={isMobile ? 40 : 50}
              />
              <Tooltip
                content={<CustomTooltipContent currency={currency} chartType='bar' />}
                cursor={{ fill: 'transparent' }}
              />
              <Legend
                wrapperStyle={{ fontSize: isMobile ? '10px' : '12px' }}
                formatter={labelFormatter}
              />
              {valueKeys.map((key, index) => (
                <Bar
                  key={key}
                  dataKey={key}
                  fill={COLORS[index % COLORS.length]}
                  radius={[4, 4, 0, 0]}
                  isAnimationActive
                  fillOpacity={0.6}
                  activeBar={{ fillOpacity: 1, stroke: 'var(--background)', strokeWidth: 2 }}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );
      }
    }
  };

  return (
    <Card className='mt-4 w-full overflow-hidden transition-all duration-300'>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <CardContent className='p-2 pt-4 sm:p-4'>
          <div className='flex justify-end pb-2'>
            <ToggleGroup
              type='single'
              value={chartType}
              onValueChange={(value) => {
                if (value) setChartType(value as 'bar' | 'line' | 'pie');
              }}
              className='bg-muted/50 h-8 rounded-lg border p-1'
            >
              <ToggleGroupItem
                value='bar'
                aria-label='Bar chart'
                className='data-[state=on]:bg-background dark:data-[state=on]:bg-card h-6 w-8 px-2'
              >
                <BarChart3 className='h-4 w-4' />
              </ToggleGroupItem>
              <ToggleGroupItem
                value='line'
                aria-label='Line chart'
                className='data-[state=on]:bg-background dark:data-[state=on]:bg-card h-6 w-8 px-2'
              >
                <LineChartIcon className='h-4 w-4' />
              </ToggleGroupItem>
              <ToggleGroupItem
                value='pie'
                aria-label='Pie chart'
                className='data-[state=on]:bg-background dark:data-[state=on]:bg-card h-6 w-8 px-2'
                disabled={valueKeys.length > 1}
              >
                <PieChartIcon className='h-4 w-4' />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          {renderChart()}
        </CardContent>
      </motion.div>
    </Card>
  );
};

export default AiChartRenderer;
