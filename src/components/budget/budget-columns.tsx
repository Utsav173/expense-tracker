'use client';
import { ColumnDef } from '@tanstack/react-table';
import type { BudgetAPI } from '@/lib/api/api-types';
import { formatCurrency } from '@/lib/utils';
import { DataTableColumnHeader } from '../ui/column-header';
import { BudgetActions } from './budget-actions';

export const budgetColumns: ColumnDef<BudgetAPI.Budget>[] = [
  {
    accessorKey: 'category.name',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Category' />,
    meta: { header: 'Category' }
  },
  {
    accessorKey: 'month',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Month' />,
    meta: { header: 'Month' },
    cell: ({ row }) => {
      const month = row.original.month;
      const monthNames = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December'
      ];
      return <span>{monthNames[month - 1]}</span>;
    }
  },
  {
    accessorKey: 'year',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Year' />,
    meta: { header: 'Year' }
  },
  {
    accessorKey: 'amount',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Amount' />,
    meta: { header: 'Amount' },
    cell: ({ row }) => {
      const budget = row.original;
      const currency = 'INR';
      return <span>{formatCurrency(budget.amount, currency)}</span>;
    }
  },
  {
    id: 'actions',
    header: () => <div className='text-right'>Actions</div>,
    cell: ({ row }) => <BudgetActions budget={row.original} />
  }
];
