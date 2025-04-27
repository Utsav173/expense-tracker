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
import { ArrowDownCircle, ArrowUpCircle, Calendar, CreditCard, Tag } from 'lucide-react';
import { AccountDropdown, Category } from '@/lib/types';
import { Label } from '../ui/label';
import { Card } from '../ui/card';
import { NumericFormat } from 'react-number-format';
import DateTimePicker from '../date/date-time-picker';
import { Combobox, ComboboxOption } from '../ui/combobox';

// Define the schema outside of the component
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
  recurrenceType: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional().nullable(),
  recurrenceEndDate: z.string().optional().nullable(),
  currency: z.string().optional().default('')
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
  const [isIncome, setIsIncome] = useState(false);
  const [accounts, setAccounts] = useState<AccountDropdown[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [createdAt, setCreatedAt] = useState<Date>(new Date());
  const [recurrenceEndDate, setRecurrenceEndDate] = useState<Date | null>(null);
  const [categoryComboboxLoading, setCategoryComboboxLoading] = useState(false);
  const [categoryComboboxError, setCategoryComboboxError] = useState<string | null>(null);

  const { showError, showSuccess } = useToast();

  const { data: categoriesData, isLoading: isLoadingCategory } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryGetAll
  });

  const { data: accountData, isLoading: isLoadingAccount } = useQuery({
    queryKey: ['accountDropdown'],
    queryFn: accountGetDropdown
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch
  } = useForm<TransactionFormSchema>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      isIncome: false,
      currency: '',
      ...(accountId && { accountId })
    }
  });

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
    register('isIncome');
    register('currency');
  }, [register]);

  useEffect(() => {
    setValue('isIncome', isIncome);
  }, [isIncome, setValue]);

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
      setIsIncome(false);
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

      // Validate account balance for expenses
      if (
        !data.isIncome &&
        selectedAccount.balance &&
        selectedAccount.balance < Number(data.amount)
      ) {
        showError('Insufficient account balance for this transaction.');
        return;
      }

      const currency = selectedAccount.currency || data.currency || '';
      if (!currency) {
        showError('Currency information is missing. Please select an account with currency.');
        return;
      }

      // Validate recurring transaction fields
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
      showSuccess('Transaction created successfully!');
      setIsOpen(false);
      reset();
      onTransactionAdded();
    } catch (error: any) {
      showError(error.message || 'Failed to create transaction');
    }
  };

  // Handle account selection
  const handleAccountChange = (value: string) => {
    setValue('accountId', value);
    const selectedAccount = accounts.find((acc) => acc.id === value);
    if (selectedAccount) {
      setValue('currency', selectedAccount.currency);
    }
  };

  // Memoized fetchCategoryOptions to prevent infinite re-renders
  const fetchCategoryOptions = useCallback(
    async (query: string): Promise<ComboboxOption[]> => {
      setCategoryComboboxError(null);
      setCategoryComboboxLoading(true);
      try {
        const res = await categoryGetAll({ search: query });
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
    },
    [] // No dependencies needed
  );

  // Memoized handleCreateCategoryInline
  const handleCreateCategoryInline = useCallback(
    async (name: string): Promise<ComboboxOption | null> => {
      try {
        const res = await categoryCreate({ name });
        if (res && res.data.id) {
          setCategories((prev) => [...prev, res.data]);
          setValue('categoryId', res.data.id);
          showSuccess('Category created!');
          return { value: res.data.id, label: res.data.name };
        }
        throw new Error('Invalid response');
      } catch (err: any) {
        showError(err.message || 'Failed to create category');
        return null;
      }
    },
    [setCategories, setValue, showSuccess, showError]
  );

  // Memoized handleCategoryComboboxChange
  const handleCategoryComboboxChange = useCallback(
    async (option: ComboboxOption | null) => {
      if (!option) {
        setValue('categoryId', '');
        return;
      }
      if (option.value === '__create__') {
        // Extract the name from the label
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

  // Disabled function for recurrenceEndDate
  const recurrenceEndDateDisabled = useCallback(
    (date: Date) => {
      if (!createdAt) return true;
      const recurrenceType = watch('recurrenceType');
      if (!recurrenceType) return true;
      if (date < createdAt) return true;
      switch (recurrenceType) {
        case 'daily':
          return date < createdAt;
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
      title='Add Transaction'
      description='Add a new transaction to your expense tracker.'
      triggerButton={
        triggerButton ?? (
          <Button
            className='from-success to-success hover:from-success/80 hover:to-success/80 bg-linear-to-r text-white shadow-md max-sm:w-full'
            disabled={isSubmitting}
          >
            Add Transaction
          </Button>
        )
      }
      onOpenChange={handleOpenChange}
      isOpen={isOpen}
    >
      <form onSubmit={handleSubmit(handleCreateTransaction)} className='space-y-4 overflow-hidden'>
        {/* Transaction Type Selection */}
        <div className='grid grid-cols-2 gap-4'>
          <Card
            className={`cursor-pointer border-2 p-3 transition-all ${!isIncome ? 'border-destructive bg-destructive/10' : 'border-border hover:border-destructive hover:bg-destructive/10'} ${isSubmitting ? 'pointer-events-none opacity-50' : ''}`}
            onClick={() => {
              if (!isSubmitting) {
                setIsIncome(false);
                setValue('isIncome', false);
              }
            }}
          >
            <div className='flex flex-col items-center justify-center gap-1.5'>
              <ArrowDownCircle
                className={`h-6 w-6 ${!isIncome ? 'text-destructive' : 'text-muted-foreground'}`}
              />
              <span
                className={`text-sm font-medium ${!isIncome ? 'text-destructive' : 'text-muted-foreground'}`}
              >
                Expense
              </span>
            </div>
          </Card>

          <Card
            className={`cursor-pointer border-2 p-3 transition-all ${isIncome ? 'border-success bg-success/10' : 'border-border hover:border-success hover:bg-success/10'} ${isSubmitting ? 'pointer-events-none opacity-50' : ''}`}
            onClick={() => {
              if (!isSubmitting) {
                setIsIncome(true);
                setValue('isIncome', true);
              }
            }}
          >
            <div className='flex flex-col items-center justify-center gap-1.5'>
              <ArrowUpCircle
                className={`h-6 w-6 ${isIncome ? 'text-success' : 'text-muted-foreground'}`}
              />
              <span
                className={`text-sm font-medium ${isIncome ? 'text-success' : 'text-muted-foreground'}`}
              >
                Income
              </span>
            </div>
          </Card>
        </div>

        <div className='max-h-full overflow-y-auto'>
          <div className='space-y-4'>
            {/* Account Selection */}
            {accountId ? (
              <input type='hidden' {...register('accountId')} value={accountId} />
            ) : (
              <div className='space-y-2'>
                <div className='flex items-center gap-2'>
                  <CreditCard className='text-muted-foreground h-4 w-4' />
                  <Label htmlFor='account' className='font-medium'>
                    Account
                  </Label>
                </div>
                <Select onValueChange={handleAccountChange} required disabled={isSubmitting}>
                  <SelectTrigger id='account' className='w-full'>
                    <SelectValue
                      placeholder={isLoadingAccount ? 'Loading accounts...' : 'Select account'}
                    />
                  </SelectTrigger>
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
                {errors.accountId && (
                  <p className='text-destructive text-sm'>{errors.accountId.message}</p>
                )}
              </div>
            )}

            {/* Description */}
            <div className='space-y-2'>
              <Label htmlFor='description' className='text-sm font-medium'>
                Description
              </Label>
              <Input
                id='description'
                type='text'
                placeholder='Enter transaction description'
                {...register('text')}
                className='w-full'
                disabled={isSubmitting}
                autoComplete='off'
                autoCorrect='on'
                autoCapitalize='off'
                spellCheck
              />
              {errors.text && <p className='text-destructive text-xs'>{errors.text.message}</p>}
            </div>

            {/* Amount */}
            <div className='space-y-2'>
              <Label htmlFor='amount' className='text-sm font-medium'>
                Amount
              </Label>
              <div className='relative'>
                <span className='text-muted-foreground pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-sm'>
                  {accounts.find((acc) => acc.id === (accountId || watch('accountId')))?.currency ||
                    ''}
                </span>
                <NumericFormat
                  customInput={Input}
                  id='amount'
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
                    setValue('amount', values.value);
                  }}
                  className='w-full pr-10'
                  disabled={isSubmitting}
                />
              </div>
              {errors.amount && <p className='text-destructive text-xs'>{errors.amount.message}</p>}
            </div>

            {/* Transfer Field - Only show for expenses */}
            {!isIncome && (
              <div className='space-y-2'>
                <Label htmlFor='transfer' className='text-sm font-medium'>
                  Transfer (Optional)
                </Label>
                <Input
                  id='transfer'
                  type='text'
                  placeholder='Enter transfer details'
                  {...register('transfer')}
                  className='w-full'
                  disabled={isSubmitting}
                  autoComplete='off'
                  autoCorrect='on'
                  autoCapitalize='off'
                  spellCheck
                />
                {errors.transfer && (
                  <p className='text-destructive text-xs'>{errors.transfer.message}</p>
                )}
              </div>
            )}

            {/* Date and Time */}
            <div className='space-y-2'>
              <div className='flex items-center gap-2'>
                <Calendar className='text-muted-foreground h-4 w-4' />
                <Label htmlFor='date' className='text-sm font-medium'>
                  Date and Time
                </Label>
              </div>
              <DateTimePicker
                value={createdAt}
                onChange={handleCreatedAtChange}
                disabled={isSubmitting ? true : { after: new Date() }}
              />
            </div>

            {/* Recurring Transaction Options */}
            <div className='space-y-4'>
              <div className='flex items-center space-x-2'>
                <input
                  type='checkbox'
                  id='recurring'
                  {...register('recurring')}
                  className='text-primary focus:ring-primary h-4 w-4 rounded border-gray-300'
                  autoComplete='off'
                />
                <Label htmlFor='recurring' className='text-sm font-medium'>
                  Recurring Transaction
                </Label>
              </div>

              {watch('recurring') && (
                <div className='space-y-4 pl-6'>
                  <div className='space-y-2'>
                    <Label htmlFor='recurrenceType' className='text-sm font-medium'>
                      Recurrence Type
                    </Label>
                    <Select
                      onValueChange={(value) =>
                        setValue(
                          'recurrenceType',
                          value as 'daily' | 'weekly' | 'monthly' | 'yearly'
                        )
                      }
                      disabled={isSubmitting}
                    >
                      <SelectTrigger id='recurrenceType' className='w-full'>
                        <SelectValue placeholder='Select recurrence type' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='daily'>Daily</SelectItem>
                        <SelectItem value='weekly'>Weekly</SelectItem>
                        <SelectItem value='monthly'>Monthly</SelectItem>
                        <SelectItem value='yearly'>Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.recurrenceType && (
                      <p className='text-destructive text-xs'>{errors.recurrenceType.message}</p>
                    )}
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='recurrenceEndDate' className='text-sm font-medium'>
                      End Date (Optional)
                    </Label>
                    <DateTimePicker
                      value={recurrenceEndDate || undefined}
                      onChange={handleRecurrenceEndDateChange}
                      disabled={isSubmitting ? true : recurrenceEndDateDisabled}
                    />
                    {errors.recurrenceEndDate && (
                      <p className='text-destructive text-xs'>{errors.recurrenceEndDate.message}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Category */}
            <div className='space-y-2'>
              <div className='flex items-center gap-2'>
                <Tag className='text-muted-foreground h-4 w-4' />
                <Label htmlFor='category' className='text-sm font-medium'>
                  Category
                </Label>
              </div>
              <Combobox
                value={
                  categories.find((cat) => cat.id === watch('categoryId'))
                    ? {
                        value: watch('categoryId')!,
                        label: categories.find((cat) => cat.id === watch('categoryId'))?.name || ''
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
              {errors.categoryId && (
                <p className='text-destructive text-xs'>{errors.categoryId.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          type='submit'
          className='disabled:bg-muted disabled:text-muted-foreground w-full disabled:cursor-not-allowed'
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Adding...' : `Add ${isIncome ? 'Income' : 'Expense'}`}
        </Button>
      </form>
    </AddModal>
  );
};

export default AddTransactionModal;
