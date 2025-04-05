'use client';

import { ColumnDef } from '@tanstack/react-table';
import { SavingGoal } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Pencil, Trash2, MinusCircle, PlusCircle } from 'lucide-react';
import DeleteConfirmationModal from '../modals/delete-confirmation-modal';
import { useToast } from '@/lib/hooks/useToast';
import { useMutation } from '@tanstack/react-query';
import { goalDelete } from '@/lib/endpoints/goal';
import UpdateGoalModal from '../modals/update-goal-modal';
import { useState } from 'react';
import { useInvalidateQueries } from '@/hooks/useInvalidateQueries';
import { formatCurrency } from '@/lib/utils';
import { Progress } from '../ui/progress';
import AddWithdrawGoalAmountModal from '../modals/add-withdraw-goal-amount-modal';
import React from 'react';

export const goalColumns: ColumnDef<SavingGoal>[] = [
  {
    accessorKey: 'name',
    header: 'Goal Name'
  },
  {
    accessorKey: 'targetAmount',
    header: 'Target',
    cell: ({ row }) => {
      const goal = row.original;
      return <span>{formatCurrency(goal.targetAmount, 'INR')}</span>;
    }
  },
  {
    accessorKey: 'savedAmount',
    header: 'Saved',
    cell: ({ row }) => {
      const goal = row.original;
      return <span>{formatCurrency(goal.savedAmount || 0, 'INR')}</span>;
    }
  },
  {
    id: 'progress',
    header: 'Progress',
    cell: ({ row }) => {
      const goal = row.original;
      const saved = goal.savedAmount || 0;
      const target = goal.targetAmount || 0;
      const progress = target > 0 ? Math.min((saved / target) * 100, 100) : 0;
      return (
        <div className='flex items-center gap-2'>
          <Progress value={progress} className='h-2 w-[100px]' />
          <span className='text-xs text-muted-foreground'>{progress.toFixed(1)}%</span>
        </div>
      );
    }
  },
  {
    accessorKey: 'targetDate',
    header: 'Target Date',
    cell: ({ row }) => {
      const date = row.getValue('targetDate') as string;
      return date ? format(new Date(date), 'MMM d, yyyy') : 'N/A';
    }
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => {
      const goal = row.original;
      const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
      const [isAddWithdrawModalOpen, setIsAddWithdrawModalOpen] = useState(false);
      const [modalMode, setModalMode] = useState<'add' | 'withdraw'>('add');
      const [deleteGoalId, setDeleteGoalId] = useState<string | null>(null);
      const invalidate = useInvalidateQueries();
      const { showSuccess, showError } = useToast();

      const deleteGoalMutation = useMutation({
        mutationFn: (id: string) => goalDelete(id),
        onSuccess: async () => {
          await invalidate(['goals']);
          showSuccess('Goal deleted successfully!');
          setDeleteGoalId(null);
        },
        onError: (error: any) => {
          showError(error.message);
        }
      });

      const handleDelete = () => {
        if (deleteGoalId) {
          deleteGoalMutation.mutate(deleteGoalId);
        }
      };

      const openAddWithdrawModal = (mode: 'add' | 'withdraw') => {
        setModalMode(mode);
        setIsAddWithdrawModalOpen(true);
      };

      return (
        <div className='flex gap-1'>
          <Button size='icon' variant='ghost' onClick={() => openAddWithdrawModal('add')}>
            <PlusCircle size={18} className='text-green-600' />
          </Button>
          <Button size='icon' variant='ghost' onClick={() => openAddWithdrawModal('withdraw')}>
            <MinusCircle size={18} className='text-red-600' />
          </Button>
          <Button size='icon' variant='ghost' onClick={() => setIsUpdateModalOpen(true)}>
            <Pencil size={18} />
          </Button>
          <DeleteConfirmationModal
            title='Delete Goal'
            description='Are you sure you want to delete this goal?'
            onConfirm={handleDelete}
            open={!!deleteGoalId}
            onOpenChange={(open) => {
              if (!open) setDeleteGoalId(null);
            }}
            triggerButton={
              <Button size='icon' variant='ghost' onClick={() => setDeleteGoalId(goal.id)}>
                <Trash2 size={18} />
              </Button>
            }
          />

          <UpdateGoalModal
            isOpen={isUpdateModalOpen}
            onOpenChange={setIsUpdateModalOpen}
            goal={goal}
            onGoalUpdated={async () => {
              await invalidate(['goals']);
            }}
          />
          <AddWithdrawGoalAmountModal
            isOpen={isAddWithdrawModalOpen}
            onOpenChange={setIsAddWithdrawModalOpen}
            goalId={goal.id}
            mode={modalMode}
            goalName={goal.name}
            currentSavedAmount={goal.savedAmount || 0}
            onSuccess={async () => {
              await invalidate(['goals']);
            }}
          />
        </div>
      );
    }
  }
];
