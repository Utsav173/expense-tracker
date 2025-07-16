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
import { Transaction } from '@/lib/types';
import { format } from 'date-fns';
import { formatCurrency, cn } from '@/lib/utils';
import {
  Repeat,
  Calendar,
  IndianRupee,
  ArrowDownCircle,
  ArrowUpCircle,
  CheckCircle,
  Clock,
  X,
  Hash
} from 'lucide-react';
import { Badge } from '../ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import NoData from '../ui/no-data';

interface RecurringInsightModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  template: Transaction;
  instances: Transaction[];
}

const KPICard = ({
  title,
  value,
  icon: Icon,
  className = ''
}: {
  title: string;
  value: React.ReactNode;
  icon: React.ElementType;
  className?: string;
}) => (
  <div className='bg-muted/30 flex flex-col items-center justify-center space-y-1 rounded-lg border p-3 text-center'>
    <div className='text-muted-foreground flex items-center gap-2 text-xs font-medium'>
      <Icon className='h-3.5 w-3.5' />
      {title}
    </div>
    <div className={cn('text-foreground text-lg font-bold', className)}>{value}</div>
  </div>
);

const RecurringInsightModal: React.FC<RecurringInsightModalProps> = ({
  isOpen,
  onOpenChange,
  template,
  instances
}) => {
  if (!template) return null;

  const totalPaid = instances.reduce((sum, inst) => sum + inst.amount, 0);
  const nextDueDate =
    instances.length > 0
      ? new Date(instances[0].createdAt) // Assuming instances are sorted descending
      : new Date(template.createdAt);

  // A simple way to estimate the next due date
  if (template.recurrenceType && instances.length > 0) {
    const lastDate = new Date(instances[0].createdAt);
    switch (template.recurrenceType) {
      case 'daily':
        nextDueDate.setDate(lastDate.getDate() + 1);
        break;
      case 'weekly':
        nextDueDate.setDate(lastDate.getDate() + 7);
        break;
      case 'monthly':
        nextDueDate.setMonth(lastDate.getMonth() + 1);
        break;
      case 'yearly':
        nextDueDate.setFullYear(lastDate.getFullYear() + 1);
        break;
      case 'hourly':
        nextDueDate.setHours(lastDate.getHours() + 1);
        break;
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90dvh] w-full max-w-2xl p-0'>
        <DialogHeader className='bg-muted/50 border-b p-6'>
          <div className='flex items-center justify-between'>
            <div className='space-y-1.5'>
              <DialogTitle className='flex items-center gap-2 text-xl'>
                <Repeat className='text-primary h-6 w-6' />
                Recurring Transaction Insight
              </DialogTitle>
            </div>
            <DialogClose asChild>
              <Button variant='ghost' size='icon' className='h-7 w-7'>
                <X className='h-4 w-4' />
              </Button>
            </DialogClose>
          </div>
        </DialogHeader>

        <div className='p-6'>
          {/* Main Template Info Card */}
          <div className='border-primary/20 from-primary/10 to-primary/5 mb-6 rounded-xl border-2 bg-gradient-to-br p-4'>
            <div className='flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left'>
              <div className='flex-1'>
                <p className='text-muted-foreground mb-1 text-sm'>Template Description</p>
                <h3 className='text-foreground text-2xl font-bold'>{template.text}</h3>
              </div>
              <div className='flex items-center gap-2'>
                <div
                  className={cn(
                    'text-3xl font-bold',
                    template.isIncome ? 'text-success' : 'text-destructive'
                  )}
                >
                  {formatCurrency(template.amount, template.currency)}
                </div>
                <Badge variant='secondary' className='text-md capitalize'>
                  {template.recurrenceType}
                </Badge>
              </div>
            </div>
          </div>

          {/* KPI Cards */}
          <div className='mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4'>
            <KPICard
              title='Total Paid'
              value={formatCurrency(totalPaid, template.currency)}
              icon={IndianRupee}
              className='text-primary'
            />
            <KPICard
              title='Next Due Date'
              value={format(nextDueDate, 'MMM d, yyyy')}
              icon={Calendar}
            />
            <KPICard title='Instances' value={`${instances.length}`} icon={Hash} />
            <KPICard
              title='Status'
              value={new Date() > new Date(template.recurrenceEndDate || 0) ? 'Ended' : 'Active'}
              icon={new Date() > new Date(template.recurrenceEndDate || 0) ? X : CheckCircle}
              className={
                new Date() > new Date(template.recurrenceEndDate || 0)
                  ? 'text-destructive'
                  : 'text-success'
              }
            />
          </div>

          {/* Generated Instances Timeline */}
          <div>
            <h4 className='mb-3 text-lg font-semibold'>Generation History</h4>
            <ScrollArea className='h-[300px] rounded-lg border'>
              {instances.length > 0 ? (
                <div className='relative p-4'>
                  {/* Vertical Timeline Bar */}
                  <div className='bg-border absolute top-4 left-6 h-full w-0.5' />

                  <div className='space-y-6'>
                    {instances.map((instance) => (
                      <div key={instance.id} className='relative flex items-start gap-4 pl-12'>
                        <div className='border-background bg-muted absolute top-1.5 left-0 flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full border-4'>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              {instance.isIncome ? (
                                <ArrowUpCircle className='text-success h-5 w-5' />
                              ) : (
                                <ArrowDownCircle className='text-destructive h-5 w-5' />
                              )}
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{instance.isIncome ? 'Income' : 'Expense'}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>

                        <div className='flex-1'>
                          <div className='flex items-center justify-between'>
                            <p className='font-semibold'>
                              {formatCurrency(instance.amount, instance.currency)}
                            </p>
                            <Badge variant='outline' className='hidden sm:inline-flex'>
                              {instance.category?.name || 'Uncategorized'}
                            </Badge>
                          </div>
                          <p className='text-muted-foreground text-sm'>
                            {format(new Date(instance.createdAt), 'EEEE, MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className='flex h-full items-center justify-center p-4'>
                  <NoData
                    message='No transactions have been generated from this template yet.'
                    icon={Clock}
                  />
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RecurringInsightModal;
