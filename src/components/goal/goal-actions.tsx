'use client';
import type { GoalAPI, UserAPI } from '@/lib/api/api-types';
import { Button } from '@/components/ui/button';
import DeleteConfirmationModal from '../modals/delete-confirmation-modal';
import { useToast } from '@/lib/hooks/useToast';
import { useMutation } from '@tanstack/react-query';
import { goalDelete } from '@/lib/endpoints/goal';
import UpdateGoalModal from '../modals/update-goal-modal';
import { useState } from 'react';
import { useInvalidateQueries } from '@/hooks/useInvalidateQueries';
import AddWithdrawGoalAmountModal from '../modals/add-withdraw-goal-amount-modal';
import { Icon } from '../ui/icon';

interface GoalActionsProps {
  goal: GoalAPI.SavingGoal;
  user: UserAPI.UserProfile | undefined;
  refetchGoals: () => void;
}

export function GoalActions({ goal, user, refetchGoals }: GoalActionsProps) {
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAddWithdrawModalOpen, setIsAddWithdrawModalOpen] = useState(false);
  const [addWithdrawMode, setAddWithdrawMode] = useState<'add' | 'withdraw'>('add');

  const invalidate = useInvalidateQueries();
  const { showError } = useToast();

  const deleteGoalMutation = useMutation({
    mutationFn: (id: string) => goalDelete(id),
    onSuccess: async () => {
      await invalidate(['goals']);
      setIsDeleteModalOpen(false);
      refetchGoals();
    },
    onError: (error: any) => showError(error.message)
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
      <Button
        size='icon'
        variant='ghost'
        className='text-success hover:text-success/80'
        onClick={() => handleOpenAddWithdrawModal('add')}
        aria-label='Add Amount to Goal'
      >
        <Icon name='target' className='h-4 w-4' />
        <span className='sr-only'>Add Amount</span>
      </Button>
      <Button
        size='icon'
        variant='ghost'
        className='text-orange-400 hover:text-orange-400/80'
        onClick={() => handleOpenAddWithdrawModal('withdraw')}
        aria-label='Withdraw Amount from Goal'
      >
        <svg
          xmlns='http://www.w3.org/2000/svg'
          width='16'
          height='16'
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
      <Button
        size='icon'
        variant='ghost'
        onClick={() => setIsUpdateModalOpen(true)}
        aria-label='Edit Goal'
      >
        <Icon name='pencil' className='h-4 w-4' />
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
            aria-label='Delete Goal'
          >
            <Icon name='trash2' className='h-4 w-4' />
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
      {isAddWithdrawModalOpen && (
        <AddWithdrawGoalAmountModal
          isOpen={isAddWithdrawModalOpen}
          onOpenChange={setIsAddWithdrawModalOpen}
          goalId={goal.id}
          goalName={goal.name}
          currentSavedAmount={goal.savedAmount || 0}
          currency={user?.preferredCurrency || 'INR'}
          mode={addWithdrawMode}
          triggerButton={null}
          onSuccess={refetchGoals}
        />
      )}
    </div>
  );
}
