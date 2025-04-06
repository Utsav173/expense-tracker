import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChangeIndicatorProps {
  change: number | undefined | null;
  inverse?: boolean;
  className?: string;
}

export const ChangeIndicator: React.FC<ChangeIndicatorProps> = ({
  change,
  inverse = false,
  className
}) => {
  if (change === undefined || change === null || isNaN(change)) {
    return <span className={cn('text-xs text-muted-foreground', className)}>--</span>;
  }

  const isPositiveActual = change > 0;
  const isNegativeActual = change < 0;

  const isPositiveDisplay = inverse ? isNegativeActual : isPositiveActual;
  const isNegativeDisplay = inverse ? isPositiveActual : isNegativeActual;

  const Icon = isPositiveDisplay ? TrendingUp : isNegativeDisplay ? TrendingDown : Minus;
  const colorClass = isPositiveDisplay
    ? 'text-green-500'
    : isNegativeDisplay
      ? 'text-red-500'
      : 'text-gray-500';

  return (
    <span
      className={cn(
        'flex w-full items-center justify-center text-center text-xs',
        colorClass,
        className
      )}
    >
      <Icon className='mr-1 h-3 w-3 flex-shrink-0' />
      {change.toFixed(1)}%
    </span>
  );
};
