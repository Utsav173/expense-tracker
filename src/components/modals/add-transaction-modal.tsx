'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/lib/hooks/useToast';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { transactionCreate } from '@/lib/endpoints/transactions';
import AddModal from './add-modal';
import { useMutation, useQuery } from '@tanstack/react-query';
import { accountGetDropdown } from '@/lib/endpoints/accounts';
import GoalCombobox from '../ui/goal-combobox';
import type { AccountAPI } from '@/lib/api/api-types';
import { NumericFormat } from 'react-number-format';
import DateTimePicker from '../date/date-time-picker';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '../ui/form';
import { cn } from '@/lib/utils';
import { Icon } from '../ui/icon';
import { Checkbox } from '../ui/checkbox';
import CategoryCombobox from '../ui/category-combobox';
import AccountCombobox from '../ui/account-combobox';
import { goalAddAmount } from '@/lib/endpoints/goal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ComboboxHandle } from '../ui/combobox';
import { Collapsible, CollapsibleContent } from '../ui/collapsible';

const transactionSchema = z.object({
  text: z.string().min(3, 'Description must be at least 3 characters').max(255),
  amount: z
    .string()
    .refine(
      (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
      'Amount must be a positive number'
    ),
  isIncome: z.boolean(),
  categoryId: z.string().optional().nullable(),
  accountId: z.string().min(1, 'Please select an account'),
  transfer: z.string().optional(),
  recurring: z.boolean().optional(),
  recurrenceType: z.enum(['daily', 'weekly', 'monthly', 'yearly', 'hourly']).optional().nullable(),
  recurrenceEndDate: z.string().optional().nullable(),
  currency: z.string().optional().default(''),
  createdAt: z.string().optional().nullable(),
  addToGoal: z.boolean().optional(),
  goalId: z.string().optional().nullable()
});

type TransactionFormSchema = z.infer<typeof transactionSchema>;

interface AddTransactionModalProps {
  onTransactionAdded: () => void;
  triggerButton?: React.ReactNode;
  accountId?: string;
}

const AddTransactionModal = ({
  onTransactionAdded,
  triggerButton,
  accountId = ''
}: AddTransactionModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [accounts, setAccounts] = useState<AccountAPI.SimpleAccount[]>([]);
  const [createdAt, setCreatedAt] = useState<Date>(new Date());
  const [recurrenceEndDate, setRecurrenceEndDate] = useState<Date | null>(null);
  const { showError, showSuccess } = useToast();
  const accountDropdownRef = React.useRef<ComboboxHandle>(null);

  const { data: accountData } = useQuery({
    queryKey: ['accountDropdown'],
    queryFn: () => accountGetDropdown()
  });

  const form = useForm<TransactionFormSchema>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      isIncome: false,
      currency: '',
      recurring: false,
      addToGoal: false,
      ...(accountId && { accountId })
    }
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
    reset,
    setValue,
    watch,
    control
  } = form;

  const isIncome = watch('isIncome');
  const selectedAccountId = watch('accountId');
  const addToGoal = watch('addToGoal');
  const isRecurring = watch('recurring');

  const addAmountToGoalMutation = useMutation({
    mutationFn: (data: { id: string; data: { amount: number } }) =>
      goalAddAmount(data.id, data.data),
    onSuccess: () => {
      showSuccess('Amount added to goal successfully');
      onTransactionAdded();
    },
    onError: (error: any) => {
      showError(error.message || 'Failed to add amount to goal');
    }
  });

  useEffect(() => {
    if (accountData) {
      setAccounts(accountData);
      const selectedAccount = accountData.find((acc) => acc.id === selectedAccountId);
      if (selectedAccount) {
        setValue('currency', selectedAccount.currency);
      }
    }
  }, [accountData, selectedAccountId, setValue]);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    accountDropdownRef?.current?.preloadOptions('');
    if (open) {
      reset({
        isIncome: false,
        currency: '',
        recurring: false,
        addToGoal: false,
        ...(accountId && { accountId })
      });
      setCreatedAt(new Date());
      setRecurrenceEndDate(null);
    }
  };

  const handleCreateTransaction = async (data: TransactionFormSchema) => {
    try {
      const transactionData = {
        text: data.text,
        amount: Number(data.amount),
        isIncome: data.isIncome,
        category: data.categoryId || undefined,
        account: data.accountId,
        transfer: data.transfer || '',
        recurring: data.recurring || false,
        recurrenceType: data.recurring ? data.recurrenceType : null,
        recurrenceEndDate: data.recurring ? data.recurrenceEndDate : null,
        currency: accounts.find((acc) => acc.id === data.accountId)?.currency ?? '',
        createdAt: createdAt.toISOString()
      };
      await transactionCreate(transactionData);

      if (data.addToGoal && data.goalId) {
        addAmountToGoalMutation.mutate({ id: data.goalId, data: { amount: Number(data.amount) } });
      } else {
        onTransactionAdded();
      }

      setIsOpen(false);
      reset();
    } catch (error: any) {
      showError(error.message || 'Failed to create transaction');
    }
  };

  return (
    <AddModal
      title={isIncome ? 'Add Income' : 'Add Expense'}
      description='Add a new transaction to your expense tracker.'
      icon={<Icon name={isIncome ? 'arrowUpCircle' : 'arrowDownCircle'} className='h-5 w-5' />}
      iconClassName={isIncome ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}
      triggerButton={triggerButton}
      onOpenChange={handleOpenChange}
      isOpen={isOpen}
    >
      <Form {...form}>
        <form
          onSubmit={handleSubmit(handleCreateTransaction)}
          className='flex h-full flex-col space-y-4'
        >
          <div className='bg-muted grid grid-cols-2 gap-2 rounded-lg p-1'>
            <Button
              type='button'
              variant={!isIncome ? 'destructive' : 'ghost'}
              className='h-auto py-2 text-sm'
              onClick={() => setValue('isIncome', false)}
              disabled={isSubmitting}
            >
              <Icon name='arrowDownCircle' className='mr-2 h-4 w-4' />
              Expense
            </Button>
            <Button
              type='button'
              variant={isIncome ? 'success' : 'ghost'}
              className='h-auto py-2 text-sm'
              onClick={() => setValue('isIncome', true)}
              disabled={isSubmitting}
            >
              <Icon name='arrowUpCircle' className='mr-2 h-4 w-4' />
              Income
            </Button>
          </div>

          <div className='scrollbar flex-1 space-y-4 overflow-y-auto px-1 pb-2'>
            <FormField
              control={control}
              name='text'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder='e.g., Salary' {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              <FormField
                control={control}
                name='amount'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <div className='relative'>
                        {selectedAccountId && (
                          <span className='text-muted-foreground pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm'>
                            {accounts.find((acc) => acc.id === selectedAccountId)?.currency}
                          </span>
                        )}
                        <NumericFormat
                          customInput={Input}
                          thousandSeparator=','
                          decimalSeparator='.'
                          allowNegative={false}
                          decimalScale={2}
                          placeholder='0.00'
                          onValueChange={(values) => field.onChange(values.value)}
                          className={cn(selectedAccountId && 'pr-12')}
                          disabled={isSubmitting}
                          value={field.value}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {accountId ? (
                <input type='hidden' {...form.register('accountId')} value={accountId} />
              ) : (
                <FormField
                  control={control}
                  name='accountId'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account</FormLabel>
                      <FormControl>
                        <AccountCombobox
                          isOnModal
                          value={field.value}
                          onChange={field.onChange}
                          disabled={isSubmitting}
                          placeholder='Select account'
                          ref={accountDropdownRef}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              <FormField
                control={control}
                name='categoryId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <CategoryCombobox
                        value={field.value}
                        onChange={field.onChange}
                        creatable
                        placeholder='Select or create'
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name='createdAt'
                render={() => (
                  <FormItem>
                    <FormLabel>Date and Time</FormLabel>
                    <FormControl>
                      <DateTimePicker
                        value={createdAt}
                        onChange={setCreatedAt}
                        disabled={isSubmitting ? true : { after: new Date() }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {isIncome && (
              <div className='rounded-md border p-4'>
                <FormField
                  control={control}
                  name='addToGoal'
                  render={({ field }) => (
                    <FormItem className='flex flex-row items-center space-y-0 space-x-3'>
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className='space-y-1 leading-none'>
                        <FormLabel>Add to a Goal</FormLabel>
                        <FormDescription>
                          Link this income to one of your saving goals.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                <Collapsible open={addToGoal}>
                  <CollapsibleContent className='data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up overflow-hidden pt-4'>
                    <FormField
                      control={control}
                      name='goalId'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Goal</FormLabel>
                          <FormControl>
                            <GoalCombobox
                              value={field.value}
                              onChange={field.onChange}
                              disabled={isSubmitting}
                              placeholder='Select a goal'
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CollapsibleContent>
                </Collapsible>
              </div>
            )}

            <div className='rounded-md border p-4'>
              <FormField
                control={control}
                name='recurring'
                render={({ field }) => (
                  <FormItem className='flex flex-row items-center space-y-0 space-x-3'>
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <div className='space-y-1 leading-none'>
                      <FormLabel>Recurring Transaction</FormLabel>
                      <FormDescription>
                        Set this transaction to repeat automatically.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              <Collapsible open={isRecurring}>
                <CollapsibleContent className='data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up overflow-hidden pt-4'>
                  <div className='grid grid-cols-1 gap-4 px-2 md:grid-cols-2'>
                    <FormField
                      control={control}
                      name='recurrenceType'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Frequency</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value || ''}
                            disabled={isSubmitting}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder='Select frequency' />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value='hourly'>Hourly</SelectItem>
                              <SelectItem value='daily'>Daily</SelectItem>
                              <SelectItem value='weekly'>Weekly</SelectItem>
                              <SelectItem value='monthly'>Monthly</SelectItem>
                              <SelectItem value='yearly'>Yearly</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name='recurrenceEndDate'
                      render={() => (
                        <FormItem>
                          <FormLabel>End Date (Optional)</FormLabel>
                          <FormControl>
                            <DateTimePicker
                              value={recurrenceEndDate || undefined}
                              onChange={setRecurrenceEndDate}
                              disabled={isSubmitting}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>

            {!isIncome && (
              <FormField
                control={control}
                name='transfer'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transfer Details (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='e.g., Sent to John Doe'
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>

          <div className='pt-2'>
            <Button type='submit' className='w-full' disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : `Add ${isIncome ? 'Income' : 'Expense'}`}
            </Button>
          </div>
        </form>
      </Form>
    </AddModal>
  );
};

export default AddTransactionModal;
