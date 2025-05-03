'use client';

import React, { useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { budgetCreate } from '@/lib/endpoints/budget';
import { useToast } from '@/lib/hooks/useToast';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Button } from '../ui/button';
import AddModal from './add-modal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { categoryGetAll } from '@/lib/endpoints/category';
import { useInvalidateQueries } from '@/hooks/useInvalidateQueries';
import { NumericInput } from '../ui/numeric-input';
import { Loader2, PlusCircle, CalendarDays, Tag } from 'lucide-react';
import { monthNames } from '@/lib/utils';

// Updated schema for stricter validation and number transformation
export const budgetSchema = z.object({
  categoryId: z.string().uuid('Category is required.'),
  month: z
    .string()
    .min(1, 'Month is required.')
    .refine((val) => Number(val) >= 1 && Number(val) <= 12, 'Invalid month.'),
  year: z
    .string()
    .min(4, 'Year is required.')
    .refine((val) => Number(val) >= 2000 && Number(val) <= 2100, 'Invalid year.'),
  amount: z
    .string()
    .min(1, { message: 'Amount is required.' })
    .refine((value) => !isNaN(parseFloat(value)), {
      message: 'Amount must be a valid number.'
    })
    .transform((val) => parseFloat(val))
    .refine((val) => val >= 0, {
      message: 'Budget amount cannot be negative.'
    })
});

// Type for the form data *before* API transformation
type BudgetFormSchema = z.infer<typeof budgetSchema>;
// Type for the data sent to the API
type BudgetApiPayload = {
  categoryId: string;
  month: number;
  year: number;
  amount: number;
};

const AddBudgetModal = ({
  onBudgetAdded,
  isOpen,
  onOpenChange,
  hideTriggerButton = false
}: {
  onBudgetAdded: () => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  hideTriggerButton?: boolean;
}) => {
  const { showSuccess, showError } = useToast();
  const invalidate = useInvalidateQueries();

  const { data: categoriesData, isLoading: isLoadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryGetAll({ limit: 100 }),
    staleTime: 5 * 60 * 1000
  });

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const form = useForm<BudgetFormSchema>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      categoryId: '',
      month: String(currentMonth),
      year: String(currentYear),
      amount: 0
    },
    mode: 'onChange'
  });

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      form.reset({
        categoryId: '',
        month: String(currentMonth),
        year: String(currentYear),
        amount: 0
      });
    }
  }, [isOpen, form, currentMonth, currentYear]);

  const createBudgetMutation = useMutation({
    // Specify the type expected by the API function
    mutationFn: (data: BudgetApiPayload) => budgetCreate(data),
    onSuccess: async () => {
      await invalidate(['budgets']); // Invalidate budget list query
      await invalidate(['budgetSummaryDashboard']); // Invalidate relevant dashboard queries if needed
      showSuccess('Budget created successfully!');
      onBudgetAdded();
      onOpenChange(false);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || error.message || 'Failed to create budget.';
      showError(message);
    }
  });

  const handleCreate = (data: BudgetFormSchema) => {
    // Transform data for the API call
    const apiPayload: BudgetApiPayload = {
      ...data,
      month: Number(data.month),
      year: Number(data.year)
      // Amount is already transformed by the schema
    };
    createBudgetMutation.mutate(apiPayload);
  };

  const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);

  return (
    <AddModal
      title='Add Budget'
      description='Set a spending limit for a specific category and period.'
      triggerButton={
        hideTriggerButton ? null : (
          <Button>
            <PlusCircle className='mr-2 h-4 w-4' /> Add Budget
          </Button>
        )
      }
      isOpen={isOpen}
      onOpenChange={onOpenChange}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleCreate)} className='space-y-5 pt-2'>
          <FormField
            control={form.control}
            name='categoryId'
            render={({ field }) => (
              <FormItem>
                <FormLabel className='flex items-center gap-1.5'>
                  <Tag className='text-muted-foreground h-4 w-4' />
                  Category*
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={isLoadingCategories || createBudgetMutation.isPending}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder='Select a category' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {isLoadingCategories ? (
                      <SelectItem value='loading' disabled>
                        Loading categories...
                      </SelectItem>
                    ) : categoriesData?.categories && categoriesData.categories.length > 0 ? (
                      categoriesData.categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value='no-categories' disabled>
                        No categories available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className='grid grid-cols-2 gap-4'>
            <FormField
              control={form.control}
              name='month'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='flex items-center gap-1.5'>
                    <CalendarDays className='text-muted-foreground h-4 w-4' />
                    Month*
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={createBudgetMutation.isPending}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select month' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {monthNames.map((monthName, index) => (
                        <SelectItem key={index + 1} value={String(index + 1)}>
                          {monthName}
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
                  <FormLabel className='flex items-center gap-1.5'>
                    <CalendarDays className='text-muted-foreground h-4 w-4' />
                    Year*
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={createBudgetMutation.isPending}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select year' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={String(year)}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name='amount'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Budget Amount*</FormLabel>
                <FormControl>
                  {/* Use NumericInput for consistent currency formatting */}
                  <NumericInput
                    placeholder='0.00'
                    className='w-full'
                    disabled={createBudgetMutation.isPending}
                    value={String(field.value)} // NumericInput expects string/number
                    onValueChange={(values: { value: any }) => {
                      // Update form state with the string value
                      field.onChange(values.value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className='flex justify-end gap-2 pt-4'>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
              disabled={createBudgetMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type='submit'
              disabled={createBudgetMutation.isPending}
              className='min-w-[100px]'
            >
              {createBudgetMutation.isPending ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Adding...
                </>
              ) : (
                'Add Budget'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </AddModal>
  );
};

export default AddBudgetModal;
