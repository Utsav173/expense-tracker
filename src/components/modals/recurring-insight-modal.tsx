'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
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
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { Skeleton } from '../ui/skeleton';
import { Icon } from '../ui/icon';
import { IconName } from '../ui/icon-map';

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
  <div className={cn('flex items-center justify-between gap-3 py-2', className)}>
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
      <DialogContent className='max-h-[95vh] w-full max-w-4xl gap-0 overflow-hidden p-0' hideClose>
        <DialogHeader className='bg-muted/30 border-b px-4 py-4 backdrop-blur-sm sm:px-6 sm:py-5'>
          <div className='flex items-start justify-between gap-4'>
            <div className='flex min-w-0 flex-1 items-start gap-3'>
              <div className='bg-primary/10 text-primary flex-shrink-0 rounded-lg p-2'>
                <Icon name='repeat' className='h-5 w-5' />
              </div>
              <div className='min-w-0 flex-1'>
                <DialogTitle className='mb-1 truncate text-xl font-bold sm:text-2xl'>
                  Recurring Insight
                </DialogTitle>
                {insightData && (
                  <DialogDescription className='text-muted-foreground truncate text-sm'>
                    {insightData.transaction.text}
                  </DialogDescription>
                )}
              </div>
            </div>
            <DialogClose asChild>
              <Button variant='ghost' size='icon' className='h-8 w-8 flex-shrink-0 rounded-full'>
                <Icon name='x' className='h-4 w-4' />
              </Button>
            </DialogClose>
          </div>
        </DialogHeader>

        <ScrollArea className='max-h-[calc(95vh-120px)] flex-1'>
          <div className='p-4 sm:p-6'>
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
  const progressPercentage = totalExpectedValue > 0 ? (totalPaid / totalExpectedValue) * 100 : 0;

  const StatusBadge = () => {
    if (isCompleted)
      return (
        <Badge
          variant='default'
          className='border-success-muted bg-success-muted text-success-foreground gap-1.5'
        >
          <Icon name='checkCircle' className='h-3 w-3' /> Completed
        </Badge>
      );
    if (isOverdue)
      return (
        <Badge variant='destructive' className='gap-1.5'>
          <Icon name='alertCircle' className='h-3 w-3' /> Overdue
        </Badge>
      );
    if (isActive)
      return (
        <Badge
          variant='default'
          className='border-primary-muted bg-primary-muted text-primary-foreground gap-1.5'
        >
          <Icon name='clock' className='h-3 w-3' /> Active
        </Badge>
      );
    return (
      <Badge variant='outline' className='gap-1.5'>
        <Icon name='clock' className='h-3 w-3' /> Ended
      </Badge>
    );
  };

  return (
    <div className='space-y-4 sm:space-y-6'>
      <Card className='border-2'>
        <CardContent className='p-4 sm:p-6'>
          <div className='flex flex-col items-start gap-4 sm:flex-row sm:items-center'>
            <div className='flex flex-1 items-center gap-3'>
              {transaction.isIncome ? (
                <div className='bg-income-muted rounded-full p-3'>
                  <Icon name='arrowUpCircle' className='text-income h-6 w-6' />
                </div>
              ) : (
                <div className='bg-expense-muted rounded-full p-3'>
                  <Icon name='arrowDownCircle' className='text-expense h-6 w-6' />
                </div>
              )}
              <div className='min-w-0 flex-1'>
                <p className='text-muted-foreground mb-1 text-sm font-medium'>
                  Amount per Transaction
                </p>
                <p
                  className={cn(
                    'text-2xl font-bold sm:text-3xl',
                    transaction.isIncome ? 'text-income' : 'text-expense'
                  )}
                >
                  {formatCurrency(transaction.amount, transaction.currency)}
                </p>
              </div>
            </div>
            <div className='w-full sm:w-auto'>
              <StatusBadge />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className='pb-3'>
          <CardTitle className='flex items-center gap-2 text-lg'>
            <Icon name='activity' className='h-5 w-5' />
            Progress & Completion
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <span className='text-sm font-medium'>Completion Status</span>
              <span className='text-sm font-bold'>{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className='h-2' />
            <div className='text-muted-foreground flex justify-between text-xs'>
              <span>Paid: {formatCurrency(totalPaid, transaction.currency)}</span>
              <span>Total: {formatCurrency(totalExpectedValue, transaction.currency)}</span>
            </div>
          </div>
          <div className='border-t pt-2'>
            <DetailRow
              icon={'hash'}
              label='Transactions'
              value={`${generatedInstancesCount} of ${totalInstancesCount}`}
            />
          </div>
        </CardContent>
      </Card>

      <div className='grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2'>
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='flex items-center gap-2 text-lg'>
              <Icon name='calendar' className='h-5 w-5' />
              Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-1'>
            <DetailRow
              icon={'repeat'}
              label='Frequency'
              value={
                <span className='bg-muted rounded px-2 py-1 text-xs font-medium capitalize'>
                  {transaction.recurrenceType}
                </span>
              }
            />
            <DetailRow
              icon={'calendarDays'}
              label='Start Date'
              value={format(new Date(transaction.createdAt), 'MMM d, yyyy')}
            />
            <DetailRow
              icon={'clock'}
              label='Next Due'
              value={
                isCompleted ? (
                  <span className='text-success font-medium'>Completed</span>
                ) : (
                  <span className={cn('font-medium', isOverdue && 'text-destructive')}>
                    {format(nextDueDate, 'MMM d, yyyy')}
                  </span>
                )
              }
            />
            <DetailRow
              icon={'calendar'}
              label='End Date'
              value={
                transaction.recurrenceEndDate ? (
                  format(new Date(transaction.recurrenceEndDate), 'MMM d, yyyy')
                ) : (
                  <span className='text-muted-foreground'>Never</span>
                )
              }
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='flex items-center gap-2 text-lg'>
              <Icon name='tag' className='h-5 w-5' />
              Details
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-1'>
            <DetailRow
              icon={'tag'}
              label='Category'
              value={
                <span className='bg-muted rounded px-2 py-1 text-xs font-medium'>
                  {transaction.category?.name || 'Uncategorized'}
                </span>
              }
            />
            <DetailRow icon={'user'} label='Created By' value={transaction.createdBy.name} />
            <DetailRow
              icon={'indianRupee'}
              label='Currency'
              value={
                <span className='bg-muted rounded px-2 py-1 text-xs font-medium uppercase'>
                  {transaction.currency}
                </span>
              }
            />
            <DetailRow icon={'trendingUp'} label='Status' value={<StatusBadge />} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const InsightSkeleton = () => (
  <div className='space-y-4 sm:space-y-6'>
    <Card className='border-2'>
      <CardContent className='p-4 sm:p-6'>
        <div className='flex flex-col items-start gap-4 sm:flex-row sm:items-center'>
          <div className='flex flex-1 items-center gap-3'>
            <Skeleton className='h-12 w-12 rounded-full' />
            <div className='flex-1 space-y-2'>
              <Skeleton className='h-4 w-32' />
              <Skeleton className='h-8 w-40' />
            </div>
          </div>
          <Skeleton className='h-6 w-20 rounded-full' />
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader className='pb-3'>
        <Skeleton className='h-6 w-48' />
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='space-y-3'>
          <div className='flex justify-between'>
            <Skeleton className='h-4 w-32' />
            <Skeleton className='h-4 w-12' />
          </div>
          <Skeleton className='h-2 w-full' />
          <div className='flex justify-between'>
            <Skeleton className='h-3 w-24' />
            <Skeleton className='h-3 w-24' />
          </div>
        </div>
      </CardContent>
    </Card>

    <div className='grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2'>
      {[1, 2].map((i) => (
        <Card key={i}>
          <CardHeader className='pb-3'>
            <Skeleton className='h-6 w-24' />
          </CardHeader>
          <CardContent className='space-y-3'>
            {[1, 2, 3, 4].map((j) => (
              <div key={j} className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <Skeleton className='h-4 w-4' />
                  <Skeleton className='h-4 w-20' />
                </div>
                <Skeleton className='h-4 w-16' />
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

export default RecurringInsightModal;
