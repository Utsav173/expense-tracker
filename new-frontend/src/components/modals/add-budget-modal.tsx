'use client';

import React, { useState } from 'react';
import { useToast } from '@/lib/hooks/useToast';
import { Button } from '../ui/button';
import AddModal from './add-modal';
import { budgetCreate } from '@/lib/endpoints/budget';
import { useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

export const budgetSchema = z.object({
  amount: z.string().refine((value) => !isNaN(Number(value)), {
    message: 'Amount must be a valid number'
  })
});

type BudgetFormSchema = z.infer<typeof budgetSchema>;

const AddBudgetModal = ({ onBudgetAdded }: { onBudgetAdded: () => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting, errors }
  } = useForm<BudgetFormSchema>({
    // useForm setup
    resolver: zodResolver(budgetSchema),
    mode: 'onSubmit'
  });

  const handleCreate = async (data: BudgetFormSchema) => {
    try {
      await budgetCreate({ ...data, amount: Number(data.amount) });
      showSuccess('Budget created successfully!');
      setIsOpen(false);
      onBudgetAdded();
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      reset();
    } catch (error: any) {
      showError(error.message);
    }
  };

  return (
    <AddModal
      title='Add Budget'
      description='Create a new budget for a category.'
      triggerButton={<Button>Add Budget</Button>}
      isOpen={isOpen}
      onOpenChange={setIsOpen}
    >
      {/* Form fields directly inside AddModal */}
      <form onSubmit={handleSubmit(handleCreate)} className='space-y-6'>
        <div className='space-y-2'>
          <Label htmlFor='amount'>Amount</Label>
          <Input
            type='text'
            placeholder='Budget Amount'
            {...register('amount')}
            className='w-full'
            aria-invalid={!!errors.amount}
          />
          {errors.amount && <p className='text-sm text-red-500'>{errors.amount.message}</p>}
        </div>

        <Button type='submit' disabled={isSubmitting} className='w-full'>
          {isSubmitting ? 'Adding...' : 'Add Budget'}
        </Button>
      </form>
    </AddModal>
  );
};

export default AddBudgetModal;
