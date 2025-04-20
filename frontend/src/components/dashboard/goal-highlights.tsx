import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { SavingGoal } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import NoData from '../ui/no-data';
import { cn, formatCurrency } from '@/lib/utils';
import { Progress } from '../ui/progress';
import { Target } from 'lucide-react';
import Link from 'next/link';
import { Button } from '../ui/button';
import { formatDistanceToNowStrict, isValid, parseISO } from 'date-fns'; // Ensure date-fns is imported

interface GoalHighlightsProps {
  data: SavingGoal[] | undefined;
  isLoading: boolean;
  className?: string;
}

export const GoalHighlights: React.FC<GoalHighlightsProps> = ({ data, isLoading, className }) => {
  const highlightedGoals = data;

  return (
    <Card className={cn('flex flex-col', className)}>
      <CardContent className='scrollbar h-[350px] flex-grow space-y-4 overflow-y-auto py-4'>
        {isLoading ? (
          <div className='space-y-4'>
            {[...Array(3)].map((_, i) => (
              <div key={i} className='space-y-1'>
                <div className='flex justify-between'>
                  <Skeleton className='h-4 w-3/5' />
                  <Skeleton className='h-4 w-1/5' />
                </div>
                <Skeleton className='h-2 w-full' />
                <Skeleton className='h-3 w-2/5' />
              </div>
            ))}
          </div>
        ) : !highlightedGoals || highlightedGoals.length === 0 ? (
          <div className='flex h-full items-center justify-center'>
            <NoData message='No active saving goals.' icon='inbox' />
          </div>
        ) : (
          highlightedGoals.map((goal) => {
            const saved = goal.savedAmount || 0;
            const target = goal.targetAmount || 1;
            const progress = Math.min((saved / target) * 100, 100);
            const targetDate = goal.targetDate ? parseISO(goal.targetDate) : null;
            const isValidDate = targetDate && isValid(targetDate);
            const timeRemaining = isValidDate
              ? formatDistanceToNowStrict(targetDate, { addSuffix: true })
              : null;

            return (
              <div key={goal.id}>
                <div className='mb-1 flex items-start justify-between text-sm'>
                  <span className='truncate pr-2 font-medium'>{goal.name}</span>
                  <span className='flex-shrink-0 text-muted-foreground'>
                    {progress.toFixed(0)}%
                  </span>
                </div>
                <Progress value={progress} className='h-2' />
                <div className='mt-1 flex justify-between text-xs text-muted-foreground'>
                  <span>
                    {formatCurrency(saved)} / {formatCurrency(target)}
                  </span>
                  {timeRemaining && <span className='text-right'>Target: {timeRemaining}</span>}
                </div>
              </div>
            );
          })
        )}
      </CardContent>
      {!isLoading && highlightedGoals && highlightedGoals.length > 0 && (
        <div className='border-t p-3 text-center'>
          <Button variant='link' size='sm' asChild className='text-xs'>
            <Link href='/goal'>View All Goals</Link>
          </Button>
        </div>
      )}
    </Card>
  );
};
