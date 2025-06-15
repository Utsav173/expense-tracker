'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DebtWithDetails, User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { debtsMarkAsPaid, apiDeleteDebt } from '@/lib/endpoints/debt';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/lib/hooks/useToast';
import { Check, Eye, Pencil, Trash2 } from 'lucide-react';
import DeleteConfirmationModal from '../modals/delete-confirmation-modal';
import { useState } from 'react';
import UpdateDebtModal from '../modals/update-debt-modal';
import { useInvalidateQueries } from '@/hooks/useInvalidateQueries';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import ComingSoonModal from '../modals/comming-soon-modal';
import { DataTableColumnHeader } from '../ui/column-header';

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
    cell: ({ row }) => {
      const debt = row.original;
      const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
      const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
      const [isBreakdownModalOpen, setIsBreakdownModalOpen] = useState(false);
      const invalidate = useInvalidateQueries();
      const { showSuccess, showError } = useToast();

      const markAsPaidMutation = useMutation({
        mutationFn: (id: string) => debtsMarkAsPaid(id),
        onSuccess: async () => {
          await invalidate(['debts']);
          showSuccess('Debt marked as paid!');
          refetchDebts();
        },
        onError: (error: any) => showError(error.message)
      });

      const deleteDebtMutation = useMutation({
        mutationFn: (id: string) => apiDeleteDebt(id),
        onSuccess: async () => {
          await invalidate(['debts']);
          showSuccess('Debt deleted successfully!');
          setIsDeleteModalOpen(false);
          refetchDebts();
        },
        onError: (error: any) => showError(error.message)
      });

      return (
        <div className='flex justify-end gap-1'>
          {!debt.debts.isPaid && (
            <Button
              size='icon'
              variant='ghost'
              onClick={() => markAsPaidMutation.mutate(debt.debts.id)}
              disabled={markAsPaidMutation.isPending}
              className='h-8 w-8 text-green-600 hover:text-green-700'
              aria-label='Mark as Paid'
            >
              <Check size={18} />
            </Button>
          )}
          <Button
            size='icon'
            variant='ghost'
            className='hover:text-primary h-8 w-8'
            onClick={() => setIsBreakdownModalOpen(true)}
            aria-label='View Debt Breakdown'
          >
            <Eye size={16} />
          </Button>
          <Button
            size='icon'
            variant='ghost'
            onClick={() => setIsUpdateModalOpen(true)}
            className='h-8 w-8 hover:text-blue-600'
            aria-label='Edit Debt'
          >
            <Pencil size={16} />
          </Button>
          <DeleteConfirmationModal
            title='Delete Debt'
            description={
              <>
                Are you sure you want to delete the debt "<b>{debt.debts.description}</b>"? This
                action cannot be undone.
              </>
            }
            onConfirm={() => deleteDebtMutation.mutate(debt.debts.id)}
            open={isDeleteModalOpen}
            onOpenChange={setIsDeleteModalOpen}
            triggerButton={
              <Button
                size='icon'
                variant='ghost'
                className='text-destructive hover:text-destructive h-8 w-8'
                onClick={() => setIsDeleteModalOpen(true)}
                aria-label='Delete Debt'
              >
                <Trash2 size={16} />
              </Button>
            }
          />
          {isUpdateModalOpen && (
            <UpdateDebtModal
              isOpen={isUpdateModalOpen}
              onOpenChange={setIsUpdateModalOpen}
              debt={debt.debts}
              onDebtUpdated={refetchDebts}
            />
          )}
          <ComingSoonModal
            isOpen={isBreakdownModalOpen}
            onOpenChange={setIsBreakdownModalOpen}
            featureName='Debt Breakdown & Details'
          />
        </div>
      );
    }
  }
];
