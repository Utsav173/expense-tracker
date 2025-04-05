'use client';

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
import { Input } from '@/components/ui/input';
import { Button } from '../ui/button';
import AddModal from './add-modal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { categoryGetAll } from '@/lib/endpoints/category';
import { useInvalidateQueries } from '@/hooks/useInvalidateQueries';
import { NumericFormat } from 'react-number-format';
import { useEffect } from 'react';
import { monthNames } from '@/lib/utils';

export const budgetSchema = z.object({
  amount: z.string().refine((value) => !isNaN(Number(value)), {
    message: 'Amount must be a valid number'
  }),
  categoryId: z.string().uuid('Category is required'),
  month: z.string(),
  year: z.string()
});

type BudgetFormSchema = z.infer<typeof budgetSchema>;

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
    queryFn: categoryGetAll
  });

  const form = useForm<BudgetFormSchema>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      categoryId: '',
      month: '',
      year: '',
      amount: ''
    },
    mode: 'onSubmit'
  });

  // Set default month and year
  useEffect(() => {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    form.setValue('month', currentMonth.toString());
    form.setValue('year', currentYear.toString());
  }, [form.setValue]);

  const createBudgetMutation = useMutation({
    mutationFn: (data: BudgetFormSchema) =>
      budgetCreate({
        ...data,
        amount: Number(data.amount),
        month: Number(data.month),
        year: Number(data.year)
      }),
    onSuccess: async () => {
      await invalidate(['budgets']);
      showSuccess('Budget created successfully!');
      form.reset();
      onBudgetAdded();
      onOpenChange(false);
    },
    onError: (error: any) => {
      showError(error.message);
    }
  });

  const handleCreate = async (data: BudgetFormSchema) => {
    createBudgetMutation.mutate(data);
  };

  return (
    <AddModal
      title='Add Budget'
      description='Create a new budget for a category.'
      triggerButton={hideTriggerButton ? null : <Button>Add Budget</Button>}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleCreate)} className='space-y-6'>
          <FormField
            control={form.control}
            name='categoryId'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  defaultValue={field.value}
                >
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
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder='Select month' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {monthNames.map((monthName, index) => (
                      <SelectItem key={index + 1} value={(index + 1).toString()}>
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
                <FormLabel>Year</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder='Select year' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Array.from({ length: 50 }, (_, i) => new Date().getFullYear() + i).map(
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
                  <NumericFormat
                    customInput={Input}
                    thousandSeparator=','
                    decimalSeparator='.'
                    allowNegative={false}
                    decimalScale={2}
                    fixedDecimalScale
                    placeholder='Budget Amount'
                    className='w-full'
                    onValueChange={(values) => {
                      field.onChange(values.value);
                    }}
                    value={field.value}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type='submit' disabled={createBudgetMutation.isPending} className='w-full'>
            {createBudgetMutation.isPending ? 'Adding...' : 'Add Budget'}
          </Button>
        </form>
      </Form>
    </AddModal>
  );
};

export default AddBudgetModal;
