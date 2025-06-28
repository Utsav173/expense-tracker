'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DebtWithDetails, User } from '@/lib/types';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '../ui/column-header';
import { DebtActions } from './debt-actions';

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
    cell: ({ row }) => (
      <span className='max-w-[200px] truncate font-medium max-sm:max-w-[100px]'>
        {row.original.debts.description || 'N/A'}
      </span>
    )
  },
  {
    accessorKey: 'debts.amount',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Amount' />,
    meta: { header: 'Amount' },
    cell: ({ row }) => (
      <span className='font-semibold'>
        {formatCurrency(row.original.debts.amount, user?.preferredCurrency || 'INR')}
      </span>
    )
  },
  {
    accessorKey: 'debts.premiumAmount',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Premium' />,
    meta: { header: 'Premium' },
    cell: ({ row }) =>
      row.original.debts.premiumAmount
        ? formatCurrency(row.original.debts.premiumAmount, user?.preferredCurrency || 'INR')
        : 'N/A'
  },
  {
    accessorKey: 'debts.dueDate',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Due Date' />,
    meta: { header: 'Due Date' },
    cell: ({ row }) => {
      const date = row.original.debts.dueDate;
      return date ? format(new Date(date), 'MMM d, yyyy') : 'N/A';
    }
  },
  {
    accessorKey: 'debts.type',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Type' />,
    meta: { header: 'Type' },
    cell: ({ row }) => (
      <Badge variant={row.original.debts.type === 'given' ? 'secondary' : 'outline'}>
        {row.original.debts.type}
      </Badge>
    )
  },
  {
    accessorKey: 'debts.isPaid',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Status' />,
    meta: { header: 'Status' },
    cell: ({ row }) => (
      <Badge variant={row.original.debts.isPaid ? 'default' : 'destructive'}>
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
