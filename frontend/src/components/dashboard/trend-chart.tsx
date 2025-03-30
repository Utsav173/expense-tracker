'use client';

import React, { useMemo, useState } from 'react';
import { DateRange } from 'react-day-picker';
import DateRangePicker from '@/components/date-range-picker';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { format } from 'date-fns';
import NoData from '@/components/ui/no-data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface ChartDataPoint {
  x: number;
  y: number;
}

interface TrendChartProps {
  incomeData: ChartDataPoint[] | undefined;
  expenseData: ChartDataPoint[] | undefined;
  balanceData: ChartDataPoint[] | undefined;
}

type VisibilityKey = 'income' | 'expense' | 'balance';

const chartConfig = {
  income: { label: 'Income', color: 'hsl(142, 76%, 36%)' },
  expense: { label: 'Expense', color: 'hsl(0, 84%, 60%)' },
  balance: { label: 'Balance', color: 'hsl(214, 100%, 49%)' }
};

const formatCompactNumber = (value: number): string => {
  if (value === null || value === undefined || isNaN(value)) return '0';
  if (Math.abs(value) < 1000) return value.toString();

  const units = ['K', 'M', 'B', 'T'];
  let unitIndex = 0;
  let absValue = Math.abs(value);

  while (absValue >= 1000 && unitIndex < units.length - 1) {
    absValue /= 1000;
    unitIndex++;
  }

  const formattedValue = absValue.toFixed(1).replace(/\.0$/, '');
  return '₹' + (value < 0 ? '-' : '') + formattedValue + units[unitIndex];
};

const formatCombinedChartData = (
  incomeData: ChartDataPoint[] = [],
  expenseData: ChartDataPoint[] = [],
  balanceData: ChartDataPoint[] = [],
  startDate?: Date | null,
  endDate?: Date | null
) => {
  const combinedMap = new Map<
    string,
    { date: string; income?: number; expense?: number; balance?: number }
  >();

  const processData = (data: ChartDataPoint[], key: 'income' | 'expense' | 'balance') => {
    (data || []).forEach((point) => {
      const date = new Date(point.x * 1000);
      if (isNaN(date.getTime())) return;

      if (startDate && date < startDate) return;
      const adjustedEndDate = endDate ? new Date(endDate.getTime() + 86400000) : null;
      if (adjustedEndDate && date >= adjustedEndDate) return;

      const dateStr = format(date, 'MMM dd');
      if (!combinedMap.has(dateStr)) combinedMap.set(dateStr, { date: dateStr });
      combinedMap.get(dateStr)![key] = point.y;
    });
  };

  processData(incomeData, 'income');
  processData(expenseData, 'expense');
  processData(balanceData, 'balance');

  return Array.from(combinedMap.values()).sort(
    (a, b) =>
      new Date(`2000-${a.date.replace(' ', '-')}`).getTime() -
      new Date(`2000-${b.date.replace(' ', '-')}`).getTime()
  );
};

interface LegendItemPayload {
  value: string;
  color?: string;
  dataKey?: any;
}

function isVisibilityKey(key: any): key is VisibilityKey {
  return typeof key === 'string' && ['income', 'expense', 'balance'].includes(key);
}

const TrendChart: React.FC<TrendChartProps> = ({ incomeData, expenseData, balanceData }) => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [visibility, setVisibility] = useState({
    income: true,
    expense: true,
    balance: true
  });

  const combinedChartData = useMemo(
    () =>
      formatCombinedChartData(incomeData, expenseData, balanceData, dateRange?.from, dateRange?.to),
    [incomeData, expenseData, balanceData, dateRange]
  );

  const handleLegendClick = (o: LegendItemPayload) => {
    const { dataKey } = o;
    if (isVisibilityKey(dataKey)) {
      setVisibility((prev) => ({ ...prev, [dataKey]: !prev[dataKey] }));
    }
  };

  const renderLegend = (props: { payload?: LegendItemPayload[] }) => {
    const { payload } = props;
    return (
      <div style={{ textAlign: 'center', paddingTop: '10px' }}>
        {payload?.map((entry, index) => {
          const dataKey = entry.dataKey;
          if (!isVisibilityKey(dataKey)) return null;

          return (
            <span
              key={`item-${index}`}
              onClick={() => handleLegendClick(entry)}
              style={{
                margin: '0 10px',
                cursor: 'pointer',
                color: entry.color || '#000000',
                opacity: visibility[dataKey] ? 1 : 0.5,
                fontSize: '12px',
                textDecoration: visibility[dataKey] ? 'none' : 'line-through'
              }}
            >
              {entry.value}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <Card className='lg:col-span-1'>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <div>
          <CardTitle>Income, Expense & Balance Trend</CardTitle>
          <CardDescription>
            {dateRange?.from && dateRange?.to
              ? `Activity from ${format(dateRange.from, 'PP')} to ${format(dateRange.to, 'PP')}`
              : 'Daily activity overview (all time)'}
          </CardDescription>
        </div>
        <DateRangePicker dateRange={dateRange} setDateRange={setDateRange} className='w-[280px]' />
      </CardHeader>
      <CardContent className='pl-2 pt-4'>
        {combinedChartData.length > 0 ? (
          <ResponsiveContainer width='100%' height={350}>
            <ComposedChart
              data={combinedChartData}
              margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray='3 3' vertical={false} strokeOpacity={0.5} />
              <XAxis
                dataKey='date'
                fontSize={12}
                tickLine={false}
                axisLine={false}
                interval={'preserveStartEnd'}
              />
              <YAxis
                yAxisId='left' // Only left Y-axis
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatCompactNumber} // Use compact formatter
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  borderColor: 'hsl(var(--border))',
                  borderRadius: 'var(--radius)',
                  fontSize: '12px',
                  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
                  padding: '8px 12px'
                }}
                formatter={(value: number, name: string) => [
                  formatCompactNumber(value), // Use compact formatter
                  name
                ]}
                cursor={{ fill: 'hsl(var(--accent))', fillOpacity: 0.1 }}
              />
              <Legend content={renderLegend} />

              <Bar
                yAxisId='left'
                dataKey='income'
                hide={!visibility.income}
                name='Income'
                fill={chartConfig.income.color}
                radius={[4, 4, 0, 0]}
                barSize={15}
              />
              <Bar
                yAxisId='left'
                dataKey='expense'
                hide={!visibility.expense}
                name='Expense'
                fill={chartConfig.expense.color}
                radius={[4, 4, 0, 0]}
                barSize={15}
              />
              <Line
                yAxisId='left'
                type='monotone'
                dataKey='balance'
                hide={!visibility.balance}
                name='Balance'
                stroke={chartConfig.balance.color}
                strokeWidth={2}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <div className='flex h-[350px] items-center justify-center'>
            <NoData message='No transaction data available for the selected period.' />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TrendChart;
