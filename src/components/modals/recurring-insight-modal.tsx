'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO, formatDistanceToNowStrict } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose
} from '@/components/ui/dialog';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import type { TransactionAPI } from '@/lib/api/api-types';
import { formatCurrency, cn } from '@/lib/utils';
import { Badge } from '../ui/badge';
import { transactionGetById } from '@/lib/endpoints/transactions';
import { Card, CardContent } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import { Icon } from '../ui/icon';
import { IconName } from '../ui/icon-map';
import { ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';

interface RecurringInsightModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  transactionId: string | null;
}

const DetailRow = ({
  icon,
  label,
  value,
  className = ''
}: {
  icon: IconName;
  label: string;
  value: React.ReactNode;
  className?: string;
}) => (
  <div className={cn('flex items-center justify-between gap-3 py-3', className)}>
    <div className='text-muted-foreground flex min-w-0 flex-1 items-center gap-2.5'>
      <Icon name={icon} className='h-4 w-4 flex-shrink-0' />
      <span className='truncate text-sm font-medium'>{label}</span>
    </div>
    <div className='text-foreground flex-shrink-0 text-sm font-semibold'>{value}</div>
  </div>
);

const RecurringInsightModal: React.FC<RecurringInsightModalProps> = ({
  isOpen,
  onOpenChange,
  transactionId
}) => {
  const {
    data: insightData,
    isLoading,
    isError
  } = useQuery<TransactionAPI.GetTransactionByIdResponse | null>({
    queryKey: ['recurringInsight', transactionId],
    queryFn: () => transactionGetById(transactionId!),
    enabled: !!transactionId && isOpen
  });

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-2xl p-0' hideClose>
        <ScrollArea className='max-h-[90dvh]'>
          <div className='p-6'>
            <DialogHeader className='mb-6'>
              <div className='flex items-start justify-between'>
                <div className='flex items-center gap-3'>
                  <div className='bg-primary/10 rounded-lg p-2'>
                    <Icon name='repeat' className='text-primary h-5 w-5' />
                  </div>
                  <div>
                    <DialogTitle className='text-xl font-bold'>Recurring Insight</DialogTitle>
                    <DialogDescription>Details for your recurring transaction.</DialogDescription>
                  </div>
                </div>
                <DialogClose asChild>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='-m-2 h-8 w-8 flex-shrink-0 rounded-full'
                  >
                    <Icon name='x' className='h-4 w-4' />
                  </Button>
                </DialogClose>
              </div>
            </DialogHeader>

            {isLoading && <InsightSkeleton />}
            {isError && (
              <div className='flex flex-col items-center justify-center py-16 text-center'>
                <div className='bg-destructive/10 mb-4 rounded-full p-3'>
                  <Icon name='alertCircle' className='text-destructive h-8 w-8' />
                </div>
                <h3 className='mb-2 text-lg font-semibold'>Error Fetching Data</h3>
                <p className='text-muted-foreground text-sm'>Could not load transaction details.</p>
              </div>
            )}
            {insightData && <InsightContent insightData={insightData} />}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

const InsightContent: React.FC<{ insightData: TransactionAPI.GetTransactionByIdResponse }> = ({
  insightData
}) => {
  const { transaction, generatedInstancesCount = 0, remainingInstancesCount = 0 } = insightData;
  const totalInstancesCount = generatedInstancesCount + remainingInstancesCount;

  const calculateNextDueDate = () => {
    if (!transaction.recurrenceType) return new Date(transaction.createdAt);
    const startDate = new Date(transaction.createdAt);
    const nextDate = new Date(startDate);
    switch (transaction.recurrenceType) {
      case 'daily':
        nextDate.setDate(startDate.getDate() + generatedInstancesCount);
        break;
      case 'weekly':
        nextDate.setDate(startDate.getDate() + generatedInstancesCount * 7);
        break;
      case 'monthly':
        nextDate.setMonth(startDate.getMonth() + generatedInstancesCount);
        break;
      case 'yearly':
        nextDate.setFullYear(startDate.getFullYear() + generatedInstancesCount);
        break;
      case 'hourly':
        nextDate.setHours(startDate.getHours() + generatedInstancesCount);
        break;
    }
    return nextDate;
  };

  const nextDueDate = calculateNextDueDate();
  const isActive =
    !transaction.recurrenceEndDate || new Date() <= new Date(transaction.recurrenceEndDate);
  const isCompleted = remainingInstancesCount === 0 && totalInstancesCount > 0;
  const isOverdue = isActive && !isCompleted && new Date() > nextDueDate;

  const totalPaid = transaction.amount * generatedInstancesCount;
  const totalExpectedValue = transaction.amount * totalInstancesCount;
  const progressPercentage =
    totalExpectedValue > 0 ? (totalPaid / totalExpectedValue) * 100 : isCompleted ? 100 : 0;

  const getStatus = () => {
    if (isCompleted) return { label: 'Completed', color: 'text-success' };
    if (isOverdue) return { label: 'Overdue', color: 'text-destructive' };
    if (isActive) return { label: 'Active', color: 'text-primary' };
    return { label: 'Ended', color: 'text-muted-foreground' };
  };

  const status = getStatus();

  return (
    <Card className='overflow-hidden'>
      <CardContent className='grid grid-cols-1 gap-6 p-6 md:grid-cols-3'>
        <div className='flex flex-col items-center justify-center text-center md:col-span-1'>
          <div className='relative h-40 w-40'>
            <ResponsiveContainer width='100%' height='100%'>
              <RadialBarChart
                innerRadius='80%'
                outerRadius='100%'
                data={[
                  { value: progressPercentage, fill: `var(--${status.color.replace('text-', '')})` }
                ]}
                startAngle={90}
                endAngle={-270}
              >
                <PolarAngleAxis type='number' domain={[0, 100]} angleAxisId={0} tick={false} />
                <RadialBar background dataKey='value' cornerRadius={10} className='fill-muted/50' />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className='absolute inset-0 flex flex-col items-center justify-center'>
              <span className='text-3xl font-bold'>{Math.round(progressPercentage)}%</span>
              <span className='text-muted-foreground text-sm'>Completed</span>
            </div>
          </div>
          <p className='text-muted-foreground text-center text-sm md:hidden'>
            {generatedInstancesCount} of {totalInstancesCount} payments made.
          </p>
        </div>

        <div className='md:col-span-2'>
          <div className='mb-4'>
            <p
              className={cn(
                'mb-1 text-3xl font-bold',
                transaction.isIncome ? 'text-success' : 'text-destructive'
              )}
            >
              {formatCurrency(transaction.amount, transaction.currency)}
            </p>
            <p className='text-muted-foreground truncate text-base font-medium'>
              {transaction.text}
            </p>
          </div>

          <div className='divide-y rounded-md border p-2'>
            <DetailRow
              icon='hash'
              label='Frequency'
              value={
                <Badge variant='secondary' className='capitalize'>
                  {transaction.recurrenceType}
                </Badge>
              }
            />
            <DetailRow
              icon='trendingUp'
              label='Status'
              value={<span className={cn('font-semibold', status.color)}>{status.label}</span>}
            />
            <DetailRow
              icon='clock'
              label='Next Due Date'
              value={isCompleted ? 'N/A' : format(nextDueDate, 'MMM d, yyyy')}
            />
            <DetailRow
              icon='calendar'
              label='End Date'
              value={
                transaction.recurrenceEndDate
                  ? format(new Date(transaction.recurrenceEndDate), 'MMM d, yyyy')
                  : 'Never'
              }
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const InsightSkeleton = () => (
  <Card>
    <CardContent className='grid grid-cols-1 gap-6 p-6 md:grid-cols-3'>
      <div className='flex flex-col items-center justify-center text-center md:col-span-1'>
        <Skeleton className='h-40 w-40 rounded-full' />
      </div>
      <div className='space-y-4 md:col-span-2'>
        <div className='space-y-2'>
          <Skeleton className='h-8 w-1/2' />
          <Skeleton className='h-5 w-3/4' />
        </div>
        <div className='space-y-2 rounded-md border p-2'>
          {[...Array(4)].map((_, i) => (
            <div key={i} className='flex justify-between py-3'>
              <Skeleton className='h-5 w-1/3' />
              <Skeleton className='h-5 w-1/4' />
            </div>
          ))}
        </div>
      </div>
    </CardContent>
  </Card>
);

export default RecurringInsightModal;
