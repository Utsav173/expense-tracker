'use client';
import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface LineChartProps {
  data: any[];
  options?: any;
}

export const LineChartComponent: React.FC<LineChartProps> = ({ data }) => {
  if (!data || data.length === 0) return null;

  const keys = Object.keys(data[0]).filter((key) => key !== 'date');

  return (
    <ResponsiveContainer width='100%' height={300}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray='3 3' stroke='hsl(var(--border))' />
        <XAxis
          dataKey='date'
          stroke='hsl(var(--muted-foreground))'
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke='hsl(var(--muted-foreground))'
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--background))',
            border: '1px solid hsl(var(--border))'
          }}
          labelStyle={{ color: 'hsl(var(--foreground))' }}
        />
        <Legend iconSize={10} />
        {keys.map((key, index) => (
          <Line
            key={key}
            type='monotone'
            dataKey={key}
            stroke={`hsl(var(--chart-${index + 1}))`}
            strokeWidth={2}
            dot={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
};
