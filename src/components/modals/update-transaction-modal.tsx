'use client';

import React from 'react';
import { z } from 'zod';
import { UpdateModal } from './update-modal';
import { Input } from '@/components/ui/input';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Label } from '../ui/label';
import { Transaction as TransactionType } from '@/lib/types';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Clock,
  CreditCard,
  IndianRupee,
  Info,
  Repeat,
  Tag
} from 'lucide-react';
import { Card } from '../ui/card';
import DateTimePicker from '../date/date-time-picker';
import { NumericInput } from '../ui/numeric-input';
import { Combobox } from '../ui/combobox';
import { format, isValid as isValidDate, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { useTransactionForm } from '@/hooks/use-transaction-form';
import { transactionUpdate } from '@/lib/endpoints/transactions';

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
  const {
    form,
    isRecurringInstance,
    accountsData,
    localCategories,
    isLoadingCategory,
    fetchCategoryOptions,
    handleCategoryComboboxChange,
    categoryComboboxLoading,
    categoryComboboxError
  } = useTransactionForm({ transaction, isOpen });

  const handleUpdate = (id: string, data: z.infer<typeof updateTransactionSchema>) => {
    if (!transaction) throw new Error('Transaction not found');

    let apiPayload: any;

    if (isRecurringInstance) {
      apiPayload = {
        ...transaction,
        id: transaction.id,
        text: data.text,
        category: data.categoryId || '',
        transfer: data.transfer || '',
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
        text: data.text,
        amount: parseFloat(data.amount),
        isIncome: data.isIncome,
        category: data.categoryId || '',
        createdAt: data.createdAt.toISOString(),
        transfer: data.transfer || '',
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
    }, {} as Partial<any>);

    return transactionUpdate(id, cleanPayload);
  };

  if (!transaction) return null;

  return (
    <UpdateModal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="Update Transaction"
      description="Modify the details of this transaction."
      initialValues={form.getValues()}
      validationSchema={updateTransactionSchema}
      updateFn={handleUpdate}
      invalidateKeys={[
        ['accountTransactions', transaction?.account],
        ['dashboardData'],
        ['customAnalytics', transaction?.account],
        ['incomeExpenseChart', transaction?.account],
        ...(queryKey ? [queryKey] : [])
      ]}
      onSuccess={onUpdate}
      entityId={transaction.id}
    >
      {(form) => (
        <>
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
                Only the Description can be edited for this recurring transaction instance.
                Financial details, category, and transfer information must be edited on the recurring template.
              </AlertDescription>
            </Alert>
          )}

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
                <IndianRupee size={14} /> Currency
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

          {!isRecurringInstance && (
            <div className='grid grid-cols-2 gap-4'>
              <Card
                className={cn(
                  'cursor-pointer border-2 p-3 transition-all',
                  !form.watch('isIncome')
                    ? 'border-destructive bg-destructive/10'
                    : 'border-border hover:border-destructive hover:bg-destructive/10',
                  form.formState.isSubmitting &&
                    'hover:border-border cursor-not-allowed opacity-60 hover:bg-transparent'
                )}
                onClick={() => !form.formState.isSubmitting && form.setValue('isIncome', false)}
                aria-disabled={form.formState.isSubmitting}
              >
                <div className='flex flex-col items-center justify-center gap-1.5'>
                  <ArrowDownCircle
                    className={cn(
                      'h-6 w-6',
                      !form.watch('isIncome') ? 'text-destructive' : 'text-muted-foreground'
                    )}
                  />
                  <span
                    className={cn(
                      'text-sm font-medium',
                      !form.watch('isIncome') ? 'text-destructive' : 'text-muted-foreground'
                    )}
                  >
                    Expense
                  </span>
                </div>
              </Card>

              <Card
                className={cn(
                  'cursor-pointer border-2 p-3 transition-all',
                  form.watch('isIncome')
                    ? 'border-success bg-success/10'
                    : 'border-border hover:border-success hover:bg-success/10',
                  form.formState.isSubmitting &&
                    'hover:border-border cursor-not-allowed opacity-60 hover:bg-transparent'
                )}
                onClick={() => !form.formState.isSubmitting && form.setValue('isIncome', true)}
                aria-disabled={form.formState.isSubmitting}
              >
                <div className='flex flex-col items-center justify-center gap-1.5'>
                  <ArrowUpCircle
                    className={cn(
                      'h-6 w-6',
                      form.watch('isIncome') ? 'text-success' : 'text-muted-foreground'
                    )}
                  />
                  <span
                    className={cn(
                      'text-sm font-medium',
                      form.watch('isIncome') ? 'text-success' : 'text-muted-foreground'
                    )}
                  >
                    Income
                  </span>
                </div>
              </Card>
            </div>
          )}

          <FormField
            control={form.control}
            name='text'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description*</FormLabel>
                <FormControl>
                  <Input
                    placeholder='Enter description'
                    {...field}
                    disabled={form.formState.isSubmitting}
                  />
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
                        disabled={form.formState.isSubmitting}
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
                        disabled={form.formState.isSubmitting}
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
                        disabled={form.formState.isSubmitting}
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
                      disabled={form.formState.isSubmitting}
                      className='w-full'
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}
        </>
      )}
    </UpdateModal>
  );
};

export default UpdateTransactionModal;