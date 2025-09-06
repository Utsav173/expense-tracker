import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
    <Card className='border-l-primary from-primary/5 via-primary/3 relative overflow-hidden border-l-4 bg-gradient-to-r to-transparent'>
      <div className='from-primary/10 absolute inset-0 bg-gradient-to-br via-transparent to-transparent opacity-50' />
      <CardContent className='relative p-4'>
        <div className='flex items-start gap-4'>
          <div className='bg-primary/10 ring-primary/20 shadow-primary/20 hover:shadow-primary/30 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl shadow-lg ring-2 transition-all duration-300 hover:scale-110 hover:shadow-xl'>
            <Icon name='info' className='text-primary h-6 w-6' />
          </div>
          <div className='my-auto flex-1'>
            <div className='flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-3'>
              <p className='text-muted-foreground text-sm leading-relaxed'>
                Your portfolio has{' '}
                <span
                  className={cn(
                    'inline-block rounded-md px-2 py-0.5 text-base font-bold transition-all duration-300',
                    isProfitable
                      ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                      : 'bg-red-500/10 text-red-600 dark:text-red-400'
                  )}
                >
                  {isProfitable ? 'gained' : 'lost'}{' '}
                  {formatCurrency(Math.abs(metrics.totalGain), currency)}
                </span>{' '}
                <span className='text-muted-foreground/70'>
                  ({metrics.totalReturn.toFixed(1)}%) since inception
                </span>
              </p>
              <Badge
                variant={isProfitable ? 'success' : 'destructive'}
                className='w-fit shrink-0 shadow-md transition-all duration-300 hover:scale-105 hover:shadow-lg'
              >
                <Icon
                  name={isProfitable ? 'trendingUp' : 'trendingDown'}
                  className='mr-1.5 h-3.5 w-3.5'
                />
                {isProfitable ? 'Profitable' : 'Loss Position'}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
