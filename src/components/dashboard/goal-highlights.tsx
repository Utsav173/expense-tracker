import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import NoData from '../ui/no-data';
import { cn, formatCurrency } from '@/lib/utils';
import { Progress } from '../ui/progress';
import Link from 'next/link';
import { Button } from '../ui/button';
import { formatDistanceToNowStrict, isValid, parseISO } from 'date-fns';
import Loader from '../ui/loader';
import { useQuery } from '@tanstack/react-query';
import { goalGetAll } from '@/lib/endpoints/goal';

interface GoalHighlightsProps {
  className?: string;
}

export const GoalHighlights: React.FC<GoalHighlightsProps> = ({ className }) => {
  const { data: highlightedGoals, isLoading } = useQuery({
    queryKey: ['goalsDashboard'],
    queryFn: () => goalGetAll({ page: 1, limit: 5, sortBy: 'targetDate', sortOrder: 'asc' }),
    staleTime: 15 * 60 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: true
  });

  if (isLoading) return <Loader />;

  if (!highlightedGoals || highlightedGoals.data.length === 0)
    return <NoData message='No active saving goals.' icon='inbox' />;

  return (
    <Card className={cn('flex flex-col', className)}>
      <CardContent className='h-auto max-h-[60vh] w-full overflow-y-auto p-0'>
        <div className='space-y-4 px-4 py-4'>
          {highlightedGoals.data.map((goal) => {
            const saved = goal.savedAmount || 0;
            const target = goal.targetAmount || 1;
            const progress = Math.min((saved / target) * 100, 100);
            const targetDate = goal.targetDate ? parseISO(goal.targetDate) : null;
            const isValidDate = targetDate && isValid(targetDate);
            const timeRemaining = isValidDate
              ? formatDistanceToNowStrict(targetDate, { addSuffix: true })
              : null;

            return (
              <div
                key={goal.id}
                className='rounded-lg border p-3 shadow-sm transition-all hover:shadow-md'
              >
                <div className='mb-2 flex items-start justify-between text-sm'>
                  <span className='truncate pr-2 font-medium'>{goal.name}</span>
                  <span className='text-muted-foreground shrink-0'>{progress.toFixed(0)}%</span>
                </div>
                <Progress value={progress} className='h-2 transition-all duration-500' />
                <div className='text-muted-foreground mt-2 flex justify-between text-xs'>
                  <span>
                    {formatCurrency(saved)} / {formatCurrency(target)}
                  </span>
                  {timeRemaining && <span className='text-right'>Target: {timeRemaining}</span>}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
      {!isLoading && highlightedGoals && highlightedGoals.data.length > 0 && (
        <div className='border-t p-3 text-center'>
          <Button variant='link' size='sm' asChild className='text-xs'>
            <Link href='/goal'>View All Goals</Link>
          </Button>
        </div>
      )}
    </Card>
  );
};
