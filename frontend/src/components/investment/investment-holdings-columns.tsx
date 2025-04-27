'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Investment } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import React, { useState } from 'react';
import ComingSoonModal from '../modals/comming-soon-modal';

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
      const date = row.original.purchaseDate;
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
      // State for the Coming Soon modal
      const [isInsightModalOpen, setIsInsightModalOpen] = useState(false);

      return (
        <div className='flex justify-end gap-1'>
          {/* View Insight Button */}
          <Button
            size='icon'
            variant='ghost'
            className='hover:text-primary h-8 w-8'
            onClick={() => setIsInsightModalOpen(true)} // Open the modal
            aria-label='View Investment Insight'
          >
            <Eye size={16} />
          </Button>

          {/* Edit Button */}
          <Button
            size='icon'
            variant='ghost'
            className='h-8 w-8 hover:text-blue-600'
            onClick={() => handleEdit(investment)}
            aria-label='Edit Investment'
          >
            <Pencil size={16} />
          </Button>

          {/* Delete Button */}
          <Button
            size='icon'
            variant='ghost'
            className='text-destructive hover:text-destructive h-8 w-8'
            onClick={() => handleDeleteClick(investment.id)}
            aria-label='Delete Investment'
          >
            <Trash2 size={16} />
          </Button>

          {/* Render the Coming Soon Modal */}
          <ComingSoonModal
            isOpen={isInsightModalOpen}
            onOpenChange={setIsInsightModalOpen}
            featureName='Investment Insight & Details'
          />
        </div>
      );
    }
  }
];
