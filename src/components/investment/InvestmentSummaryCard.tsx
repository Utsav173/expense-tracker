import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { cn, formatCurrency } from '@/lib/utils';

interface InvestmentSummaryCardProps {
  metrics: {
    totalGain: number;
    totalReturn: number;
  };
  currency: string;
}

export const InvestmentSummaryCard: React.FC<InvestmentSummaryCardProps> = ({
  metrics,
  currency
}) => {
  const isProfitable = metrics.totalGain >= 0;

  return (
    <Card className='border-border/50 bg-card/50 relative overflow-hidden'>
      <CardContent className='relative flex flex-col items-center justify-between gap-4 p-4 sm:flex-row'>
        <div className='flex items-center gap-3'>
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
              isProfitable ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
            )}
          >
            <Icon name={isProfitable ? 'trendingUp' : 'trendingDown'} className='h-5 w-5' />
          </div>
          <div>
            <p className='text-muted-foreground text-sm'>Overall P/L</p>
            <p
              className={cn(
                'text-xl font-bold',
                isProfitable
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              )}
            >
              {formatCurrency(metrics.totalGain, currency)}
            </p>
          </div>
        </div>
        <p className='text-muted-foreground text-center text-sm sm:text-right'>
          That's a{' '}
          <span
            className={cn(
              'font-semibold',
              isProfitable ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            )}
          >
            {metrics.totalReturn.toFixed(2)}% {isProfitable ? 'gain' : 'loss'}
          </span>{' '}
          on your total investment.
        </p>
      </CardContent>
    </Card>
  );
};
