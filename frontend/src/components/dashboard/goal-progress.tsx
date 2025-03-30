'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { SavingGoal } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import Loader from '../ui/loader';
import { Progress } from '../ui/progress';
import NoData from '../ui/no-data';
import { formatDistanceToNow, parseISO } from 'date-fns';

interface GoalProgressProps {
  data: SavingGoal[] | undefined;
  isLoading: boolean;
}

export const GoalProgress: React.FC<GoalProgressProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Saving Goals</CardTitle>
          <CardDescription>Your progress towards financial goals.</CardDescription>
        </CardHeader>
        <CardContent className='flex h-[300px] items-center justify-center'>
          <Loader />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Saving Goals</CardTitle>
          <CardDescription>Your progress towards financial goals.</CardDescription>
        </CardHeader>
        <CardContent className='h-[300px]'>
          <NoData message='No saving goals set.' icon='inbox' />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Saving Goals</CardTitle>
        <CardDescription>Your progress towards financial goals.</CardDescription>
      </CardHeader>
      <CardContent className='scrollbar h-[250px] space-y-4 overflow-y-auto'>
        {data.slice(0, 5).map((goal) => {
          const saved = goal.savedAmount || 0;
          const target = goal.targetAmount || 0;
          const progress = target > 0 ? Math.min((saved / target) * 100, 100) : 0;
          const remainingAmount = target - saved;
          const targetDate = goal.targetDate ? parseISO(goal.targetDate) : null;
          const timeRemaining = targetDate
            ? formatDistanceToNow(targetDate, { addSuffix: true })
            : null;

          return (
            <div key={goal.id}>
              <div className='mb-1 flex justify-between text-sm'>
                <span className='font-medium'>{goal.name}</span>
                <span className='text-muted-foreground'>
                  {formatCurrency(saved)} / {formatCurrency(target)}
                </span>
              </div>
              <Progress value={progress} className='h-2' />
              <div className='mt-1 flex justify-between text-xs text-muted-foreground'>
                <span>{formatCurrency(Math.max(0, remainingAmount))} remaining</span>
                {timeRemaining && <span>Target: {timeRemaining}</span>}
              </div>
            </div>
          );
        })}
        {data.length > 5 && (
          <p className='text-center text-xs text-muted-foreground'>
            + {data.length - 5} more goals...
          </p>
        )}
      </CardContent>
    </Card>
  );
};
