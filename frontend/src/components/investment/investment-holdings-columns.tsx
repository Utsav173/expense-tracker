'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Investment } from '@/lib/types';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { DataTableColumnHeader } from '../ui/column-header';
import { InvestmentHoldingActions } from './investment-holding-actions';

interface InvestmentHoldingsColumnsProps {
  handleEdit: (investment: Investment) => void;
  handleDeleteClick: (id: string) => void;
  accountCurrency: string;
}

export const investmentHoldingsColumns = ({
  handleEdit,
  handleDeleteClick,
  accountCurrency
}: InvestmentHoldingsColumnsProps): ColumnDef<Investment>[] => [
  {
    accessorKey: 'symbol',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Symbol' />,
    meta: { header: 'Symbol' }
  },
  {
    accessorKey: 'shares',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Shares' />,
    meta: { header: 'Shares' }
  },
  {
    accessorKey: 'purchasePrice',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Purchase Price' />,
    meta: { header: 'Purchase Price' },
    cell: ({ row }) => {
      const inv = row.original;
      return <span>{formatCurrency(inv.purchasePrice || 0, accountCurrency)}</span>;
    }
  },
  {
    accessorKey: 'purchaseDate',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Purchase Date' />,
    meta: { header: 'Purchase Date' },
    cell: ({ row }) => {
      const date = row.original.purchaseDate;
      return date ? format(new Date(date), 'MMM d, yyyy') : 'N/A';
    }
  },
  {
    accessorKey: 'investedAmount',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Invested Amount' />,
    meta: { header: 'Invested Amount' },
    cell: ({ row }) => {
      const inv = row.original;
      return <span>{formatCurrency(inv.investedAmount || 0, accountCurrency)}</span>;
    }
  },
  {
    accessorKey: 'dividend',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Dividend' />,
    meta: { header: 'Dividend' },
    cell: ({ row }) => {
      const inv = row.original;
      return <span>{formatCurrency(inv.dividend || 0, accountCurrency)}</span>;
    }
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => (
      <InvestmentHoldingActions
        investment={row.original}
        handleEdit={handleEdit}
        handleDeleteClick={handleDeleteClick}
        accountCurrency={accountCurrency}
        key={row.original.id}
      />
    )
  }
];
