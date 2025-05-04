'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/lib/hooks/useToast';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { transactionUpdate } from '@/lib/endpoints/transactions';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogFooter
} from '@/components/ui/dialog';
import { useMutation, useQuery } from '@tanstack/react-query';
import { categoryGetAll, categoryCreate } from '@/lib/endpoints/category';
import { accountGetDropdown } from '@/lib/endpoints/accounts';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Label } from '../ui/label';
import { Transaction as TransactionType, Category } from '@/lib/types';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Clock,
  CreditCard,
  DollarSign,
  Info,
  Loader2,
  Pencil,
  Repeat,
  Tag,
  X
} from 'lucide-react';
import { Card } from '../ui/card';
import { useInvalidateQueries } from '@/hooks/useInvalidateQueries';
import DateTimePicker from '../date/date-time-picker';
import { NumericInput } from '../ui/numeric-input';
import { Combobox, ComboboxOption } from '../ui/combobox';
import { format, isValid as isValidDate, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

const updateTransactionSchema = z.object({
  text: z.string().min(3, 'Description must be at least 3 characters.').max(255),
  amount: z
    .string()
    .min(1, { message: 'Amount is required.' })
    .refine((value) => !isNaN(parseFloat(value)) && parseFloat(value) >= 0, {
      message: 'Amount must be a non-negative number.'
    }),
  isIncome: z.boolean(),
  categoryId: z.string().uuid('Invalid category format.').optional().nullable(),
  createdAt: z.date({ required_error: 'Transaction date is required.' }),
  transfer: z.string().max(64, 'Transfer info too long.').optional().nullable()
});

type UpdateTransactionFormSchema = z.infer<typeof updateTransactionSchema>;

type TransactionApiPayload = Omit<
  TransactionType,
  'category' | 'createdBy' | 'updatedBy' | 'owner' | 'account'
> & {
  category?: string | null;
  account: string;
  createdAt: string;
  amount: number;
};

interface UpdateTransactionModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: TransactionType | null;
  onUpdate: () => void;
  queryKey?: any[];
}

const UpdateTransactionModal: React.FC<UpdateTransactionModalProps> = ({
  isOpen,
  onOpenChange,
  transaction,
  onUpdate,
  queryKey
}) => {
  const { showError, showSuccess } = useToast();
  const invalidate = useInvalidateQueries();
  const [categoryComboboxLoading, setCategoryComboboxLoading] = useState(false);
  const [categoryComboboxError, setCategoryComboboxError] = useState<string | null>(null);
  const [localCategories, setLocalCategories] = useState<Category[]>([]);

  const isRecurringInstance = useMemo(() => !!transaction?.recurring, [transaction]);

  const form = useForm<UpdateTransactionFormSchema>({
    resolver: zodResolver(updateTransactionSchema),
    mode: 'onChange'
  });

  const {
    handleSubmit,
    formState: { errors, isSubmitting, isValid, isDirty },
    reset,
    setValue,
    watch
  } = form;

  const {
    data: categoriesData,
    isLoading: isLoadingCategory,
    refetch: refetchCategories
  } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryGetAll({ limit: 100 }),
    staleTime: 5 * 60 * 1000
  });

  const { data: accountsData, isLoading: isLoadingAccount } = useQuery({
    queryKey: ['accountDropdown'],
    queryFn: accountGetDropdown,
    staleTime: 5 * 60 * 1000
  });

  useEffect(() => {
    if (isOpen && transaction) {
      reset({
        text: transaction.text || '',
        amount: transaction.amount?.toString() ?? '',
        isIncome: transaction.isIncome ?? false,
        categoryId: transaction.category?.id || null,
        createdAt: transaction.createdAt ? parseISO(transaction.createdAt) : new Date(),
        transfer: transaction.transfer || null
      });
    } else if (!isOpen) {
      reset({
        text: '',
        amount: '',
        isIncome: false,
        categoryId: null,
        createdAt: new Date(),
        transfer: null
      });
    }
  }, [isOpen, transaction, reset]);

  useEffect(() => {
    if (categoriesData?.categories) {
      setLocalCategories(categoriesData.categories);
    }
  }, [categoriesData]);

  const fetchCategoryOptions = useCallback(
    async (query: string): Promise<ComboboxOption[]> => {
      setCategoryComboboxError(null);
      setCategoryComboboxLoading(true);
      try {
        const currentCategories = localCategories || [];
        const filtered = currentCategories
          .filter((cat) => cat.name.toLowerCase().includes(query.toLowerCase()))
          .map((cat) => ({ value: cat.id, label: cat.name }));

        const options = filtered;

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
    [localCategories]
  );

  const handleCreateCategoryInline = useCallback(
    async (name: string): Promise<ComboboxOption | null> => {
      try {
        const res = await categoryCreate({ name });
        if (res && res.data.id) {
          await refetchCategories();
          showSuccess('Category created!');
          return { value: res.data.id, label: res.data.name };
        }
        throw new Error('Invalid response');
      } catch (err: any) {
        showError(err.message || 'Failed to create category');
        return null;
      }
    },
    [refetchCategories, showSuccess, showError]
  );

  const handleCategoryComboboxChange = useCallback(
    async (option: ComboboxOption | null) => {
      if (!option) {
        setValue('categoryId', null);
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

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: TransactionApiPayload }) =>
      transactionUpdate(id, data),
    onSuccess: async () => {
      showSuccess('Transaction updated successfully!');
      const cacheKeysToInvalidate = [
        ['accountTransactions', transaction?.account],
        ['dashboardData'],
        ['customAnalytics', transaction?.account],
        ['incomeExpenseChart', transaction?.account],
        ...(queryKey ? [queryKey] : [])
      ];
      await Promise.all(cacheKeysToInvalidate.map((key) => invalidate(key)));
      onUpdate();
      onOpenChange(false);
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || error.message || 'Failed to update transaction.';
      showError(message);
    }
  });

  const handleUpdateTransaction = (formData: UpdateTransactionFormSchema) => {
    if (!transaction) return;

    let apiPayload: TransactionApiPayload;

    if (isRecurringInstance) {
      apiPayload = {
        ...transaction,
        id: transaction.id,
        text: formData.text,
        category: formData.categoryId || '',
        transfer: formData.transfer || '',
        amount: transaction.amount,
        isIncome: transaction.isIncome,
        createdAt: transaction.createdAt,
        account: transaction.account,
        currency: transaction.currency,
        recurring: transaction.recurring,
        recurrenceType: transaction.recurrenceType,
        recurrenceEndDate: transaction.recurrenceEndDate
      };
    } else {
      apiPayload = {
        ...transaction,
        id: transaction.id,
        text: formData.text,
        amount: parseFloat(formData.amount),
        isIncome: formData.isIncome,
        category: formData.categoryId || '',
        createdAt: formData.createdAt.toISOString(),
        transfer: formData.transfer || '',
        account: transaction.account,
        currency: transaction.currency,
        recurring: transaction.recurring,
        recurrenceType: transaction.recurrenceType,
        recurrenceEndDate: transaction.recurrenceEndDate
      };
    }

    const cleanPayload = Object.entries(apiPayload).reduce((acc, [key, value]) => {
      if (value !== undefined || key === 'categoryId' || key === 'transfer') {
        (acc as any)[key] = value;
      }
      return acc;
    }, {} as Partial<TransactionApiPayload>);

    updateMutation.mutate({ id: transaction.id, data: cleanPayload as TransactionApiPayload });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Pencil className='h-5 w-5' /> Update Transaction
          </DialogTitle>
          <DialogDescription>Modify the details of this transaction.</DialogDescription>
        </DialogHeader>

        {isRecurringInstance && (
          <Alert
            variant='default'
            className='border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950'
          >
            <Info className='h-4 w-4 text-blue-600 dark:text-blue-400' />
            <AlertTitle className='text-blue-800 dark:text-blue-300'>
              Recurring Transaction Instance
            </AlertTitle>
            <AlertDescription className='text-blue-700 dark:text-blue-300/90'>
              Only Description, Category, and Transfer details can be edited for this instance.
              Financial details must be edited on the recurring template.
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={handleSubmit(handleUpdateTransaction)} className='space-y-5 pt-2'>
            {/* Display Only Fields */}
            <div className='bg-muted/50 grid grid-cols-2 gap-4 rounded-md border p-4'>
              <div className='space-y-1'>
                <Label className='text-muted-foreground flex items-center gap-1.5 text-xs'>
                  <CreditCard size={14} /> Account
                </Label>
                <p className='truncate text-sm font-medium'>
                  {transaction
                    ? accountsData?.find((acc) => acc.id === transaction.account)?.name
                    : '...'}
                </p>
              </div>
              <div className='space-y-1'>
                <Label className='text-muted-foreground flex items-center gap-1.5 text-xs'>
                  <DollarSign size={14} /> Currency
                </Label>
                <p className='text-sm font-medium'>{transaction?.currency ?? 'N/A'}</p>
              </div>
              {transaction?.recurring && (
                <div className='col-span-2 space-y-1'>
                  <Label className='text-muted-foreground flex items-center gap-1.5 text-xs'>
                    <Repeat size={14} /> Recurring Info
                  </Label>
                  <p className='text-sm font-medium'>
                    {transaction.recurrenceType
                      ? `${transaction.recurrenceType.charAt(0).toUpperCase()}${transaction.recurrenceType.slice(1)}`
                      : 'Recurring'}
                    {transaction.recurrenceEndDate &&
                    isValidDate(parseISO(transaction.recurrenceEndDate))
                      ? ` until ${format(parseISO(transaction.recurrenceEndDate), 'MMM d, yyyy')}`
                      : ''}
                  </p>
                </div>
              )}
              {transaction?.recurring && (
                <>
                  <div className='space-y-1'>
                    <Label className='text-muted-foreground flex items-center gap-1.5 text-xs'>
                      <Clock size={14} /> Created At
                    </Label>
                    <p className='text-sm font-medium'>
                      {transaction.createdAt
                        ? format(parseISO(transaction.createdAt), 'MMM d, yyyy')
                        : 'N/A'}
                    </p>
                  </div>
                  <div className='space-y-1'>
                    <Label className='text-muted-foreground flex items-center gap-1.5 text-xs'>
                      Amount
                    </Label>
                    <p className='text-sm font-medium'>{transaction.amount ?? 'N/A'}</p>
                  </div>

                  <div className='space-y-1'>
                    <Label className='text-muted-foreground flex items-center gap-1.5 text-xs'>
                      Category
                    </Label>
                    <p className='text-sm font-medium'>{transaction.category?.name ?? 'N/A'}</p>
                  </div>
                </>
              )}
            </div>

            {/* Transaction Type Selection (Cards) - Conditionally Disabled */}

            {!isRecurringInstance && (
              <div className='grid grid-cols-2 gap-4'>
                <Card
                  className={cn(
                    'cursor-pointer border-2 p-3 transition-all',
                    !watch('isIncome')
                      ? 'border-destructive bg-destructive/10'
                      : 'border-border hover:border-destructive hover:bg-destructive/10',
                    isSubmitting &&
                      'hover:border-border cursor-not-allowed opacity-60 hover:bg-transparent'
                  )}
                  onClick={() => !isSubmitting && setValue('isIncome', false)}
                  aria-disabled={isSubmitting}
                >
                  <div className='flex flex-col items-center justify-center gap-1.5'>
                    <ArrowDownCircle
                      className={cn(
                        'h-6 w-6',
                        !watch('isIncome') ? 'text-destructive' : 'text-muted-foreground'
                      )}
                    />
                    <span
                      className={cn(
                        'text-sm font-medium',
                        !watch('isIncome') ? 'text-destructive' : 'text-muted-foreground'
                      )}
                    >
                      Expense
                    </span>
                  </div>
                </Card>

                <Card
                  className={cn(
                    'cursor-pointer border-2 p-3 transition-all',
                    watch('isIncome')
                      ? 'border-success bg-success/10'
                      : 'border-border hover:border-success hover:bg-success/10',
                    isSubmitting &&
                      'hover:border-border cursor-not-allowed opacity-60 hover:bg-transparent'
                  )}
                  onClick={() => !isSubmitting && setValue('isIncome', true)}
                  aria-disabled={isSubmitting}
                >
                  <div className='flex flex-col items-center justify-center gap-1.5'>
                    <ArrowUpCircle
                      className={cn(
                        'h-6 w-6',
                        watch('isIncome') ? 'text-success' : 'text-muted-foreground'
                      )}
                    />
                    <span
                      className={cn(
                        'text-sm font-medium',
                        watch('isIncome') ? 'text-success' : 'text-muted-foreground'
                      )}
                    >
                      Income
                    </span>
                  </div>
                </Card>
              </div>
            )}

            {/* Editable Fields */}
            <FormField
              control={form.control}
              name='text'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description*</FormLabel>
                  <FormControl>
                    <Input placeholder='Enter description' {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!isRecurringInstance && (
              <>
                <FormField
                  control={form.control}
                  name='amount'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount*</FormLabel>
                      <FormControl>
                        <NumericInput
                          placeholder='0.00'
                          className='w-full pr-10'
                          disabled={isSubmitting}
                          value={field.value}
                          onValueChange={(values: { value: string }) =>
                            field.onChange(values.value)
                          }
                          suffix={` ${transaction?.currency || ''}`}
                          ref={field.ref as React.Ref<HTMLInputElement>}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='createdAt'
                  render={({ field }) => (
                    <FormItem className='flex flex-col'>
                      <FormLabel>Date and Time*</FormLabel>
                      <FormControl>
                        <DateTimePicker
                          value={field.value}
                          onChange={field.onChange}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='transfer'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Transfer Details (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='E.g., Counterparty, Reference'
                          {...field}
                          value={field.value ?? ''}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='categoryId'
                  render={({ field }) => (
                    <FormItem className='flex flex-col'>
                      <FormLabel className='flex items-center gap-1.5'>
                        <Tag size={16} className='text-muted-foreground' /> Category (Optional)
                      </FormLabel>
                      <Combobox
                        value={
                          localCategories.find((cat) => cat.id === field.value)
                            ? {
                                value: field.value!,
                                label:
                                  localCategories.find((cat) => cat.id === field.value)?.name || ''
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <DialogFooter className='gap-2 pt-4 sm:gap-0'>
              <DialogClose asChild>
                <Button type='button' variant='outline' disabled={isSubmitting}>
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type='submit'
                disabled={isSubmitting || !isValid || !isDirty}
                className='min-w-[120px]'
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Updating...
                  </>
                ) : (
                  'Update Transaction'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default UpdateTransactionModal;
