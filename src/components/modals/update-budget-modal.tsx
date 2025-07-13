'use client';

import React from 'react';
import { z } from 'zod';
import { UpdateModal } from './update-modal';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { NumericInput } from '../ui/numeric-input';
import { budgetUpdate } from '@/lib/endpoints/budget';
import { Budget } from '@/lib/types';
import { monthNames } from '@/lib/utils';
import { CalendarDays, Tag } from 'lucide-react';

export const budgetUpdateSchema = z.object({
  amount: z
    .string()
    .min(1, { message: 'Amount is required.' })
    .refine((value) => !isNaN(parseFloat(value)), {
      message: 'Amount must be a valid number.'
    })
    .refine((val) => parseFloat(val) >= 0, {
      message: 'Budget amount cannot be negative.'
    })
    .transform((val) => parseFloat(val))
});

interface UpdateBudgetModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  budget: Budget;
  onBudgetUpdated: () => void;
}

const UpdateBudgetModal: React.FC<UpdateBudgetModalProps> = ({
  isOpen,
  onOpenChange,
  budget,
  onBudgetUpdated
}) => {
  const getMonthName = (monthNumber: number): string => {
    return monthNames[monthNumber - 1] || 'Invalid Month';
  };

  return (
    <UpdateModal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title='Edit Budget'
      description='Update the amount for the selected budget period. Category and period cannot be changed.'
      initialValues={{
        amount: budget?.amount
      }}
      validationSchema={budgetUpdateSchema}
      updateFn={(id, data) => budgetUpdate(id, { amount: data.amount })}
      invalidateKeys={[[`budgets`], [`budgetSummaryDashboard`]]}
      onSuccess={onBudgetUpdated}
      entityId={budget.id}
    >
      {(form) => (
        <>
          <div className='bg-muted/50 space-y-3 rounded-md border p-4'>
            <div className='flex items-center gap-2 text-sm'>
              <Tag className='text-muted-foreground h-4 w-4' />
              <span className='text-muted-foreground font-medium'>Category:</span>
              <span className='text-foreground font-semibold'>
                {budget?.category?.name ?? 'N/A'}
              </span>
            </div>
            <div className='flex items-center gap-2 text-sm'>
              <CalendarDays className='text-muted-foreground h-4 w-4' />
              <span className='text-muted-foreground font-medium'>Period:</span>
              <span className='text-foreground font-semibold'>
                {budget ? `${getMonthName(budget.month)} ${budget.year}` : 'N/A'}
              </span>
            </div>
          </div>

          <FormField
            control={form.control}
            name='amount'
            render={({ field }) => (
              <FormItem>
                <FormLabel>New Budget Amount*</FormLabel>
                <FormControl>
                  <NumericInput
                    placeholder='1,500.50'
                    className='w-full'
                    disabled={form.formState.isSubmitting}
                    value={String(field.value)}
                    onValueChange={(values: { value: any }) => {
                      field.onChange(values.value);
                    }}
                    ref={field.ref as React.Ref<HTMLInputElement>}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      )}
    </UpdateModal>
  );
};

export default UpdateBudgetModal;
