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
import AddAmountModal from '../modals/add-amount-modal';

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
      const progress = target > 0 ? Math.min((saved / target) * 100, 100) : 0; // Ensure progress doesn't exceed 100
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
      return date ? format(new Date(date), 'MMM d, yyyy') : 'N/A';
    }
  },
  {
    id: 'actions',
    header: () => <div className='text-right'>Actions</div>,
    cell: ({ row }) => {
      const goal = row.original;
      const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
      const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
      const [isAddAmountModalOpen, setIsAddAmountModalOpen] = useState(false);
      const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
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

      return (
        <div className='flex justify-end gap-1'>
          <AddAmountModal
            goalId={goal.id}
            goalName={goal.name}
            currentAmount={goal.savedAmount || 0}
            currency={user?.preferredCurrency || 'INR'}
            actionType='add'
            triggerButton={
              <Button size='icon' variant='ghost' className='text-success hover:text-success/80'>
                <Target size={18} />
                <span className='sr-only'>Add Amount</span>
              </Button>
            }
            onSuccess={refetchGoals}
          />
          <AddAmountModal
            goalId={goal.id}
            goalName={goal.name}
            currentAmount={goal.savedAmount || 0}
            currency={user?.preferredCurrency || 'INR'}
            actionType='withdraw'
            triggerButton={
              <Button size='icon' variant='ghost' className='text-warning hover:text-warning/80'>
                {/* Placeholder for withdraw icon, maybe CircleMinus? */}
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
            }
            onSuccess={refetchGoals}
          />
          <Button size='icon' variant='ghost' onClick={() => setIsUpdateModalOpen(true)}>
            <Pencil size={18} />
            <span className='sr-only'>Edit Goal</span>
          </Button>
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
              >
                <Trash2 size={18} />
                <span className='sr-only'>Delete Goal</span>
              </Button>
            }
          />

          {isUpdateModalOpen && (
            <UpdateGoalModal
              isOpen={isUpdateModalOpen}
              onOpenChange={setIsUpdateModalOpen}
              goal={goal}
              onGoalUpdated={refetchGoals}
            />
          )}
        </div>
      );
    }
  }
];
