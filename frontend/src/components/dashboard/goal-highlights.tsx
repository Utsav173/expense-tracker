import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { SavingGoal } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import NoData from '../ui/no-data';
import { cn, formatCurrency } from '@/lib/utils';
import { Progress } from '../ui/progress';
import Link from 'next/link';
import { Button } from '../ui/button';
import { formatDistanceToNowStrict, isValid, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';

interface GoalHighlightsProps {
  data: SavingGoal[] | undefined;
  isLoading: boolean;
  className?: string;
}

export const GoalHighlights: React.FC<GoalHighlightsProps> = ({ data, isLoading, className }) => {
  const highlightedGoals = data;

  return (
    <Card className={cn('flex flex-col', className)}>
      <CardContent className='h-[450px] flex-1 p-0'>
        <ScrollArea className='h-[450px] px-4 py-4'>
          <AnimatePresence mode='wait'>
            {isLoading ? (
              <motion.div
                key='loading'
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className='space-y-4'
              >
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
              </motion.div>
            ) : !highlightedGoals || highlightedGoals.length === 0 ? (
              <motion.div
                key='empty'
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className='flex h-full items-center justify-center'
              >
                <NoData message='No active saving goals.' icon='inbox' />
              </motion.div>
            ) : (
              <motion.div
                key='data'
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className='space-y-4'
              >
                {highlightedGoals.map((goal) => {
                  const saved = goal.savedAmount || 0;
                  const target = goal.targetAmount || 1;
                  const progress = Math.min((saved / target) * 100, 100);
                  const targetDate = goal.targetDate ? parseISO(goal.targetDate) : null;
                  const isValidDate = targetDate && isValid(targetDate);
                  const timeRemaining = isValidDate
                    ? formatDistanceToNowStrict(targetDate, { addSuffix: true })
                    : null;

                  return (
                    <motion.div
                      key={goal.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className='rounded-lg border p-3 shadow-sm transition-all hover:shadow-md'
                    >
                      <div className='mb-2 flex items-start justify-between text-sm'>
                        <span className='truncate pr-2 font-medium'>{goal.name}</span>
                        <span className='text-muted-foreground shrink-0'>
                          {progress.toFixed(0)}%
                        </span>
                      </div>
                      <Progress value={progress} className='h-2 transition-all duration-500' />
                      <div className='text-muted-foreground mt-2 flex justify-between text-xs'>
                        <span>
                          {formatCurrency(saved)} / {formatCurrency(target)}
                        </span>
                        {timeRemaining && (
                          <span className='text-right'>Target: {timeRemaining}</span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </ScrollArea>
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
