import { ColumnDef } from '@tanstack/react-table';
import { SavingGoal, User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Pencil, Target, Trash2 } from 'lucide-react';
import DeleteConfirmationModal from '../modals/delete-confirmation-modal';
import { useToast } from '@/lib/hooks/useToast';
import { useMutation } from '@tanstack/react-query';
import { goalDelete } from '@/lib/endpoints/goal';
import UpdateGoalModal from '../modals/update-goal-modal';
import { useState } from 'react';
import { useInvalidateQueries } from '@/hooks/useInvalidateQueries';
import { formatCurrency } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import AddWithdrawGoalAmountModal from '../modals/add-withdraw-goal-amount-modal';

interface GoalColumnsProps {
  user: User | undefined;
  refetchGoals: () => void;
}

export const createGoalColumns = ({
  user,
  refetchGoals
}: GoalColumnsProps): ColumnDef<SavingGoal>[] => [
  {
    accessorKey: 'name',
    header: 'Goal Name',
    cell: ({ row }) => <span className='font-medium'>{row.original.name}</span>
  },
  {
    accessorKey: 'targetAmount',
    header: 'Target Amount',
    cell: ({ row }) => (
      <span className='text-primary font-semibold'>
        {formatCurrency(row.original.targetAmount, user?.preferredCurrency || 'INR')}
      </span>
    )
  },
  {
    accessorKey: 'savedAmount',
    header: 'Saved Amount / Progress',
    cell: ({ row }) => {
      const goal = row.original;
      const saved = goal.savedAmount || 0;
      const target = goal.targetAmount;
      // Ensure progress doesn't exceed 100 and handle target being 0
      const progress = target > 0 ? Math.min((saved / target) * 100, 100) : 0;
      const remaining = Math.max(0, target - saved); // Ensure remaining is not negative

      return (
        <div className='flex min-w-[150px] flex-col gap-1'>
          <span className='text-success font-semibold'>
            {formatCurrency(saved, user?.preferredCurrency || 'INR')}
          </span>
          <Progress value={progress} className='h-2' />
          <span className='text-muted-foreground text-xs'>
            {formatCurrency(remaining, user?.preferredCurrency || 'INR')} remaining
          </span>
        </div>
      );
    }
  },
  {
    accessorKey: 'targetDate',
    header: 'Target Date',
    cell: ({ row }) => {
      const date = row.original.targetDate;
      // Use parseISO if date is a string, otherwise assume it's already a Date object
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return dateObj && !isNaN(dateObj.getTime()) ? format(dateObj, 'MMM d, yyyy') : 'N/A';
    }
  },
  {
    id: 'actions',
    header: () => 'Actions',
    cell: ({ row }) => {
      const goal = row.original;
      const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
      const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
      // State for the single add/withdraw modal
      const [isAddWithdrawModalOpen, setIsAddWithdrawModalOpen] = useState(false);
      const [addWithdrawMode, setAddWithdrawMode] = useState<'add' | 'withdraw'>('add');

      const invalidate = useInvalidateQueries();
      const { showSuccess, showError } = useToast();

      const deleteGoalMutation = useMutation({
        mutationFn: (id: string) => goalDelete(id),
        onSuccess: async () => {
          await invalidate(['goals']);
          showSuccess('Goal deleted successfully!');
          setIsDeleteModalOpen(false);
          refetchGoals();
        },
        onError: (error: any) => {
          showError(error.message);
        }
      });

      const handleDelete = () => {
        deleteGoalMutation.mutate(goal.id);
      };

      const handleOpenAddWithdrawModal = (mode: 'add' | 'withdraw') => {
        setAddWithdrawMode(mode);
        setIsAddWithdrawModalOpen(true);
      };

      return (
        <div className='flex justify-end gap-1'>
          {/* Add Amount Trigger */}
          <Button
            size='icon'
            variant='ghost'
            className='text-success hover:text-success/80'
            onClick={() => handleOpenAddWithdrawModal('add')}
            aria-label='Add Amount to Goal'
          >
            <Target size={18} />
            <span className='sr-only'>Add Amount</span>
          </Button>

          {/* Withdraw Amount Trigger */}
          <Button
            size='icon'
            variant='ghost'
            className='text-warning hover:text-warning/80'
            onClick={() => handleOpenAddWithdrawModal('withdraw')}
            aria-label='Withdraw Amount from Goal'
          >
            <svg
              xmlns='http://www.w3.org/2000/svg'
              width='18'
              height='18'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
            >
              <circle cx='12' cy='12' r='10' />
              <line x1='8' y1='12' x2='16' y2='12' />
            </svg>
            <span className='sr-only'>Withdraw Amount</span>
          </Button>

          {/* Edit Trigger */}
          <Button
            size='icon'
            variant='ghost'
            onClick={() => setIsUpdateModalOpen(true)}
            aria-label='Edit Goal'
          >
            <Pencil size={18} />
            <span className='sr-only'>Edit Goal</span>
          </Button>

          {/* Delete Trigger */}
          <DeleteConfirmationModal
            title='Delete Goal'
            description={
              <>
                Are you sure you want to delete the goal "<b>{goal.name}</b>"? This action cannot be
                undone.
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
                aria-label='Delete Goal'
              >
                <Trash2 size={18} />
                <span className='sr-only'>Delete Goal</span>
              </Button>
            }
          />

          {/* Update Goal Modal (existing) */}
          {isUpdateModalOpen && (
            <UpdateGoalModal
              isOpen={isUpdateModalOpen}
              onOpenChange={setIsUpdateModalOpen}
              goal={goal}
              onGoalUpdated={refetchGoals}
            />
          )}

          {/* Single Add/Withdraw Modal */}
          {/* *** CHANGE HERE: Use the correct modal component *** */}
          {isAddWithdrawModalOpen && (
            <AddWithdrawGoalAmountModal
              isOpen={isAddWithdrawModalOpen}
              onOpenChange={setIsAddWithdrawModalOpen}
              goalId={goal.id}
              goalName={goal.name}
              currentSavedAmount={goal.savedAmount || 0}
              currency={user?.preferredCurrency || 'INR'}
              mode={addWithdrawMode}
              triggerButton={null} // Triggered by buttons above
              onSuccess={refetchGoals}
            />
          )}
        </div>
      );
    }
  }
];
