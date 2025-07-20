'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DebtWithDetails, User } from '@/lib/types';
import { format } from 'date-fns';
import { formatCurrency, cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '../ui/column-header';
import { DebtActions } from './debt-actions';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

interface DebtColumnsProps {
  user: User | undefined;
  refetchDebts: () => void;
}

export const createDebtColumns = ({
  user,
  refetchDebts
}: DebtColumnsProps): ColumnDef<DebtWithDetails>[] => [
  {
    accessorKey: 'debts.description',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Description' />,
    meta: { header: 'Description' },
    cell: ({ row }) => {
      const debt = row.original.debts;
      const isGiven = debt.type === 'given';
      return (
        <div className='flex items-center gap-2'>
          {isGiven ? (
            <ArrowUpRight className='h-4 w-4 shrink-0 text-red-500' />
          ) : (
            <ArrowDownLeft className='h-4 w-4 shrink-0 text-green-500' />
          )}
          <span className='max-w-[200px] truncate font-medium max-sm:max-w-[100px]'>
            {debt.description || 'N/A'}
          </span>
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
      return <span>{counterparty?.name ?? 'Unknown User'}</span>;
    }
  },
  {
    accessorKey: 'debts.amount',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Amount' />,
    meta: { header: 'Amount' },
    cell: ({ row }) => (
      <span
        className={cn(
          'font-semibold',
          row.original.debts.type === 'given' ? 'text-red-500' : 'text-green-500'
        )}
      >
        {formatCurrency(row.original.debts.amount, user?.preferredCurrency || 'INR')}
      </span>
    )
  },
  {
    accessorKey: 'debts.interestRate',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Interest' />,
    meta: { header: 'Interest' },
    cell: ({ row }) => {
      const debt = row.original.debts;
      return (
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className='text-muted-foreground'>{debt.interestRate}%</span>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {debt.interestType.charAt(0).toUpperCase() + debt.interestType.slice(1)} Interest
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
  },
  {
    accessorKey: 'debts.termLength',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Term' />,
    meta: { header: 'Term' },
    cell: ({ row }) => {
      const { termLength, termUnit } = row.original.debts;
      const unit = termLength === 1 ? termUnit.slice(0, -1) : termUnit;
      return <span className='capitalize'>{`${termLength} ${unit}`}</span>;
    }
  },
  {
    accessorKey: 'debts.finalDueDate',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Final Due Date' />,
    meta: { header: 'Final Due Date' },
    cell: ({ row }) => {
      const date = row.original.debts.finalDueDate;
      return date ? format(new Date(date), 'MMM d, yyyy') : 'N/A';
    }
  },
  {
    accessorKey: 'debts.isPaid',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Status' />,
    meta: { header: 'Status' },
    cell: ({ row }) => (
      <Badge variant={row.original.debts.isPaid ? 'success' : 'destructive'}>
        {row.original.debts.isPaid ? 'Paid' : 'Unpaid'}
      </Badge>
    )
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => <DebtActions debt={row.original} refetchDebts={refetchDebts} />
  }
];
