import { ColumnDef } from '@tanstack/react-table';
import { DebtWithDetails, User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { debtsMarkAsPaid, apiDeleteDebt } from '@/lib/endpoints/debt';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/lib/hooks/useToast';
import { Check, Pencil, Trash2 } from 'lucide-react';
import DeleteConfirmationModal from '../modals/delete-confirmation-modal';
import { useState } from 'react';
import UpdateDebtModal from '../modals/update-debt-modal';
import { useInvalidateQueries } from '@/hooks/useInvalidateQueries';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface DebtColumnsProps {
  user: User | undefined;
  refetchDebts: () => void;
}

export const createDebtColumns = ({
  user,
  refetchDebts
}: DebtColumnsProps): ColumnDef<DebtWithDetails>[] => [
  {
    accessorKey: 'description',
    header: 'Description',
    cell: ({ row }) => (
      <span className='max-w-[200px] truncate font-medium'>
        {row.original.debts.description || 'N/A'}
      </span>
    )
  },
  {
    accessorKey: 'amount',
    header: 'Amount',
    cell: ({ row }) => (
      <span className='font-semibold'>
        {formatCurrency(row.original.debts.amount, user?.preferredCurrency || 'INR')}
      </span>
    )
  },
  {
    accessorKey: 'premiumAmount',
    header: 'Premium',
    cell: ({ row }) =>
      row.original.debts.premiumAmount
        ? formatCurrency(row.original.debts.premiumAmount, user?.preferredCurrency || 'INR')
        : 'N/A'
  },
  {
    accessorKey: 'dueDate',
    header: 'Due Date',
    cell: ({ row }) => {
      const date = row.original.debts.dueDate;
      return date ? format(new Date(date), 'MMM d, yyyy') : 'N/A';
    }
  },
  {
    accessorKey: 'type',
    header: 'Type',
    cell: ({ row }) => (
      <Badge variant={row.original.debts.type === 'given' ? 'secondary' : 'outline'}>
        {row.original.debts.type}
      </Badge>
    )
  },
  {
    accessorKey: 'interestType',
    header: 'Interest',
    cell: ({ row }) => <span className='text-xs capitalize'>{row.original.debts.interestType}</span>
  },
  {
    accessorKey: 'isPaid',
    header: 'Status',
    cell: ({ row }) => (
      <Badge variant={row.original.debts.isPaid ? 'default' : 'destructive'}>
        {row.original.debts.isPaid ? 'Paid' : 'Unpaid'}
      </Badge>
    )
  },
  {
    id: 'actions',
    header: () => <div className='text-right'>Actions</div>,
    cell: ({ row }) => {
      const debt = row.original;
      const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
      const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
      const invalidate = useInvalidateQueries();
      const { showSuccess, showError } = useToast();

      const markAsPaidMutation = useMutation({
        mutationFn: (id: string) => debtsMarkAsPaid(id),
        onSuccess: async () => {
          await invalidate(['debts']);
          showSuccess('Debt marked as paid!');
          refetchDebts();
        },
        onError: (error: any) => {
          showError(error.message);
        }
      });

      const deleteDebtMutation = useMutation({
        mutationFn: (id: string) => apiDeleteDebt(id), // Use the delete function
        onSuccess: async () => {
          await invalidate(['debts']);
          showSuccess('Debt deleted successfully!');
          setIsDeleteModalOpen(false);
          refetchDebts();
        },
        onError: (error: any) => {
          showError(error.message);
        }
      });

      const handlePaid = () => {
        markAsPaidMutation.mutate(debt.debts.id);
      };

      const handleDelete = () => {
        deleteDebtMutation.mutate(debt.debts.id);
      };

      return (
        <div className='flex justify-end gap-1'>
          {!debt.debts.isPaid && (
            <Button
              size='icon'
              variant='ghost'
              onClick={handlePaid}
              disabled={markAsPaidMutation.isPending}
              className='text-green-600 hover:text-green-700'
            >
              <Check size={18} />
              <span className='sr-only'>Mark as Paid</span>
            </Button>
          )}
          <Button size='icon' variant='ghost' onClick={() => setIsUpdateModalOpen(true)}>
            <Pencil size={18} />
            <span className='sr-only'>Edit Debt</span>
          </Button>
          <DeleteConfirmationModal
            title='Delete Debt'
            description={
              <>
                Are you sure you want to delete the debt "<b>{debt.debts.description}</b>"? This
                action cannot be undone.
              </>
            }
            onConfirm={handleDelete}
            open={isDeleteModalOpen}
            onOpenChange={setIsDeleteModalOpen}
            triggerButton={
              <Button
                size='icon'
                variant='ghost'
                className='text-destructive hover:text-destructive'
                onClick={() => setIsDeleteModalOpen(true)}
              >
                <Trash2 size={18} />
                <span className='sr-only'>Delete Debt</span>
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
        </div>
      );
    }
  }
];
