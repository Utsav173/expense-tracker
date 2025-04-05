'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { budgetUpdate } from '@/lib/endpoints/budget';
import { useToast } from '@/lib/hooks/useToast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

export const budgetUpdateSchema = z.object({
  amount: z
    .string()
    .min(1, { message: 'Amount is required' })
    .refine((value) => !isNaN(Number(value)) && Number(value) >= 0, {
      message: 'Amount must be a valid non-negative number'
    })
});

type BudgetUpdateFormSchema = z.infer<typeof budgetUpdateSchema>;

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
    }
  });

  React.useEffect(() => {
    if (isOpen && budget) {
      form.reset({ amount: budget.amount.toString() });
    }
  }, [isOpen, budget, form]);

  const updateBudgetMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { amount: number } }) => budgetUpdate(id, data),
    onSuccess: async () => {
      await invalidate(['budgets']);
      showSuccess('Budget updated successfully!');
      onOpenChange(false);
      onBudgetUpdated();
    },
    onError: (error: any) => {
      showError(error?.message ?? 'Failed to update budget. Please try again.');
    }
  });

  const handleUpdate = (data: BudgetUpdateFormSchema) => {
    updateBudgetMutation.mutate({
      id: budget.id,
      data: { amount: Number(data.amount) }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='rounded-lg shadow-xl'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2 text-xl font-semibold text-gray-900 dark:text-gray-100'>
            <Pencil className='h-5 w-5 text-gray-600 dark:text-gray-50' /> Edit Budget
          </DialogTitle>
          <DialogDescription className='mt-1 text-gray-600 dark:text-gray-400'>
            Update the amount for the selected budget period.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleUpdate)} className='space-y-4'>
            <FormField
              control={form.control}
              name='amount'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                    Amount
                  </FormLabel>
                  <FormControl>
                    <Input
                      type='number'
                      step='0.01'
                      placeholder='e.g., 1500.50'
                      {...field}
                      className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100'
                      disabled={updateBudgetMutation.isPending}
                    />
                  </FormControl>
                  <FormMessage className='mt-1 text-xs text-red-600 dark:text-red-400' />
                </FormItem>
              )}
            />

            <div className='mt-4 space-y-3 border-t border-gray-200 pt-2 dark:border-gray-700'>
              <div className='flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300'>
                <Tag className='h-4 w-4 text-gray-500 dark:text-gray-400' />
                <span className='font-medium'>Category:</span>
                <span className='text-gray-900 dark:text-gray-100'>
                  {budget?.category?.name ?? 'N/A'}
                </span>
              </div>
              <div className='flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300'>
                <CalendarDays className='h-4 w-4 text-gray-500 dark:text-gray-400' />
                <span className='font-medium'>Period:</span>
                <span className='text-gray-900 dark:text-gray-100'>
                  {budget ? `${budget.month}/${budget.year}` : 'N/A'}
                </span>
              </div>
            </div>

            <DialogFooter className='mt-6 flex flex-col sm:flex-row sm:justify-end sm:space-x-2'>
              <DialogClose asChild>
                <Button
                  type='button'
                  variant='outline'
                  disabled={updateBudgetMutation.isPending}
                  className='w-full dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 sm:w-auto'
                >
                  Cancel
                </Button>
              </DialogClose>
              <Button type='submit' disabled={updateBudgetMutation.isPending}>
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
