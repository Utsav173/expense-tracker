'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose
} from '@/components/ui/dialog';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { TransactionWithContext } from '@/lib/types';
import { format } from 'date-fns';
import { formatCurrency, cn } from '@/lib/utils';
import {
  Repeat,
  Calendar,
  IndianRupee,
  CheckCircle,
  Clock,
  X,
  TrendingUp,
  AlertCircle,
  Target,
  Loader2
} from 'lucide-react';
import { Badge } from '../ui/badge';
import { useQuery } from '@tanstack/react-query';
import { transactionGetById } from '@/lib/endpoints/transactions';

interface RecurringInsightModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  transactionId: string | null;
}

const KPICard = ({
  title,
  value,
  icon: Icon,
  className = '',
  subtitle
}: {
  title: string;
  value: React.ReactNode;
  icon: React.ElementType;
  className?: string;
  subtitle?: string;
}) => (
  <div className='group bg-card hover:bg-accent/50 flex flex-col items-center justify-center space-y-2 rounded-xl border p-4 text-center shadow-sm transition-colors duration-200'>
    <div className='text-muted-foreground flex items-center gap-2 text-xs font-medium tracking-wider uppercase'>
      <Icon className='h-4 w-4' />
      {title}
    </div>
    <div className={cn('text-foreground text-xl leading-tight font-bold', className)}>{value}</div>
    {subtitle && <p className='text-muted-foreground text-xs'>{subtitle}</p>}
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
  } = useQuery<TransactionWithContext | null>({
    queryKey: ['recurringInsight', transactionId],
    queryFn: () => transactionGetById(transactionId!),
    enabled: !!transactionId && isOpen
  });

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[95dvh] w-full max-w-4xl gap-0 p-0' hideClose>
        <DialogHeader className='from-muted/80 to-muted/40 rounded-t-lg border-b bg-gradient-to-r p-6'>
          <div className='flex items-start justify-between'>
            <div className='space-y-2'>
              <DialogTitle className='flex items-center gap-3 text-2xl font-bold'>
                <div className='bg-primary/20 text-primary rounded-full p-2'>
                  <Repeat className='h-6 w-6' />
                </div>
                <div>
                  <span>Recurring Transaction</span>
                  <p className='text-muted-foreground mt-1 text-sm font-normal'>
                    Detailed insights and progress tracking
                  </p>
                </div>
              </DialogTitle>
            </div>
            <DialogClose asChild>
              <Button variant='ghost' size='icon' className='h-8 w-8 rounded-full'>
                <X className='h-4 w-4' />
              </Button>
            </DialogClose>
          </div>
        </DialogHeader>

        <ScrollArea className='max-h-[calc(95dvh-120px)]'>
          <div className='p-6'>
            {isLoading && (
              <div className='flex items-center justify-center py-20'>
                <Loader2 className='text-primary h-12 w-12 animate-spin' />
              </div>
            )}
            {isError && (
              <div className='flex flex-col items-center justify-center py-20'>
                <AlertCircle className='text-destructive h-12 w-12' />
                <p className='mt-4 text-lg font-semibold'>Error fetching data</p>
                <p className='text-muted-foreground'>Could not load the transaction details.</p>
              </div>
            )}
            {insightData && <InsightContent insightData={insightData} />}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

const InsightContent: React.FC<{ insightData: TransactionWithContext }> = ({ insightData }) => {
  const { transaction, generatedInstancesCount = 0, remainingInstancesCount = 0 } = insightData;
  const totalInstancesCount = generatedInstancesCount + remainingInstancesCount;

  const calculateNextDueDate = () => {
    if (!transaction.recurrenceType) {
      return new Date(transaction.createdAt);
    }

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
  const isOverdue = isActive && remainingInstancesCount > 0 && new Date() > nextDueDate;
  const totalPaid = transaction.amount * generatedInstancesCount;

  return (
    <div className='space-y-6'>
      <div
        className={cn(
          'relative overflow-hidden rounded-2xl border-2 p-6',
          transaction.isIncome
            ? 'border-success/20 from-success/5 to-success/15 bg-gradient-to-br'
            : 'border-destructive/30 from-destructive/5 to-destructive/10 bg-gradient-to-br'
        )}
      >
        <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
          <div className='min-w-0 flex-1'>
            <div className='mb-2 flex items-center gap-2'>
              <Badge
                variant={transaction.isIncome ? 'default' : 'destructive'}
                className='px-2 py-1 text-xs capitalize'
              >
                {transaction.isIncome ? 'Income' : 'Expense'}
              </Badge>
              <Badge variant='outline' className='px-2 py-1 text-xs capitalize'>
                {transaction.recurrenceType || 'One-time'}
              </Badge>
              {transaction.category && (
                <Badge variant='secondary' className='px-2 py-1 text-xs'>
                  {transaction.category.name}
                </Badge>
              )}
            </div>
            <h3 className='text-foreground mb-2 truncate text-2xl leading-tight font-bold'>
              {transaction.text}
            </h3>
            <p className='text-muted-foreground text-sm'>
              Created {format(new Date(transaction.createdAt), 'MMM d, yyyy')} by{' '}
              {transaction.createdBy.name}
            </p>
          </div>

          <div className='flex flex-col items-end gap-2'>
            <div
              className={cn(
                'text-4xl font-bold',
                transaction.isIncome ? 'text-success' : 'text-destructive'
              )}
            >
              {formatCurrency(transaction.amount, transaction.currency)}
            </div>
            <div className='flex items-center gap-2'>
              {isActive ? (
                <div className='text-success flex items-center gap-1'>
                  <CheckCircle className='h-4 w-4' />
                  <span className='text-sm font-medium'>Active</span>
                </div>
              ) : (
                <div className='text-destructive flex items-center gap-1'>
                  <AlertCircle className='h-4 w-4' />
                  <span className='text-sm font-medium'>Ended</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className='grid grid-cols-2 gap-4 lg:grid-cols-4'>
        <KPICard
          title='Total Paid'
          value={formatCurrency(totalPaid, transaction.currency)}
          icon={IndianRupee}
          className={transaction.isIncome ? 'text-success' : 'text-destructive'}
          subtitle={`${generatedInstancesCount} completed`}
        />
        <KPICard
          title='Per Transaction'
          value={formatCurrency(transaction.amount, transaction.currency)}
          icon={TrendingUp}
          className='text-primary'
          subtitle='fixed amount'
        />
        <KPICard
          title='Next Due'
          value={remainingInstancesCount > 0 ? format(nextDueDate, 'MMM d') : 'N/A'}
          icon={Calendar}
          className={isOverdue ? 'text-destructive' : 'text-foreground'}
          subtitle={remainingInstancesCount > 0 ? format(nextDueDate, 'yyyy') : 'Completed'}
        />
        <KPICard
          title='Progress'
          value={`${generatedInstancesCount}/${totalInstancesCount}`}
          icon={Target}
          className='text-accent-foreground'
          subtitle={`${remainingInstancesCount} remaining`}
        />
      </div>

      {totalInstancesCount > 0 && (
        <div className='space-y-3'>
          <div className='flex items-center justify-between text-sm'>
            <span className='font-medium'>Completion Progress</span>
            <span className='text-muted-foreground'>
              {Math.round((generatedInstancesCount / totalInstancesCount) * 100)}%
            </span>
          </div>
          <div className='bg-muted h-3 overflow-hidden rounded-full'>
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                transaction.isIncome
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                  : 'bg-gradient-to-r from-red-500 to-rose-600'
              )}
              style={{
                width: `${(generatedInstancesCount / totalInstancesCount) * 100}%`
              }}
            />
          </div>
          <div className='text-muted-foreground flex justify-between text-xs'>
            <span>Started: {format(new Date(transaction.createdAt), 'MMM d, yyyy')}</span>
            {transaction.recurrenceEndDate && (
              <span>Ends: {format(new Date(transaction.recurrenceEndDate), 'MMM d, yyyy')}</span>
            )}
          </div>
        </div>
      )}

      <div className='space-y-4'>
        <h4 className='text-xl font-semibold'>Transaction Summary</h4>

        <div className='bg-muted/30 rounded-xl border p-6'>
          {generatedInstancesCount > 0 ? (
            <div className='space-y-4'>
              <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                <div className='space-y-2'>
                  <h5 className='flex items-center gap-2 font-semibold'>
                    <CheckCircle className='h-4 w-4 text-green-600' />
                    Completed Transactions
                  </h5>
                  <p className='text-2xl font-bold text-green-600 dark:text-green-400'>
                    {generatedInstancesCount}
                  </p>
                  <p className='text-muted-foreground text-sm'>
                    Total value: {formatCurrency(totalPaid, transaction.currency)}
                  </p>
                </div>

                <div className='space-y-2'>
                  <h5 className='flex items-center gap-2 font-semibold'>
                    <Clock className='h-4 w-4 text-blue-600' />
                    Remaining Transactions
                  </h5>
                  <p className='text-2xl font-bold text-blue-600 dark:text-blue-400'>
                    {remainingInstancesCount}
                  </p>
                  <p className='text-muted-foreground text-sm'>
                    Estimated value:{' '}
                    {formatCurrency(
                      transaction.amount * remainingInstancesCount,
                      transaction.currency
                    )}
                  </p>
                </div>
              </div>

              {transaction.recurrenceType && (
                <div className='border-t pt-4'>
                  <p className='text-muted-foreground text-sm'>
                    This {transaction.recurrenceType} recurring transaction will continue
                    {transaction.recurrenceEndDate
                      ? ` until ${format(new Date(transaction.recurrenceEndDate), 'MMM d, yyyy')}`
                      : ' indefinitely'}
                    .
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className='flex flex-col items-center justify-center py-8 text-center'>
              <Clock className='text-muted-foreground mb-4 h-12 w-12' />
              <h5 className='mb-2 font-semibold'>No Transactions Generated Yet</h5>
              <p className='text-muted-foreground max-w-md text-sm'>
                This recurring transaction template has been created but no instances have been
                generated yet.
                {remainingInstancesCount > 0 &&
                  ` ${remainingInstancesCount} transactions are scheduled.`}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecurringInsightModal;
