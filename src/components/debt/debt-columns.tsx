'use client';

import { ColumnDef } from '@tanstack/react-table';
import type { DebtAndInterestAPI, UserAPI } from '@/lib/api/api-types';
import { format, formatDistanceToNow, isPast, differenceInDays } from 'date-fns';
import { formatCurrency, cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '../ui/column-header';
import { DebtActions } from './debt-actions';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Circle
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface DebtColumnsProps {
  user: UserAPI.UserProfile | undefined;
  refetchDebts: () => void;
}

export const createDebtColumns = ({
  user,
  refetchDebts
}: DebtColumnsProps): ColumnDef<DebtAndInterestAPI.DebtRecord>[] => [
  {
    accessorKey: 'debts.description',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Description' />,
    meta: { header: 'Description' },
    cell: ({ row }) => {
      const debt = row.original.debts;
      const isGiven = debt.type === 'given';
      const isOverdue = !debt.isPaid && isPast(new Date(debt.finalDueDate));

      return (
        <div className='flex items-center gap-3'>
          <div
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full',
              isGiven
                ? 'bg-red-50 text-red-600 dark:bg-red-800 dark:text-red-300'
                : 'bg-green-50 text-green-600 dark:bg-green-800 dark:text-green-200'
            )}
          >
            {isGiven ? <ArrowUpRight className='h-4 w-4' /> : <ArrowDownLeft className='h-4 w-4' />}
          </div>
          <div className='flex flex-col'>
            <span className='max-w-[180px] truncate text-sm font-medium'>
              {debt.description || 'Untitled Debt'}
            </span>
            <span className='text-muted-foreground text-xs'>
              {isGiven ? 'Money Lent' : 'Money Borrowed'}
            </span>
          </div>
          {isOverdue && <AlertTriangle className='h-4 w-4 shrink-0 text-orange-500' />}
        </div>
      );
    }
  },
  {
    accessorKey: 'user.name',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Counterparty' />,
    meta: { header: 'Counterparty' },
    cell: ({ row }) => {
      const counterparty = row.original.user;
      const debt = row.original.debts;
      const isGiven = debt.type === 'given';

      return (
        <div className='flex items-center gap-2'>
          <Avatar className='h-8 w-8'>
            <AvatarImage src={counterparty?.image || undefined} alt={counterparty?.name} />
            <AvatarFallback className='bg-muted text-muted-foreground text-xs font-medium'>
              {counterparty?.name?.charAt(0)?.toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
          <div className='flex flex-col'>
            <span className='text-sm font-medium'>{counterparty?.name ?? 'Unknown User'}</span>
            <span className='text-muted-foreground text-xs'>{isGiven ? 'Borrower' : 'Lender'}</span>
          </div>
        </div>
      );
    }
  },
  {
    accessorKey: 'debts.amount',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Amount' />,
    meta: { header: 'Amount' },
    cell: ({ row }) => {
      const debt = row.original.debts;
      const currency = row.original.account?.currency || user?.preferredCurrency || 'INR';
      const isGiven = debt.type === 'given';

      return (
        <div className='text-right'>
          <div className={cn('text-lg font-semibold', isGiven ? 'text-red-600' : 'text-green-600')}>
            {formatCurrency(debt.amount, currency)}
          </div>
          <div className='text-muted-foreground text-xs'>Principal Amount</div>
        </div>
      );
    }
  },
  {
    accessorKey: 'debts.interestRate',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Interest & Term' />,
    meta: { header: 'Interest & Term' },
    cell: ({ row }) => {
      const debt = row.original.debts;
      const { termLength, termUnit } = debt;
      const unit = termLength === 1 ? termUnit.slice(0, -1) : termUnit;

      return (
        <div className='flex flex-col gap-1'>
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className='flex items-center gap-1'>
                  <span className='text-sm font-medium'>{debt.interestRate}%</span>
                  <span className='text-muted-foreground text-xs uppercase'>
                    {debt.interestType.charAt(0)}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {debt.interestType.charAt(0).toUpperCase() + debt.interestType.slice(1)} Interest
                </p>
                <p>Payment: {debt.paymentFrequency}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <span className='text-muted-foreground text-xs'>{`${termLength} ${unit}`}</span>
        </div>
      );
    }
  },
  {
    accessorKey: 'debts.finalDueDate',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Due Date' />,
    meta: { header: 'Due Date' },
    cell: ({ row }) => {
      const debt = row.original.debts;
      const dueDate = new Date(debt.finalDueDate);
      const today = new Date();
      const daysUntilDue = differenceInDays(dueDate, today);
      const isOverdue = !debt.isPaid && isPast(dueDate);
      const isDueSoon = !debt.isPaid && daysUntilDue <= 7 && daysUntilDue > 0;

      return (
        <div className='flex flex-col gap-1'>
          <div className='flex items-center gap-2'>
            {isOverdue && <Clock className='h-3 w-3 text-red-500' />}
            {isDueSoon && <Clock className='h-3 w-3 text-orange-500' />}
            <span
              className={cn(
                'text-sm font-medium',
                isOverdue && 'text-red-600',
                isDueSoon && 'text-orange-600'
              )}
            >
              {format(dueDate, 'MMM d, yyyy')}
            </span>
          </div>
          <span
            className={cn(
              'text-xs',
              isOverdue ? 'text-red-500' : isDueSoon ? 'text-orange-500' : 'text-muted-foreground'
            )}
          >
            {isOverdue
              ? `${Math.abs(daysUntilDue)} days overdue`
              : isDueSoon
                ? `Due in ${daysUntilDue} days`
                : formatDistanceToNow(dueDate, { addSuffix: true })}
          </span>
        </div>
      );
    }
  },
  {
    accessorKey: 'debts.isPaid',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Status' />,
    meta: { header: 'Status' },
    cell: ({ row }) => {
      const debt = row.original.debts;
      const dueDate = new Date(debt.finalDueDate);
      const isOverdue = !debt.isPaid && isPast(dueDate);
      const isDueSoon =
        !debt.isPaid &&
        differenceInDays(dueDate, new Date()) <= 7 &&
        differenceInDays(dueDate, new Date()) > 0;

      let variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'default';
      let icon = <Circle className='h-3 w-3' />;
      let text = 'Active';

      if (debt.isPaid) {
        variant = 'outline';
        icon = <CheckCircle2 className='h-3 w-3 text-green-600' />;
        text = 'Paid';
      } else if (isOverdue) {
        variant = 'destructive';
        icon = <AlertTriangle className='h-3 w-3' />;
        text = 'Overdue';
      } else if (isDueSoon) {
        variant = 'secondary';
        icon = <Clock className='h-3 w-3 text-orange-500' />;
        text = 'Due Soon';
      }

      return (
        <Badge variant={variant} className='flex w-fit items-center gap-1'>
          {icon}
          {text}
        </Badge>
      );
    }
  },
  {
    id: 'progress',
    header: 'Progress',
    cell: ({ row }) => {
      const debt = row.original.debts;

      const startDate = new Date(debt.startDate);
      const dueDate = new Date(debt.finalDueDate);
      const today = new Date();

      if (debt.isPaid) {
        return (
          <div className='flex items-center gap-2'>
            <CheckCircle2 className='h-4 w-4 text-green-600' />
            <span className='text-xs font-medium text-green-600'>Complete</span>
          </div>
        );
      }

      const totalDuration = differenceInDays(dueDate, startDate);
      const elapsed = differenceInDays(today, startDate);

      // Handle edge cases
      if (totalDuration <= 0) {
        return (
          <div className='flex min-w-[80px] flex-col gap-1'>
            <div className='text-muted-foreground text-center text-xs'>Invalid dates</div>
          </div>
        );
      }

      // If loan hasn't started yet
      if (elapsed < 0) {
        return (
          <div className='flex min-w-[80px] flex-col gap-1'>
            <Progress value={0} className='h-2' />
            <span className='text-muted-foreground text-center text-xs'>Not started</span>
          </div>
        );
      }

      // If loan is overdue
      if (elapsed > totalDuration) {
        return (
          <div className='flex min-w-[80px] flex-col gap-1'>
            <Progress value={100} className='h-2' />
            <span className='text-center text-xs text-red-500'>Overdue</span>
          </div>
        );
      }

      const progress = (elapsed / totalDuration) * 100;

      return (
        <div className='flex min-w-[80px] flex-col gap-1'>
          <Progress value={progress} className='h-2' />
          <span className='text-muted-foreground text-center text-xs'>{Math.round(progress)}%</span>
        </div>
      );
    }
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => <DebtActions debt={row.original} refetchDebts={refetchDebts} />
  }
];
