'use client';

import React, { useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
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

import { useInvalidateQueries } from '@/hooks/useInvalidateQueries';
import { NumericInput } from '../ui/numeric-input';
import { monthNames } from '@/lib/utils';
import CategoryCombobox from '../ui/category-combobox';
import { apiEndpoints } from '@/lib/api/api-endpoints-request-types';
import { Icon } from '../ui/icon';

type BudgetFormSchema = z.infer<typeof apiEndpoints.budget.create.body>;
type BudgetApiPayload = {
  category: string;
  month: number;
  year: number;
  amount: number;
};

interface AddBudgetModalProps {
  onBudgetAdded: () => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  hideTriggerButton?: boolean;
}

const AddBudgetModal: React.FC<AddBudgetModalProps> = ({
  onBudgetAdded,
  isOpen,
  onOpenChange,
  hideTriggerButton = false
}) => {
  const { showError } = useToast();
  const invalidate = useInvalidateQueries();

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const form = useForm<BudgetFormSchema>({
    resolver: zodResolver(apiEndpoints.budget.create.body),
    defaultValues: {
      category: '',
      month: currentMonth,
      year: currentYear,
      amount: 0
    },
    mode: 'onChange'
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({
        category: '',
        month: currentMonth,
        year: currentYear,
        amount: 0
      });
    }
  }, [isOpen, form, currentMonth, currentYear]);

  const createBudgetMutation = useMutation({
    mutationFn: (data: BudgetApiPayload) => budgetCreate(data),
    onSuccess: async () => {
      await invalidate(['budgets']);
      await invalidate(['budgetSummaryDashboard']);
      onBudgetAdded();
      onOpenChange(false);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || error.message || 'Failed to create budget.';
      showError(message);
    }
  });

  const handleCreate = (data: BudgetFormSchema) => {
    const apiPayload: BudgetApiPayload = {
      ...data,
      month: Number(data.month),
      year: Number(data.year),
      amount: Number(data.amount)
    };
    createBudgetMutation.mutate(apiPayload);
  };

  const handleClose = () => {
    if (!createBudgetMutation.isPending) {
      form.reset();
      onOpenChange(false);
    }
  };

  const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);

  return (
    <AddModal
      title='Add Budget'
      description='Set a spending limit for a specific category and period.'
      icon={<Icon name='bookOpen' className='h-5 w-5' />}
      iconClassName='bg-balance-muted text-balance'
      triggerButton={
        hideTriggerButton ? null : (
          <Button className='btn-balance h-10 px-4 py-2'>
            <Icon name='bookOpen' className='mr-2 h-4 w-4' /> Add Budget
          </Button>
        )
      }
      isOpen={isOpen}
      onOpenChange={handleClose}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleCreate)} className='space-y-5 pt-2'>
          <FormField
            control={form.control}
            name='category'
            render={({ field }) => (
              <FormItem>
                <FormLabel className='flex items-center gap-1.5'>
                  <Icon name='tag' className='text-muted-foreground h-4 w-4' />
                  Category*
                </FormLabel>
                <FormControl>
                  <CategoryCombobox
                    value={field.value}
                    onChange={field.onChange}
                    disabled={createBudgetMutation.isPending}
                    placeholder='Search and select category...'
                    allowClear={false}
                    creatable
                  />
                </FormControl>
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
                    <Icon name='calendarDays' className='text-muted-foreground h-4 w-4' />
                    Month*
                  </FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(Number(value))}
                    value={String(field.value)}
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
                    <Icon name='calendarDays' className='text-muted-foreground h-4 w-4' />
                    Year*
                  </FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(Number(value))}
                    value={String(field.value)}
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
                  <NumericInput
                    placeholder='0.00'
                    className='w-full'
                    disabled={createBudgetMutation.isPending}
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

          <div className='flex justify-end gap-2 pt-4'>
            <Button
              type='button'
              variant='outline'
              onClick={handleClose}
              disabled={createBudgetMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type='submit'
              disabled={createBudgetMutation.isPending || !form.formState.isValid}
              className='min-w-[100px]'
            >
              {createBudgetMutation.isPending ? (
                <>
                  <Icon name='loader2' className='mr-2 h-4 w-4 animate-spin' />
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
