'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { budgetUpdate } from '@/lib/endpoints/budget';
import { useToast } from '@/lib/hooks/useToast';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Budget } from '@/lib/types';
import { useInvalidateQueries } from '@/hooks/useInvalidateQueries';
import { Loader2, CalendarDays, Tag, Pencil } from 'lucide-react';
import { NumericInput } from '../ui/numeric-input';
import { monthNames } from '@/lib/utils';

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
});

type BudgetUpdateFormSchema = { amount: string };
type BudgetApiPayload = { amount: number };

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
  const { showSuccess, showError } = useToast();
  const invalidate = useInvalidateQueries();

  const form = useForm<BudgetUpdateFormSchema>({
    resolver: zodResolver(budgetUpdateSchema),
    defaultValues: {
      amount: budget?.amount?.toString() ?? ''
    },
    mode: 'onChange'
  });

  useEffect(() => {
    if (isOpen && budget) {
      form.reset({ amount: budget.amount.toString() });
    }
  }, [isOpen, budget, form]);

  const updateBudgetMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: BudgetApiPayload }) => budgetUpdate(id, data),
    onSuccess: async () => {
      await invalidate(['budgets']);
      await invalidate(['budgetSummaryDashboard']);
      showSuccess('Budget updated successfully!');
      onBudgetUpdated();
      handleClose();
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || error.message || 'Failed to update budget.';
      showError(message);
    }
  });

  const handleUpdate = (data: BudgetUpdateFormSchema) => {
    form.trigger('amount').then((isValid) => {
      if (isValid) {
        const transformedData = budgetUpdateSchema.parse(data);
        updateBudgetMutation.mutate({
          id: budget.id,
          data: { amount: parseFloat(transformedData.amount) }
        });
      }
    });
  };

  const handleClose = () => {
    if (!updateBudgetMutation.isPending) {
      form.reset({ amount: budget?.amount?.toString() ?? '' });
      onOpenChange(false);
    }
  };

  const getMonthName = (monthNumber: number): string => {
    return monthNames[monthNumber - 1] || 'Invalid Month';
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className='sm:max-w-[480px]'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2 text-xl font-semibold'>
            <Pencil className='h-5 w-5' /> Edit Budget
          </DialogTitle>
          <DialogDescription className='pt-1'>
            Update the amount for the selected budget period. Category and period cannot be changed.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleUpdate)} className='space-y-6 pt-2'>
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
                      disabled={updateBudgetMutation.isPending}
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

            <DialogFooter className='gap-2 pt-4 sm:gap-0'>
              <DialogClose asChild>
                <Button type='button' variant='outline' disabled={updateBudgetMutation.isPending}>
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type='submit'
                disabled={updateBudgetMutation.isPending || !form.formState.isValid}
                className='min-w-[120px]'
              >
                {updateBudgetMutation.isPending ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Updating...
                  </>
                ) : (
                  'Update Budget'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default UpdateBudgetModal;
