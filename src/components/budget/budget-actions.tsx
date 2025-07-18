'use client';
import { Budget } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import DeleteConfirmationModal from '../modals/delete-confirmation-modal';
import { useMutation } from '@tanstack/react-query';
import { budgetDelete } from '@/lib/endpoints/budget';
import { useToast } from '@/lib/hooks/useToast';
import UpdateBudgetModal from '../modals/update-budget-modal';
import { useState } from 'react';
import { useInvalidateQueries } from '@/hooks/useInvalidateQueries';

interface BudgetActionsProps {
  budget: Budget;
}

export function BudgetActions({ budget }: BudgetActionsProps) {
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const invalidate = useInvalidateQueries();
  const { showError } = useToast();
  const [deleteBudgetId, setDeleteBudgetId] = useState<string | null>(null);

  const deleteBudgetMutation = useMutation({
    mutationFn: (id: string) => budgetDelete(id),
    onSuccess: async () => {
      await invalidate(['budgets']);
      setDeleteBudgetId(null);
    },
    onError: (error: any) => {
      showError(error.message);
    }
  });

  const handleDelete = () => {
    if (deleteBudgetId) {
      deleteBudgetMutation.mutate(deleteBudgetId);
    }
  };

  return (
    <div className='flex justify-end gap-2'>
      <Button
        size='sm'
        variant='ghost'
        onClick={() => {
          setIsUpdateModalOpen(true);
        }}
        aria-label='Edit Budget'
      >
        <Pencil size={18} />
      </Button>
      <DeleteConfirmationModal
        title='Delete Budget'
        description='Are you sure you want to delete this budget?'
        onConfirm={handleDelete}
        open={!!deleteBudgetId}
        onOpenChange={(open) => {
          if (!open) setDeleteBudgetId(null);
        }}
        triggerButton={
          <Button
            size='sm'
            variant='ghost'
            onClick={() => setDeleteBudgetId(budget.id)}
            aria-label='Delete Budget'
          >
            <Trash2 size={18} />
          </Button>
        }
      />
      <UpdateBudgetModal
        isOpen={isUpdateModalOpen}
        onOpenChange={setIsUpdateModalOpen}
        budget={budget}
        onBudgetUpdated={async () => {
          await invalidate(['budgets']);
        }}
      />
    </div>
  );
}
