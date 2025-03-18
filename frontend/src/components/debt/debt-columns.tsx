import { ColumnDef } from '@tanstack/react-table';
import { Debts } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { debtsMarkAsPaid } from '@/lib/endpoints/debt';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/lib/hooks/useToast';
import { Pencil, Trash2 } from 'lucide-react';
import DeleteConfirmationModal from '../modals/delete-confirmation-modal';
import { useState } from 'react';
import UpdateDebtModal from '../modals/update-debt-modal';

export const debtColumns: ColumnDef<Debts>[] = [
  {
    accessorKey: 'description',
    header: 'Description'
  },
  {
    accessorKey: 'amount',
    header: 'Amount'
  },
  {
    accessorKey: 'premiumAmount',
    header: 'Premium Amount'
  },
  {
    accessorKey: 'dueDate',
    header: 'Due Date',
    cell: ({ row }) => {
      const date = row.getValue('dueDate') as string;
      return date ? format(new Date(date), 'yyyy-MM-dd') : 'N/A';
    }
  },
  {
    accessorKey: 'type',
    header: 'Type'
  },
  {
    accessorKey: 'interestType',
    header: 'Interest Type'
  },
  {
    accessorKey: 'isPaid',
    header: 'Status',
    cell: ({ row }) => (row.original.isPaid ? 'Paid' : 'Unpaid')
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => {
      const debt = row.original;
      const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
      const queryClient = useQueryClient();
      const { showSuccess, showError } = useToast();

      const markAsPaidMutation = useMutation({
        mutationFn: (id: string) => debtsMarkAsPaid(id),
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['debts'] });
          showSuccess('Debt marked as paid!');
        },
        onError: (error: any) => {
          showError(error.message);
        }
      });

      const handlePaid = () => {
        markAsPaidMutation.mutate(debt.id);
      };

      return (
        <div className='flex gap-2'>
          <Button size='sm' variant='ghost' onClick={() => setIsUpdateModalOpen(true)}>
            <Pencil size={18} />
          </Button>
          <DeleteConfirmationModal
            title='Delete Debt'
            description='Are you sure you want to delete this debt?'
            onConfirm={() => {} /*TODO: Add delete functionality*/}
            triggerButton={
              <Button size='sm' variant='ghost'>
                <Trash2 size={18} />
              </Button>
            }
          />
          {!debt.isPaid && (
            <Button size='sm' onClick={handlePaid} disabled={markAsPaidMutation.isPending}>
              {markAsPaidMutation.isPending ? 'Marking...' : 'Mark as Paid'}
            </Button>
          )}

          <UpdateDebtModal
            isOpen={isUpdateModalOpen}
            onOpenChange={setIsUpdateModalOpen}
            debt={debt}
            onDebtUpdated={() => {
              queryClient.invalidateQueries({ queryKey: ['debts'] });
            }}
          />
        </div>
      );
    }
  }
];
