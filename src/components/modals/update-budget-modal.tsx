'use client';

import React from 'react';
import { z } from 'zod';
import { UpdateModal } from './update-modal';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { NumericInput } from '../ui/numeric-input';
import { budgetUpdate } from '@/lib/endpoints/budget';
import type { BudgetAPI } from '@/lib/api/api-types';
import { monthNames } from '@/lib/utils';
import { CalendarDays, Tag } from 'lucide-react';
import { apiEndpoints } from '@/lib/api/api-endpoints-request-types';
import { Card } from '../ui/card';

type BudgetUpdateSchema = z.infer<typeof apiEndpoints.budget.update.body>;

interface UpdateBudgetModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  budget: BudgetAPI.Budget;
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
      validationSchema={apiEndpoints.budget.update.body}
      updateFn={(id, data) => budgetUpdate(id, { amount: data.amount })}
      invalidateKeys={[[`budgets`], [`budgetSummaryDashboard`]]}
      onSuccess={onBudgetUpdated}
      entityId={budget.id}
    >
      {(form) => (
        <>
          <Card className='space-y-3 p-4'>
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
          </Card>

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
                      field.onChange(parseFloat(values.value));
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
