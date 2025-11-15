'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { Card, CardContent } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useAuth } from '@/components/providers/auth-provider';
import { formatCurrency } from '@/lib/utils';
import NoData from '../ui/no-data';
import { useIsMobile } from '@/hooks/use-mobile';
import { Icon } from '@/components/ui/icon';
import { motion } from 'framer-motion';
import {
  ChartContainer,
  ChartTooltipContent,
  ChartLegendContent,
  ChartConfig
} from '@/components/ui/chart';
import { IconName } from '../ui/icon-map';

interface AiChartRendererProps {
  chart: {
    type: 'auto' | 'bar' | 'line' | 'pie';
    data: any[];
  };
}

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

const generateMonochromeScale = (color: string, count: number): string[] => {
  const matches = color.match(/\d+/g);
  if (!matches || matches.length < 2) {
    console.warn('Invalid color format for generateMonochromeScale:', color);
    return Array(count).fill('#CCCCCC'); // Return a default grey scale
  }
  const [hue, saturation] = matches.map(Number);
  const scale = [];
  const startLightness = 80;
  const endLightness = 30;
  const step = (startLightness - endLightness) / (count > 1 ? count - 1 : 1);

  for (let i = 0; i < count; i++) {
    const lightness = startLightness - i * step;
    scale.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
  }
  return scale;
};

const StatCard = ({
  icon,
  label,
  value
}: {
  icon: IconName;
  label: string;
  value: string | null;
}) => (
  <div className='bg-muted/50 flex items-center gap-3 rounded-lg p-3'>
    <Icon name={icon} className='text-muted-foreground h-5 w-5' />
    <div>
      <p className='text-muted-foreground text-xs'>{label}</p>
      <p className='text-sm font-semibold'>{value ?? 'N/A'}</p>
    </div>
  </div>
);

const AiChartRenderer: React.FC<AiChartRendererProps> = ({ chart }) => {
  const isMobile = useIsMobile();
  const { session } = useAuth();
  const user = session?.user;
  const currency = user?.preferredCurrency || 'INR';
  const [activeIndex, setActiveIndex] = useState(0);

  const onPieEnter = useCallback((_: any, index: number) => {
    setActiveIndex(index);
  }, []);

  const { categoryKey, valueKeys, chartConfig, formattedData } = useMemo(() => {
    if (!chart.data || chart.data.length === 0) {
      return {
        categoryKey: undefined,
        valueKeys: [],
        chartConfig: {},
        formattedData: []
      };
    }
    const keys = Object.keys(chart.data[0]);
    const catKey = keys.find((k) =>
      ['name', 'category', 'date', 'text', 'description'].includes(k.toLowerCase())
    );
    const valKeys = keys.filter(
      (k) =>
        k !== catKey && typeof chart.data[0][k] === 'number' && k.toLowerCase() !== 'percentage'
    );

    const config: ChartConfig = {};
    const data = chart.data.map((item) => {
      const newItem = { ...item };
      valKeys.forEach((key, index) => {
        const colorVar = `chart-${(index % 10) + 1}`;
        config[key] = {
          label: key.charAt(0).toUpperCase() + key.slice(1),
          color: `var(--${colorVar})`
        };
      });
      return newItem;
    });

    return {
      categoryKey: catKey,
      valueKeys: valKeys,
      chartConfig: config,
      formattedData: data
    };
  }, [chart.data]);

  const determineDefaultChartType = useCallback(() => {
    if (valueKeys.length === 1 && categoryKey !== 'date') return 'pie';
    if (categoryKey === 'date') return 'line';
    return 'bar';
  }, [categoryKey, valueKeys.length]);

  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie'>(
    chart.type !== 'auto' ? chart.type : determineDefaultChartType()
  );

  useEffect(() => {
    if (chart.type !== 'auto') {
      setChartType(chart.type);
    } else {
      setChartType(determineDefaultChartType());
    }
  }, [chart.type, determineDefaultChartType]);

  const isDenseData = formattedData.length > 30 && chartType === 'bar';

  const summaryStats = useMemo(() => {
    if (!isDenseData || valueKeys.length === 0) return null;
    const valueKey = valueKeys[0];
    const values = formattedData.map((item) => item[valueKey] || 0);
    const total = values.reduce((sum, val) => sum + val, 0);
    const avg = total / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values);

    return {
      total: isFinite(total) ? total : null,
      avg: isFinite(avg) ? avg : null,
      max: isFinite(max) ? max : null,
      min: isFinite(min) ? min : null
    };
  }, [isDenseData, formattedData, valueKeys]);

  if (!chart || !formattedData || formattedData.length === 0) {
    return (
      <Card>
        <CardContent className='p-4'>
          <NoData message='No chart data available for this query.' icon='barChart3' />
        </CardContent>
      </Card>
    );
  }

  if (!categoryKey || valueKeys.length === 0) {
    return (
      <Card>
        <CardContent className='p-4'>
          <NoData message='Could not determine how to display the data.' icon='alertCircle' />
        </CardContent>
      </Card>
    );
  }

  const yAxisFormatter = useCallback(
    (tick: number) =>
      new Intl.NumberFormat('en-IN', {
        notation: 'compact',
        compactDisplay: 'short'
      }).format(tick),
    []
  );

  const labelFormatter = useCallback(
    (label: string) => {
      if (typeof label !== 'string') {
        return label;
      }
      const maxLength = isMobile ? 10 : 15;
      if (label.length > maxLength) {
        return `${label.substring(0, maxLength)}...`;
      }
      return label;
    },
    [isMobile]
  );

  const renderChart = () => {
    switch (chartType) {
      case 'pie': {
        if (valueKeys.length > 1) {
          return (
            <div className='text-muted-foreground flex h-full items-center justify-center p-4 text-center text-sm'>
              Pie charts can only display a single data series. Please select Bar or Line.
            </div>
          );
        }
        const valueKey = valueKeys[0];
        const sortedData = formattedData
          .map((item) => ({
            name: item[categoryKey],
            value: item[valueKey]
          }))
          .sort((a, b) => b.value - a.value);

        const useMonochrome = sortedData.length > 7;
        const monochromeColors = useMonochrome
          ? generateMonochromeScale('260 100%', sortedData.length)
          : [];
        const legendPayload = useMonochrome
          ? sortedData.slice(0, 5).map((d, i) => ({
              value: d.name,
              type: 'square' as const,
              color: monochromeColors[i]
            }))
          : undefined;

        const dataForPie = sortedData.map((item, index) => ({
          ...item,
          fill: useMonochrome ? monochromeColors[index] : `var(--color-chart-${(index % 10) + 1})`
        }));

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
                paddingAngle={2}
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
              <Tooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => formatCurrency(value as number, currency)}
                    nameKey='name'
                  />
                }
              />
              <Legend
                payload={legendPayload as any[]}
                content={<ChartLegendContent nameKey='name' />}
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
            <LineChart data={formattedData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
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
              <Tooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => formatCurrency(value as number, currency)}
                  />
                }
              />
              <Legend content={<ChartLegendContent />} />
              {valueKeys.map((key) => (
                <Line
                  key={key}
                  type='monotone'
                  dataKey={key}
                  stroke={`var(--color-${key})`}
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
            <BarChart
              data={formattedData}
              margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
              barGap={isDenseData ? 1 : 4}
            >
              <CartesianGrid strokeDasharray='3 3' stroke='var(--border)' />
              <XAxis
                dataKey={categoryKey}
                fontSize={isDenseData ? 10 : 12}
                tickLine={false}
                axisLine={false}
                tickMargin={5}
                interval={isDenseData ? Math.floor(formattedData.length / 5) : 0}
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
                content={
                  <ChartTooltipContent
                    formatter={(value) => formatCurrency(value as number, currency)}
                  />
                }
                cursor={{ fill: 'var(--muted)', opacity: 0.5 }}
              />
              {!isDenseData && <Legend content={<ChartLegendContent />} />}
              {valueKeys.map((key) => (
                <Bar
                  key={key}
                  dataKey={key}
                  fill={`var(--color-${key})`}
                  radius={isDenseData ? [1, 1, 0, 0] : [4, 4, 0, 0]}
                  isAnimationActive
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );
      }
    }
  };

  return (
    <Card className='w-full overflow-hidden transition-all duration-300'>
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
                <Icon name='barChart3' className='h-4 w-4' />
              </ToggleGroupItem>
              <ToggleGroupItem
                value='line'
                aria-label='Line chart'
                className='data-[state=on]:bg-background dark:data-[state=on]:bg-card h-6 w-8 px-2'
              >
                <Icon name='lineChart' className='h-4 w-4' />
              </ToggleGroupItem>
              <ToggleGroupItem
                value='pie'
                aria-label='Pie chart'
                className='data-[state=on]:bg-background dark:data-[state=on]:bg-card h-6 w-8 px-2'
                disabled={valueKeys.length > 1}
              >
                <Icon name='pieChart' className='h-4 w-4' />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          <ChartContainer config={chartConfig}>{renderChart()}</ChartContainer>
          {summaryStats && (
            <div className='space-y-3'>
              <p className='text-muted-foreground text-sm font-medium'>
                Summary for {formattedData.length} data points:
              </p>
              <div className='grid grid-cols-2 gap-3 md:grid-cols-4'>
                <StatCard
                  icon='coins'
                  label='Total Amount'
                  value={
                    summaryStats.total !== null
                      ? formatCurrency(summaryStats.total, currency)
                      : null
                  }
                />
                <StatCard
                  icon='calculator'
                  label='Average'
                  value={
                    summaryStats.avg !== null ? formatCurrency(summaryStats.avg, currency) : null
                  }
                />
                <StatCard
                  icon='arrowUp'
                  label='Max Value'
                  value={
                    summaryStats.max !== null ? formatCurrency(summaryStats.max, currency) : null
                  }
                />
                <StatCard
                  icon='arrowDown'
                  label='Min Value'
                  value={
                    summaryStats.min !== null ? formatCurrency(summaryStats.min, currency) : null
                  }
                />
              </div>
            </div>
          )}
        </CardContent>
      </motion.div>
    </Card>
  );
};

export default AiChartRenderer;
