'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { budgetUpdate } from '@/lib/endpoints/budget';
import { useToast } from '@/lib/hooks/useToast';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useQuery } from '@tanstack/react-query';
import { categoryGetAll } from '@/lib/endpoints/category';

const budgetSchema = z.object({
  amount: z.string().refine((value) => !isNaN(Number(value)), {
    message: 'Amount must be a valid number'
  }),
  categoryId: z.string().uuid('Category is required'),
  month: z.string(),
  year: z.string()
});

type BudgetFormSchema = z.infer<typeof budgetSchema>;

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
  const queryClient = useQueryClient();

  const { data: categoriesData, isLoading: isLoadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryGetAll
  });

  const form = useForm<BudgetFormSchema>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      amount: budget.amount.toString(),
      categoryId: budget.category.id,
      month: budget.month.toString(),
      year: budget.year.toString()
    }
  });

  const updateBudgetMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => budgetUpdate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      showSuccess('Budget updated successfully!');
      onOpenChange(false);
      onBudgetUpdated();
    },
    onError: (error: any) => {
      showError(error.message);
    }
  });

  const handleUpdate = async (data: BudgetFormSchema) => {
    await updateBudgetMutation.mutate({
      id: budget.id,
      data: {
        amount: Number(data.amount),
        categoryId: data.categoryId,
        month: Number(data.month),
        year: Number(data.year)
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Budget</DialogTitle>
          <DialogDescription>Update your budget information.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleUpdate)} className='space-y-4'>
            <FormField
              control={form.control}
              name='categoryId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select a category' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {isLoadingCategories ? (
                        <SelectItem value='loading'>Loading categories...</SelectItem>
                      ) : (
                        categoriesData?.categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='month'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Month</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select month' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                        <SelectItem key={month} value={month.toString()}>
                          {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='year'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Year</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select year' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map(
                        (year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='amount'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input type='text' placeholder='Budget Amount' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type='submit' disabled={updateBudgetMutation.isPending}>
                {updateBudgetMutation.isPending ? 'Updating...' : 'Update Budget'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default UpdateBudgetModal;
