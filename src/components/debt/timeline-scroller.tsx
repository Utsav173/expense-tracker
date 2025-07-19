'use client';

import React, { memo, useMemo } from 'react';
import { cn, formatCurrency } from '@/lib/utils';
import { Payment } from '@/lib/types';
import { format } from 'date-fns';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertTriangle } from 'lucide-react';

interface TimelineScrollerProps {
  schedule: Payment[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}

const StatusBadge = memo(({ status }: { status: Payment['status'] }) => {
  switch (status) {
    case 'settled':
      return (
        <Badge variant='success' className='gap-1.5'>
          <CheckCircle className='h-3 w-3' />
          Paid
        </Badge>
      );
    case 'due':
      return (
        <Badge variant='destructive' className='gap-1.5'>
          <AlertTriangle className='h-3 w-3' />
          Due
        </Badge>
      );
    case 'upcoming':
      return (
        <Badge variant='info' className='gap-1.5'>
          <Clock className='h-3 w-3' />
          Upcoming
        </Badge>
      );
    default:
      return null;
  }
});
StatusBadge.displayName = 'StatusBadge';

const CustomTooltip = memo(({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data: Payment & { installmentNumber: number } = payload[0].payload;
    return (
      <div className='bg-popover text-popover-foreground min-w-[220px] rounded-lg border p-3 shadow-lg'>
        <div className='flex items-center justify-between gap-4'>
          <p className='text-sm font-semibold'>Installment {data.installmentNumber}</p>
          <StatusBadge status={data.status} />
        </div>
        <p className='text-muted-foreground text-xs'>{format(data.date, 'MMM d, yyyy')}</p>

        <div className='border-border my-3 border-t' />

        <div className='space-y-1.5 text-sm'>
          <div className='flex justify-between'>
            <span className='text-muted-foreground flex items-center gap-2'>
              <div
                className='h-2.5 w-2.5 rounded-full'
                style={{ backgroundColor: 'var(--chart-1)' }}
              />
              Principal
            </span>
            <span className='font-medium'>{formatCurrency(data.principalForPeriod)}</span>
          </div>
          <div className='flex justify-between'>
            <span className='text-muted-foreground flex items-center gap-2'>
              <div
                className='h-2.5 w-2.5 rounded-full'
                style={{ backgroundColor: 'var(--chart-2)' }}
              />
              Interest
            </span>
            <span className='font-medium'>{formatCurrency(data.interestForPeriod)}</span>
          </div>
        </div>

        <div className='border-border my-2 border-t' />

        <div className='flex justify-between font-bold'>
          <span>Total Payment</span>
          <span>{formatCurrency(data.installmentAmount)}</span>
        </div>
      </div>
    );
  }
  return null;
});
CustomTooltip.displayName = 'CustomTooltip';

export const TimelineScroller: React.FC<TimelineScrollerProps> = ({
  schedule,
  selectedIndex,
  onSelect
}) => {
  const chartData = useMemo(
    () =>
      schedule.map((payment, index) => ({
        ...payment,
        installmentNumber: index + 1
      })),
    [schedule]
  );

  const handleBarClick = (data: any) => {
    if (data && data.activePayload && data.activePayload.length > 0) {
      const index = data.activePayload[0].payload.installmentNumber - 1;
      onSelect(index);
    }
  };

  return (
    <div className='h-[250px] w-full'>
      <ResponsiveContainer width='100%' height='100%'>
        <BarChart
          data={chartData}
          onClick={handleBarClick}
          margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
          barCategoryGap='20%'
        >
          <CartesianGrid strokeDasharray='3 3' stroke='var(--border)' vertical={false} />
          <XAxis
            dataKey='installmentNumber'
            tickLine={false}
            axisLine={false}
            stroke='var(--muted-foreground)'
            fontSize={12}
            interval={Math.floor(chartData.length / 10)}
            tick={({ x, y, payload }) => (
              <g transform={`translate(${x},${y})`}>
                <text
                  x={0}
                  y={0}
                  dy={16}
                  textAnchor='middle'
                  fill={
                    selectedIndex === payload.index ? 'var(--primary)' : 'var(--muted-foreground)'
                  }
                  className={cn(
                    'text-xs transition-all',
                    selectedIndex === payload.index && 'font-bold'
                  )}
                >
                  {payload.value}
                </text>
              </g>
            )}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            stroke='var(--muted-foreground)'
            fontSize={12}
            tickFormatter={(value) => formatCurrency(value)}
            width={60}
          />
          <Tooltip cursor={{ fill: 'var(--accent)' }} content={<CustomTooltip />} />
          <ReferenceLine
            x={selectedIndex + 1}
            stroke='var(--primary)'
            strokeWidth={2}
            ifOverflow='extendDomain'
          />
          <Bar
            dataKey='principalForPeriod'
            stackId='a'
            fill='var(--chart-1)'
            className='cursor-pointer'
          />
          <Bar
            dataKey='interestForPeriod'
            stackId='a'
            fill='var(--chart-2)'
            radius={[4, 4, 0, 0]}
            className='cursor-pointer'
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
