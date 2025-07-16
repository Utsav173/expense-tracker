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
  Hash,
  TrendingUp,
  AlertCircle
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
  className = '',
  subtitle
}: {
  title: string;
  value: React.ReactNode;
  icon: React.ElementType;
  className?: string;
  subtitle?: string;
}) => (
  <div className='group bg-card hover:bg-accent/50 transition-colors duration-200 flex flex-col items-center justify-center space-y-2 rounded-xl border p-4 text-center shadow-sm'>
    <div className='text-muted-foreground flex items-center gap-2 text-xs font-medium uppercase tracking-wider'>
      <Icon className='h-4 w-4' />
      {title}
    </div>
    <div className={cn('text-foreground text-xl font-bold leading-tight', className)}>
      {value}
    </div>
    {subtitle && (
      <p className='text-muted-foreground text-xs'>{subtitle}</p>
    )}
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
  const averageAmount = instances.length > 0 ? totalPaid / instances.length : template.amount;
  
  // Calculate next due date more accurately
  const calculateNextDueDate = () => {
    if (!template.recurrenceType || instances.length === 0) {
      return new Date(template.createdAt);
    }

    const lastDate = new Date(instances[0].createdAt);
    const nextDate = new Date(lastDate);
    
    switch (template.recurrenceType) {
      case 'daily':
        nextDate.setDate(lastDate.getDate() + 1);
        break;
      case 'weekly':
        nextDate.setDate(lastDate.getDate() + 7);
        break;
      case 'monthly':
        nextDate.setMonth(lastDate.getMonth() + 1);
        break;
      case 'yearly':
        nextDate.setFullYear(lastDate.getFullYear() + 1);
        break;
      case 'hourly':
        nextDate.setHours(lastDate.getHours() + 1);
        break;
    }
    
    return nextDate;
  };

  const nextDueDate = calculateNextDueDate();
  const isActive = !template.recurrenceEndDate || new Date() <= new Date(template.recurrenceEndDate);
  const isOverdue = !isActive && new Date() > nextDueDate;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[95dvh] w-full max-w-4xl p-0 gap-0' hideClose>
        <DialogHeader className='bg-gradient-to-r from-muted/80 to-muted/40 border-b p-6 rounded-t-lg'>
          <div className='flex items-start justify-between'>
            <div className='space-y-2'>
              <DialogTitle className='flex items-center gap-3 text-2xl font-bold'>
                <div className='bg-primary/20 text-primary rounded-full p-2'>
                  <Repeat className='h-6 w-6' />
                </div>
                <div>
                  <span>Recurring Transaction</span>
                  <p className='text-muted-foreground text-sm font-normal mt-1'>
                    Detailed insights and transaction history
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
          <div className='p-6 space-y-6'>
            {/* Enhanced Template Info Card */}
            <div className={cn(
              'relative overflow-hidden rounded-2xl border-2 p-6',
              template.isIncome 
                ? 'border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 dark:border-green-800 dark:from-green-950/50 dark:to-emerald-950/30'
                : 'border-red-200 bg-gradient-to-br from-red-50 to-rose-50 dark:border-red-800 dark:from-red-950/50 dark:to-rose-950/30'
            )}>
              <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
                <div className='flex-1 min-w-0'>
                  <div className='flex items-center gap-2 mb-2'>
                    <Badge 
                      variant={template.isIncome ? 'default' : 'destructive'} 
                      className='capitalize text-xs px-2 py-1'
                    >
                      {template.isIncome ? 'Income' : 'Expense'}
                    </Badge>
                    <Badge variant='outline' className='capitalize text-xs px-2 py-1'>
                      {template.recurrenceType}
                    </Badge>
                  </div>
                  <h3 className='text-foreground text-2xl font-bold leading-tight mb-2 truncate'>
                    {template.text}
                  </h3>
                  <p className='text-muted-foreground text-sm'>
                    Created {format(new Date(template.createdAt), 'MMM d, yyyy')}
                  </p>
                </div>
                
                <div className='flex flex-col items-end gap-2'>
                  <div className={cn(
                    'text-4xl font-bold',
                    template.isIncome ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  )}>
                    {formatCurrency(template.amount, template.currency)}
                  </div>
                  <div className='flex items-center gap-2'>
                    {isActive ? (
                      <div className='flex items-center gap-1 text-green-600 dark:text-green-400'>
                        <CheckCircle className='h-4 w-4' />
                        <span className='text-sm font-medium'>Active</span>
                      </div>
                    ) : (
                      <div className='flex items-center gap-1 text-red-600 dark:text-red-400'>
                        <AlertCircle className='h-4 w-4' />
                        <span className='text-sm font-medium'>Ended</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced KPI Grid */}
            <div className='grid grid-cols-2 gap-4 lg:grid-cols-4'>
              <KPICard
                title='Total Amount'
                value={formatCurrency(totalPaid, template.currency)}
                icon={IndianRupee}
                className={template.isIncome ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}
                subtitle={`${instances.length} transactions`}
              />
              <KPICard
                title='Average Amount'
                value={formatCurrency(averageAmount, template.currency)}
                icon={TrendingUp}
                className='text-blue-600 dark:text-blue-400'
                subtitle='per transaction'
              />
              <KPICard
                title='Next Due'
                value={format(nextDueDate, 'MMM d')}
                icon={Calendar}
                className={isOverdue ? 'text-red-600 dark:text-red-400' : 'text-foreground'}
                subtitle={format(nextDueDate, 'yyyy')}
              />
              <KPICard
                title='Status'
                value={isActive ? 'Active' : 'Ended'}
                icon={isActive ? CheckCircle : X}
                className={isActive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}
                subtitle={instances.length === 0 ? 'No instances' : `${instances.length} instances`}
              />
            </div>

            {/* Enhanced Timeline */}
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <h4 className='text-xl font-semibold'>Transaction History</h4>
                {instances.length > 0 && (
                  <Badge variant='secondary' className='text-sm'>
                    {instances.length} {instances.length === 1 ? 'transaction' : 'transactions'}
                  </Badge>
                )}
              </div>
              
              <div className='bg-muted/30 rounded-xl border'>
                <ScrollArea className='h-[350px]'>
                  {instances.length > 0 ? (
                    <div className='relative p-6'>
                      {/* Enhanced Timeline Bar */}
                      <div className='bg-border absolute top-6 left-8 h-[calc(100%-48px)] w-0.5' />

                      <div className='space-y-8'>
                        {instances.map((instance, index) => (
                          <div key={instance.id} className='relative flex items-start gap-6 pl-16'>
                            <div className={cn(
                              'border-background absolute top-2 left-0 flex h-12 w-12 -translate-x-1/2 items-center justify-center rounded-full border-4 shadow-sm',
                              instance.isIncome 
                                ? 'bg-green-100 dark:bg-green-900' 
                                : 'bg-red-100 dark:bg-red-900'
                            )}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  {instance.isIncome ? (
                                    <ArrowUpCircle className='text-green-600 dark:text-green-400 h-6 w-6' />
                                  ) : (
                                    <ArrowDownCircle className='text-red-600 dark:text-red-400 h-6 w-6' />
                                  )}
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{instance.isIncome ? 'Income' : 'Expense'}</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>

                            <div className='flex-1 min-w-0'>
                              <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
                                <div className='flex items-center gap-3'>
                                  <p className={cn(
                                    'text-xl font-bold',
                                    instance.isIncome 
                                      ? 'text-green-600 dark:text-green-400' 
                                      : 'text-red-600 dark:text-red-400'
                                  )}>
                                    {formatCurrency(instance.amount, instance.currency)}
                                  </p>
                                  {index === 0 && (
                                    <Badge variant='outline' className='text-xs'>
                                      Latest
                                    </Badge>
                                  )}
                                </div>
                                <Badge variant='secondary' className='text-xs'>
                                  {instance.category?.name || 'Uncategorized'}
                                </Badge>
                              </div>
                              <div className='flex items-center gap-2 mt-2'>
                                <Calendar className='h-4 w-4 text-muted-foreground' />
                                <p className='text-muted-foreground text-sm'>
                                  {format(new Date(instance.createdAt), 'EEEE, MMM d, yyyy')}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className='flex h-full items-center justify-center p-8'>
                      <NoData
                        message='No transactions have been generated from this template yet.'
                        icon={Clock}
                      />
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default RecurringInsightModal;