'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/lib/hooks/useToast';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { transactionCreate } from '@/lib/endpoints/transactions';
import AddModal from './add-modal';
import { useQuery } from '@tanstack/react-query';
import { categoryGetAll, categoryCreate } from '@/lib/endpoints/category';
import { accountGetDropdown } from '@/lib/endpoints/accounts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import type { AccountAPI, CategoryAPI } from '@/lib/api/api-types';
import { Card } from '../ui/card';
import { NumericFormat } from 'react-number-format';
import DateTimePicker from '../date/date-time-picker';
import { Combobox, ComboboxOption } from '../ui/combobox';
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

const transactionSchema = z.object({
  text: z.string().min(3, 'Description must be at least 3 characters').max(255),
  amount: z
    .string()
    .refine(
      (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
      'Amount must be a positive number'
    ),
  isIncome: z.boolean(),
  categoryId: z.string().optional(),
  accountId: z.string().min(1, 'Please select an account'),
  transfer: z.string().optional(),
  recurring: z.boolean().optional(),
  recurrenceType: z.enum(['daily', 'weekly', 'monthly', 'yearly', 'hourly']).optional().nullable(),
  recurrenceEndDate: z.string().optional().nullable(),
  currency: z.string().optional().default(''),
  createdAt: z.string().optional().nullable()
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
  const [categories, setCategories] = useState<CategoryAPI.Category[]>([]);
  const [createdAt, setCreatedAt] = useState<Date>(new Date());
  const [recurrenceEndDate, setRecurrenceEndDate] = useState<Date | null>(null);
  const [categoryComboboxLoading, setCategoryComboboxLoading] = useState(false);
  const [categoryComboboxError, setCategoryComboboxError] = useState<string | null>(null);

  const { showError } = useToast();

  const { data: categoriesData, isLoading: isLoadingCategory } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryGetAll({ limit: 100, page: 1, sortBy: 'name', sortOrder: 'asc' })
  });

  const { data: accountData, isLoading: isLoadingAccount } = useQuery({
    queryKey: ['accountDropdown'],
    queryFn: accountGetDropdown
  });

  const form = useForm<TransactionFormSchema>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      isIncome: false,
      currency: '',
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

  useEffect(() => {
    if (categoriesData?.categories) {
      setCategories(categoriesData.categories);
    }
  }, [categoriesData?.categories]);

  useEffect(() => {
    if (accountData) {
      setAccounts(accountData);
    }
  }, [accountData]);

  useEffect(() => {
    const selectedAccountId = accountId || watch('accountId');
    const selectedAccount = accounts.find((acc) => acc.id === selectedAccountId);
    if (selectedAccount) {
      setValue('currency', selectedAccount.currency);
    }
  }, [accountId, accounts, setValue, watch]);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);

    if (open) {
      reset({
        isIncome: false,
        currency: '',
        ...(accountId && { accountId })
      });
      setCreatedAt(new Date());
      setRecurrenceEndDate(null);
    }
  };

  const handleCreatedAtChange = (date: Date) => {
    setCreatedAt(date);
  };

  const handleRecurrenceEndDateChange = (date: Date) => {
    setRecurrenceEndDate(date);
    setValue('recurrenceEndDate', date.toISOString());
  };

  const handleCreateTransaction = async (data: TransactionFormSchema) => {
    try {
      const selectedAccount = accounts.find((acc) => acc.id === data.accountId);

      if (!selectedAccount) {
        showError('Account information not found. Please try again.');
        return;
      }

      const currency = selectedAccount.currency || data.currency || '';
      if (!currency) {
        showError('Currency information is missing. Please select an account with currency.');
        return;
      }

      if (data.recurring) {
        if (!data.recurrenceType) {
          showError('Please select a recurrence type for recurring transactions.');
          return;
        }
      }

      const transactionData = {
        text: data.text,
        amount: Number(data.amount),
        isIncome: data.isIncome,
        category: data.categoryId,
        account: data.accountId,
        transfer: data.transfer || '',
        recurring: data.recurring || false,
        recurrenceType: data.recurring ? data.recurrenceType : null,
        recurrenceEndDate: data.recurring ? data.recurrenceEndDate : null,
        currency: currency,
        createdAt: createdAt.toISOString()
      };

      await transactionCreate(transactionData);
      setIsOpen(false);
      reset();
      onTransactionAdded();
    } catch (error: any) {
      showError(error.message || 'Failed to create transaction');
    }
  };

  const handleAccountChange = (value: string) => {
    setValue('accountId', value);
    const selectedAccount = accounts.find((acc) => acc.id === value);
    if (selectedAccount) {
      setValue('currency', selectedAccount.currency);
    }
  };

  const fetchCategoryOptions = useCallback(async (query: string): Promise<ComboboxOption[]> => {
    setCategoryComboboxError(null);
    setCategoryComboboxLoading(true);
    try {
      const res = await categoryGetAll({
        search: query,
        page: 1,
        limit: 20,
        sortBy: 'name',
        sortOrder: 'asc'
      });
      const cats = res?.categories || [];
      const options = cats.map((cat) => ({ value: cat.id, label: cat.name }));
      if (query && !options.some((opt) => opt.label.toLowerCase() === query.toLowerCase())) {
        options.push({ value: '__create__', label: `Create "${query}"` });
      }
      return options;
    } catch (err: any) {
      setCategoryComboboxError('Failed to load categories');
      return [];
    } finally {
      setCategoryComboboxLoading(false);
    }
  }, []);

  const handleCreateCategoryInline = useCallback(
    async (name: string): Promise<ComboboxOption | null> => {
      try {
        const res = await categoryCreate({ name });
        if (res && res.data.id) {
          setCategories((prev) => [...prev, res.data]);
          setValue('categoryId', res.data.id);
          return { value: res.data.id, label: res.data.name };
        }
        throw new Error('Invalid response');
      } catch (err: any) {
        showError(err.message || 'Failed to create category');
        return null;
      }
    },
    [setCategories, setValue, showError]
  );

  const handleCategoryComboboxChange = useCallback(
    async (option: ComboboxOption | null) => {
      if (!option) {
        setValue('categoryId', '');
        return;
      }
      if (option.value === '__create__') {
        const match = option.label.match(/^Create\s+"(.+)"$/);
        const name = match ? match[1] : '';
        if (name) {
          const created = await handleCreateCategoryInline(name);
          if (created) {
            setValue('categoryId', created.value);
          }
        }
        return;
      }
      setValue('categoryId', option.value);
    },
    [setValue, handleCreateCategoryInline]
  );

  const recurrenceEndDateDisabled = useCallback(
    (date: Date) => {
      if (!createdAt) return true;
      const recurrenceType = watch('recurrenceType');
      if (!recurrenceType) return true;
      if (date < createdAt) return true;
      switch (recurrenceType) {
        case 'daily':
          return date < createdAt;
        case 'hourly': {
          return date < createdAt;
        }
        case 'weekly': {
          const diff = Math.floor((date.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
          return diff < 0 || diff % 7 !== 0;
        }
        case 'monthly': {
          const createdDay = createdAt.getDate();
          return (
            date < createdAt ||
            date.getDate() !== createdDay ||
            (date.getFullYear() === createdAt.getFullYear() &&
              date.getMonth() === createdAt.getMonth())
          );
        }
        case 'yearly': {
          const createdDay = createdAt.getDate();
          const createdMonth = createdAt.getMonth();
          return (
            date < createdAt ||
            date.getDate() !== createdDay ||
            date.getMonth() !== createdMonth ||
            date.getFullYear() === createdAt.getFullYear()
          );
        }
        default:
          return true;
      }
    },
    [createdAt, watch]
  );

  return (
    <AddModal
      title={isIncome ? 'Add Income' : 'Add Expense'}
      description='Add a new transaction to your expense tracker.'
      icon={<Icon name={isIncome ? 'arrowUpCircle' : 'arrowDownCircle'} className='h-5 w-5' />}
      iconClassName={isIncome ? 'bg-income-muted text-income' : 'bg-expense-muted text-expense'}
      triggerButton={
        triggerButton ?? (
          <Button variant={'transaction'} disabled={isSubmitting}>
            Add Transaction
          </Button>
        )
      }
      onOpenChange={handleOpenChange}
      isOpen={isOpen}
    >
      <Form {...form}>
        <form
          onSubmit={handleSubmit(handleCreateTransaction)}
          className='space-y-4 overflow-hidden'
        >
          <div className='grid grid-cols-2 gap-4'>
            <Card
              className={cn(
                'cursor-pointer border-2 p-3 transition-all',
                !isIncome
                  ? 'border-destructive bg-destructive/10'
                  : 'border-border hover:border-destructive hover:bg-destructive/10',
                isSubmitting && 'pointer-events-none opacity-50'
              )}
              onClick={() => {
                if (!isSubmitting) {
                  setValue('isIncome', false);
                }
              }}
            >
              <div className='flex flex-col items-center justify-center gap-1.5'>
                <Icon
                  name={'arrowDownCircle'}
                  className={cn(
                    'h-6 w-6',
                    !isIncome ? 'text-destructive' : 'text-muted-foreground'
                  )}
                />
                <span
                  className={cn(
                    'text-sm font-medium',
                    !isIncome ? 'text-destructive' : 'text-muted-foreground'
                  )}
                >
                  Expense
                </span>
              </div>
            </Card>

            <Card
              className={cn(
                'cursor-pointer border-2 p-3 transition-all',
                isIncome
                  ? 'border-success bg-success/10'
                  : 'border-border hover:border-success hover:bg-success/10',
                isSubmitting && 'pointer-events-none opacity-50'
              )}
              onClick={() => {
                if (!isSubmitting) {
                  setValue('isIncome', true);
                }
              }}
            >
              <div className='flex flex-col items-center justify-center gap-1.5'>
                <Icon
                  name={'arrowUpCircle'}
                  className={cn('h-6 w-6', isIncome ? 'text-success' : 'text-muted-foreground')}
                />
                <span
                  className={cn(
                    'text-sm font-medium',
                    isIncome ? 'text-success' : 'text-muted-foreground'
                  )}
                >
                  Income
                </span>
              </div>
            </Card>
          </div>

          <div className='max-h-full overflow-y-auto px-1'>
            <div className='space-y-4'>
              {accountId ? (
                <input type='hidden' {...form.register('accountId')} value={accountId} />
              ) : (
                <FormField
                  control={control}
                  name='accountId'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='flex items-center gap-2'>
                        <Icon name='creditCard' className='text-muted-foreground h-4 w-4' />
                        Account
                      </FormLabel>
                      <Select
                        onValueChange={handleAccountChange}
                        value={field.value}
                        disabled={isSubmitting}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                isLoadingAccount ? 'Loading accounts...' : 'Select account'
                              }
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {accounts && accounts.length > 0 ? (
                            accounts.map((acc) => (
                              <SelectItem key={acc.id} value={acc.id}>
                                {acc.name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value='no-account' disabled>
                              No account added
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={control}
                name='text'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Enter transaction description'
                        {...field}
                        disabled={isSubmitting}
                        autoComplete='off'
                        autoCorrect='on'
                        autoCapitalize='off'
                        spellCheck
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name='amount'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <div className='relative'>
                        <span className='text-muted-foreground pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-sm'>
                          {accounts.find((acc) => acc.id === (accountId || watch('accountId')))
                            ?.currency || ''}
                        </span>
                        <NumericFormat
                          customInput={Input}
                          thousandSeparator=','
                          decimalSeparator='.'
                          allowNegative={false}
                          decimalScale={2}
                          placeholder='0.00'
                          autoComplete='off'
                          autoCorrect='on'
                          autoCapitalize='off'
                          spellCheck
                          onValueChange={(values) => {
                            field.onChange(values.value);
                          }}
                          className='w-full pr-10'
                          disabled={isSubmitting}
                          value={field.value}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {!isIncome && (
                <FormField
                  control={control}
                  name='transfer'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Transfer (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='Enter transfer details'
                          {...field}
                          disabled={isSubmitting}
                          autoComplete='off'
                          autoCorrect='on'
                          autoCapitalize='off'
                          spellCheck
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={control}
                name='createdAt'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='flex items-center gap-2'>
                      <Icon name='calendar' className='text-muted-foreground h-4 w-4' />
                      Date and Time
                    </FormLabel>
                    <FormControl>
                      <DateTimePicker
                        value={createdAt}
                        onChange={handleCreatedAtChange}
                        disabled={isSubmitting ? true : { after: new Date() }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='space-y-4'>
                <FormField
                  control={control}
                  name='recurring'
                  render={({ field }) => (
                    <FormItem className='flex flex-row items-start space-y-0 space-x-3 rounded-md border p-4'>
                      <FormControl>
                        <input
                          type='checkbox'
                          checked={field.value}
                          onChange={field.onChange}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <div className='space-y-1 leading-none'>
                        <FormLabel>Recurring Transaction</FormLabel>
                        <FormDescription>
                          Set up this transaction to repeat automatically.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                {watch('recurring') && (
                  <div className='space-y-4 pl-6'>
                    <FormField
                      control={control}
                      name='recurrenceType'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Recurrence Type</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value || ''}
                            disabled={isSubmitting}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder='Select recurrence type' />
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
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Date (Optional)</FormLabel>
                          <FormControl>
                            <DateTimePicker
                              value={recurrenceEndDate || undefined}
                              onChange={handleRecurrenceEndDateChange}
                              disabled={isSubmitting ? true : recurrenceEndDateDisabled}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>

              <FormField
                control={control}
                name='categoryId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='flex items-center gap-2'>
                      <Icon name='tag' className='text-muted-foreground h-4 w-4' />
                      Category
                    </FormLabel>
                    <FormControl>
                      <Combobox
                        value={
                          categories.find((cat) => cat.id === field.value)
                            ? {
                                value: field.value!,
                                label: categories.find((cat) => cat.id === field.value)?.name || ''
                              }
                            : null
                        }
                        onChange={handleCategoryComboboxChange}
                        fetchOptions={fetchCategoryOptions}
                        placeholder={
                          isLoadingCategory ? 'Loading categories...' : 'Select or create category'
                        }
                        noOptionsMessage={
                          categoryComboboxLoading
                            ? 'Loading...'
                            : categoryComboboxError || 'No categories found. Type to create.'
                        }
                        loadingPlaceholder='Loading categories...'
                        disabled={isSubmitting}
                        className='w-full'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <Button type='submit' className='w-full' disabled={isSubmitting}>
            {isSubmitting ? 'Adding...' : `Add ${isIncome ? 'Income' : 'Expense'}`}
          </Button>
        </form>
      </Form>
    </AddModal>
  );
};

export default AddTransactionModal;
