import { ColumnDef } from '@tanstack/react-table';
import { SavingGoal } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Pencil, Trash2 } from 'lucide-react';
import DeleteConfirmationModal from '../modals/delete-confirmation-modal';
import { useToast } from '@/lib/hooks/useToast';
import { useMutation } from '@tanstack/react-query';
import { goalDelete } from '@/lib/endpoints/goal';
import UpdateGoalModal from '../modals/update-goal-modal'; // Create this
import { useState } from 'react';
import { useInvalidateQueries } from '@/hooks/useInvalidateQueries';

export const goalColumns: ColumnDef<SavingGoal>[] = [
  {
    accessorKey: 'name',
    header: 'Goal Name'
  },
  {
    accessorKey: 'targetAmount',
    header: 'Target Amount'
  },
  {
    accessorKey: 'savedAmount',
    header: 'Saved Amount'
  },
  {
    accessorKey: 'targetDate',
    header: 'Target Date',
    cell: ({ row }) => {
      const date = row.getValue('targetDate') as string;
      return date ? format(new Date(date), 'yyyy-MM-dd') : 'N/A';
    }
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => {
      const goal = row.original;
      const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
      const invalidate = useInvalidateQueries();
      const { showSuccess, showError } = useToast();

      const deleteGoalMutation = useMutation({
        mutationFn: (id: string) => goalDelete(id),
        onSuccess: () => {
          invalidate(['goals']);
          showSuccess('Goal deleted successfully!');
        },
        onError: (error: any) => {
          showError(error.message);
        }
      });

      const handleDelete = () => {
        deleteGoalMutation.mutate(goal.id);
      };

      return (
        <div className='flex gap-2'>
          <Button size='sm' variant='ghost' onClick={() => setIsUpdateModalOpen(true)}>
            <Pencil size={18} />
          </Button>
          <DeleteConfirmationModal
            title='Delete Goal'
            description='Are you sure you want to delete this goal?'
            onConfirm={handleDelete}
            triggerButton={
              <Button size='sm' variant='ghost'>
                <Trash2 size={18} />
              </Button>
            }
          />

          <UpdateGoalModal
            isOpen={isUpdateModalOpen}
            onOpenChange={setIsUpdateModalOpen}
            goal={goal}
            onGoalUpdated={() => {
              invalidate(['goals']);
            }}
          />
        </div>
      );
    }
  }
];
