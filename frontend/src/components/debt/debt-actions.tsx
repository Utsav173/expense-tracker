'use client';
import { DebtWithDetails, User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { debtsMarkAsPaid, apiDeleteDebt } from '@/lib/endpoints/debt';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/lib/hooks/useToast';
import { Check, Eye, Pencil, Trash2 } from 'lucide-react';
import DeleteConfirmationModal from '../modals/delete-confirmation-modal';
import { useState } from 'react';
import UpdateDebtModal from '../modals/update-debt-modal';
import { useInvalidateQueries } from '@/hooks/useInvalidateQueries';
import DebtInsightModal from '../modals/debt-insight-modal';

interface DebtActionsProps {
  debt: DebtWithDetails;
  refetchDebts: () => void;
}

export function DebtActions({ debt, refetchDebts }: DebtActionsProps) {
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isInsightModalOpen, setIsInsightModalOpen] = useState(false);
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
        onClick={() => setIsInsightModalOpen(true)}
        aria-label='View Debt Insight'
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
