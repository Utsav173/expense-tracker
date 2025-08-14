import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import NoData from '../ui/no-data';
import { cn, formatCurrency } from '@/lib/utils';
import { Progress } from '../ui/progress';
import Link from 'next/link';
import { Button } from '../ui/button';
import { formatDistanceToNowStrict, isValid, parseISO, isPast, differenceInDays } from 'date-fns';
import Loader from '../ui/loader';
import { useQuery } from '@tanstack/react-query';
import { goalGetAll } from '@/lib/endpoints/goal';
import { ScrollArea } from '../ui/scroll-area';
import { Icon } from '../ui/icon';

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

  const goalAnalysis = React.useMemo(() => {
    if (!highlightedGoals?.data) return null;

    const totalGoals = highlightedGoals.data.length;
    const totalTarget = highlightedGoals.data.reduce((sum, goal) => sum + goal.targetAmount, 0);
    const totalSaved = highlightedGoals.data.reduce(
      (sum, goal) => sum + (goal.savedAmount || 0),
      0
    );
    const completed = highlightedGoals.data.filter((goal) => {
      const progress = ((goal.savedAmount || 0) / goal.targetAmount) * 100;
      return progress >= 100;
    }).length;

    return { totalGoals, totalTarget, totalSaved, completed };
  }, [highlightedGoals?.data]);

  const getGoalStatus = (goal: any) => {
    const saved = goal.savedAmount || 0;
    const target = goal.targetAmount || 1;
    const progress = Math.min((saved / target) * 100, 100);
    const targetDate = goal.targetDate ? parseISO(goal.targetDate) : null;
    const isValidDate = targetDate && isValid(targetDate);

    let status = 'on-track';
    let urgency = 'normal';

    if (progress >= 100) {
      status = 'completed';
    } else if (isValidDate) {
      const daysLeft = differenceInDays(targetDate, new Date());
      const isOverdue = isPast(targetDate);

      if (isOverdue) {
        status = 'overdue';
        urgency = 'high';
      } else if (daysLeft <= 30) {
        urgency = 'medium';
      }
    }

    return {
      progress,
      status,
      urgency,
      timeRemaining: isValidDate ? formatDistanceToNowStrict(targetDate, { addSuffix: true }) : null
    };
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <Icon name='checkCircle2' className='text-success h-4 w-4' />;
      case 'overdue':
        return <Icon name='calendar' className='text-destructive h-4 w-4' />;
      default:
        return <Icon name='target' className='text-primary h-4 w-4' />;
    }
  };

  if (isLoading) return <Loader />;

  if (!highlightedGoals || highlightedGoals.data.length === 0)
    return <NoData message='No active saving goals.' icon='inbox' />;

  return (
    <Card className={cn('flex flex-col', className)}>
      <CardContent className='w-full overflow-y-auto p-0'>
        <ScrollArea className='h-[507px] max-h-[60vh] px-4 py-4'>
          {goalAnalysis && (
            <div className='mb-4 space-y-3'>
              <div className='flex items-baseline justify-between'>
                <div>
                  <p className='text-success text-2xl font-bold'>
                    {formatCurrency(goalAnalysis.totalSaved)}
                  </p>
                  <p className='text-muted-foreground text-sm'>
                    of {formatCurrency(goalAnalysis.totalTarget)} target
                  </p>
                </div>
                <div className='text-right'>
                  <div className='flex items-center gap-1'>
                    <Icon name='trendingUp' className='text-success h-4 w-4' />
                    <span className='text-sm font-medium'>
                      {goalAnalysis.completed}/{goalAnalysis.totalGoals}
                    </span>
                  </div>
                  <p className='text-muted-foreground text-xs'>completed</p>
                </div>
              </div>

              {goalAnalysis.totalTarget > 0 && (
                <div className='space-y-1'>
                  <Progress
                    value={(goalAnalysis.totalSaved / goalAnalysis.totalTarget) * 100}
                    className='h-2'
                  />
                  <p className='text-muted-foreground text-xs'>
                    {((goalAnalysis.totalSaved / goalAnalysis.totalTarget) * 100).toFixed(1)}%
                    overall progress
                  </p>
                </div>
              )}
            </div>
          )}

          <div className='space-y-3'>
            {highlightedGoals.data.map((goal) => {
              const goalStatus = getGoalStatus(goal);

              return (
                <div
                  key={goal.id}
                  className={cn(
                    'rounded-lg border p-3 transition-all hover:shadow-md',
                    goalStatus.status === 'completed' && 'border-success-muted bg-success-muted',
                    goalStatus.status === 'overdue' &&
                      'border-destructive-muted bg-destructive-muted'
                  )}
                >
                  <div className='mb-2 flex items-start justify-between'>
                    <div className='flex min-w-0 flex-1 items-start gap-2'>
                      {getStatusIcon(goalStatus.status)}
                      <div className='min-w-0 flex-1'>
                        <p
                          className={cn(
                            'truncate text-sm font-medium',
                            goalStatus.status === 'completed' && 'text-success'
                          )}
                        >
                          {goal.name}
                        </p>
                        {goalStatus.status === 'completed' && (
                          <p className='text-success text-xs font-medium'>Goal achieved!</p>
                        )}
                      </div>
                    </div>
                    <span
                      className={cn(
                        'shrink-0 text-sm font-medium',
                        goalStatus.status === 'completed' && 'text-success',
                        goalStatus.status === 'overdue' && 'text-destructive'
                      )}
                    >
                      {goalStatus.progress.toFixed(0)}%
                    </span>
                  </div>

                  <div className='space-y-2'>
                    <Progress value={goalStatus.progress} className='h-2' />

                    <div className='flex items-end justify-between text-xs'>
                      <div>
                        <span className='font-medium'>{formatCurrency(goal.savedAmount || 0)}</span>
                        <span className='text-muted-foreground'>
                          {' '}
                          / {formatCurrency(goal.targetAmount)}
                        </span>
                      </div>
                      {goalStatus.timeRemaining && goalStatus.status !== 'completed' && (
                        <span
                          className={cn(
                            'text-right',
                            goalStatus.status === 'overdue'
                              ? 'text-destructive font-medium'
                              : 'text-muted-foreground'
                          )}
                        >
                          {goalStatus.timeRemaining}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>

      {!isLoading && highlightedGoals && highlightedGoals.data.length > 0 && (
        <div className='bg-muted/30 border-t p-3 text-center'>
          <Button variant='link' size='sm' asChild className='text-xs hover:underline'>
            <Link href='/goal'>View All Goals</Link>
          </Button>
        </div>
      )}
    </Card>
  );
};
