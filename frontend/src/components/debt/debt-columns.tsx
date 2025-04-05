'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DebtWithDetails } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { debtsMarkAsPaid, apiDeleteDebt } from '@/lib/endpoints/debt';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/lib/hooks/useToast';
import { Pencil, Trash2 } from 'lucide-react';
import DeleteConfirmationModal from '../modals/delete-confirmation-modal';
import { useState } from 'react';
import UpdateDebtModal from '../modals/update-debt-modal';
import { useInvalidateQueries } from '@/hooks/useInvalidateQueries';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '../ui/badge';
import React from 'react';

export const debtColumns: ColumnDef<DebtWithDetails>[] = [
  {
    accessorKey: 'debts.description',
    header: 'Description',
    cell: ({ row }) => <span className='truncate'>{row.original.debts.description}</span>
  },
  {
    accessorKey: 'debts.amount',
    header: 'Amount',
    cell: ({ row }) => formatCurrency(row.original.debts.amount, 'INR')
  },
  {
    accessorKey: 'debts.premiumAmount',
    header: 'Premium',
    cell: ({ row }) => formatCurrency(row.original.debts.premiumAmount || 0, 'INR')
  },
  {
    accessorKey: 'debts.dueDate',
    header: 'Due Date',
    cell: ({ row }) => {
      const date = row.original.debts.dueDate;
      return date ? format(new Date(date), 'MMM d, yyyy') : 'N/A';
    }
  },
  {
    accessorKey: 'debts.type',
    header: 'Type',
    cell: ({ row }) => (
      <Badge variant={row.original.debts.type === 'given' ? 'secondary' : 'destructive'}>
        {row.original.debts.type === 'given' ? 'Given' : 'Taken'}
      </Badge>
    )
  },
  {
    accessorKey: 'debts.interestType',
    header: 'Interest',
    cell: ({ row }) => (
      <span className='capitalize'>{row.original.debts.interestType || 'N/A'}</span>
    )
  },
  {
    accessorKey: 'debts.isPaid',
    header: 'Status',
    cell: ({ row }) =>
      row.original.debts.isPaid ? (
        <Badge variant='default' className='bg-green-500 hover:bg-green-600'>
          Paid
        </Badge>
      ) : (
        <Badge variant='outline'>Unpaid</Badge>
      )
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => {
      const debtItem = row.original;
      const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
      const [deleteDebtId, setDeleteDebtId] = useState<string | null>(null);
      const invalidate = useInvalidateQueries();
      const { showSuccess, showError } = useToast();

      const markAsPaidMutation = useMutation({
        mutationFn: (id: string) => debtsMarkAsPaid(id),
        onSuccess: async () => {
          await invalidate(['debts']);
          await invalidate(['outstandingDebtsDashboard']);
          showSuccess('Debt marked as paid!');
        },
        onError: (error: any) => {
          showError(error.message);
        }
      });

      const deleteDebtMutation = useMutation({
        mutationFn: (id: string) => apiDeleteDebt(id),
        onSuccess: async () => {
          await invalidate(['debts']);
          await invalidate(['outstandingDebtsDashboard']);
          showSuccess('Debt deleted successfully!');
          setDeleteDebtId(null);
        },
        onError: (error: any) => {
          showError(error.message);
        }
      });

      const handleDeleteConfirm = () => {
        if (deleteDebtId) {
          deleteDebtMutation.mutate(deleteDebtId);
        }
      };

      const handlePaid = () => {
        markAsPaidMutation.mutate(debtItem.debts.id);
      };

      return (
        <div className='flex gap-1'>
          <Button
            size='icon'
            variant='ghost'
            onClick={() => setIsUpdateModalOpen(true)}
            aria-label='Edit Debt'
          >
            <Pencil size={16} />
          </Button>
          <DeleteConfirmationModal
            title='Delete Debt'
            description='Are you sure you want to delete this debt?'
            onConfirm={handleDeleteConfirm}
            open={!!deleteDebtId}
            onOpenChange={(open) => {
              if (!open) setDeleteDebtId(null);
            }}
            triggerButton={
              <Button
                size='icon'
                variant='ghost'
                className='text-destructive hover:text-destructive'
                onClick={() => setDeleteDebtId(debtItem.debts.id)}
                aria-label='Delete Debt'
              >
                <Trash2 size={16} />
              </Button>
            }
          />
          {!debtItem.debts.isPaid && (
            <Button
              size='sm'
              onClick={handlePaid}
              disabled={markAsPaidMutation.isPending}
              className='h-8 px-2 text-xs'
            >
              {markAsPaidMutation.isPending ? 'Marking...' : 'Mark Paid'}
            </Button>
          )}

          <UpdateDebtModal
            isOpen={isUpdateModalOpen}
            onOpenChange={setIsUpdateModalOpen}
            debt={debtItem.debts}
            onDebtUpdated={async () => {
              await invalidate(['debts']);
              await invalidate(['outstandingDebtsDashboard']);
            }}
          />
        </div>
      );
    }
  }
];
