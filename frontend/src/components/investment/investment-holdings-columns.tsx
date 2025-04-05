'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Investment } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Pencil, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import React from 'react';

interface InvestmentHoldingsColumnsProps {
  handleEdit: (investment: Investment) => void;
  handleDeleteClick: (id: string) => void;
}

export const investmentHoldingsColumns = ({
  handleEdit,
  handleDeleteClick
}: InvestmentHoldingsColumnsProps): ColumnDef<Investment>[] => [
  {
    accessorKey: 'symbol',
    header: 'Symbol'
  },
  {
    accessorKey: 'shares',
    header: 'Shares'
  },
  {
    accessorKey: 'purchasePrice',
    header: 'Purchase Price',
    cell: ({ row }) => {
      const inv = row.original;
      return <span>{formatCurrency(inv.purchasePrice || 0, 'INR')}</span>;
    }
  },
  {
    accessorKey: 'purchaseDate',
    header: 'Purchase Date',
    cell: ({ row }) => {
      const date = row.getValue('purchaseDate') as string;
      return date ? format(new Date(date), 'MMM d, yyyy') : 'N/A';
    }
  },
  {
    accessorKey: 'investedAmount',
    header: 'Invested Amount',
    cell: ({ row }) => {
      const inv = row.original;
      return <span>{formatCurrency(inv.investedAmount || 0, 'INR')}</span>;
    }
  },
  {
    accessorKey: 'dividend',
    header: 'Dividend',
    cell: ({ row }) => {
      const inv = row.original;
      return <span>{formatCurrency(inv.dividend || 0, 'INR')}</span>;
    }
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => {
      const investment = row.original;
      return (
        <div className='flex gap-1'>
          <Button size='icon' variant='ghost' onClick={() => handleEdit(investment)}>
            <Pencil size={16} />
          </Button>
          <Button
            size='icon'
            variant='ghost'
            className='text-destructive hover:text-destructive'
            onClick={() => handleDeleteClick(investment.id)}
          >
            <Trash2 size={16} />
          </Button>
        </div>
      );
    }
  }
];
