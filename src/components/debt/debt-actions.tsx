'use client';
import type { DebtAndInterestAPI } from '@/lib/api/api-types';
import { Button } from '@/components/ui/button';
import { debtsMarkAsPaid, apiDeleteDebt } from '@/lib/endpoints/debt';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/lib/hooks/useToast';
import DeleteConfirmationModal from '../modals/delete-confirmation-modal';
import { useState } from 'react';
import UpdateDebtModal from '../modals/update-debt-modal';
import { useInvalidateQueries } from '@/hooks/useInvalidateQueries';
import DebtInsightModal from '../modals/debt-insight-modal';
import { Icon } from '../ui/icon';

interface DebtActionsProps {
  debt: DebtAndInterestAPI.DebtRecord;
  refetchDebts: () => void;
}

export function DebtActions({ debt, refetchDebts }: DebtActionsProps) {
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isInsightModalOpen, setIsInsightModalOpen] = useState(false);
  const invalidate = useInvalidateQueries();
  const { showError } = useToast();

  const markAsPaidMutation = useMutation({
    mutationFn: (id: string) => debtsMarkAsPaid(id),
    onSuccess: async () => {
      await invalidate(['debts']);
      refetchDebts();
    },
    onError: (error: any) => showError(error.message)
  });

  const deleteDebtMutation = useMutation({
    mutationFn: (id: string) => apiDeleteDebt(id),
    onSuccess: async () => {
      await invalidate(['debts']);
      setIsDeleteModalOpen(false);
      refetchDebts();
    },
    onError: (error: any) => showError(error.message)
  });

  return (
    <div className='flex justify-end gap-1'>
      <Button
        size='icon'
        variant='ghost'
        onClick={() => markAsPaidMutation.mutate(debt.debts.id)}
        disabled={!!debt.debts.isPaid || markAsPaidMutation.isPending}
        className='text-success hover:text-success/80 h-8 w-8'
        aria-label='Mark as Paid'
      >
        <Icon name='check' className='h-4 w-4' />
      </Button>
      <Button
        size='icon'
        variant='ghost'
        className='hover:text-primary h-8 w-8'
        onClick={() => setIsInsightModalOpen(true)}
        aria-label='View Debt Insight'
      >
        <Icon name='eye' className='h-4 w-4' />
      </Button>
      <Button
        size='icon'
        variant='ghost'
        onClick={() => setIsUpdateModalOpen(true)}
        className='h-8 w-8 hover:text-blue-600'
        aria-label='Edit Debt'
        disabled={!!debt.debts.isPaid}
      >
        <Icon name='pencil' className='h-4 w-4' />
      </Button>
      <DeleteConfirmationModal
        title='Delete Debt'
        description={
          <>
            Are you sure you want to delete the debt "<b>{debt.debts.description}</b>"? This action
            cannot be undone.
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
            <Icon name='trash2' className='h-4 w-4' />
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
      {isInsightModalOpen && (
        <DebtInsightModal
          isOpen={isInsightModalOpen}
          onOpenChange={setIsInsightModalOpen}
          debt={debt}
        />
      )}
    </div>
  );
}
