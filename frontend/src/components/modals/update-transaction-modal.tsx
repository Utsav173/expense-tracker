'use client';

import React, { useEffect, useState } from 'react';
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
  DialogTitle
} from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import { categoryGetAll } from '@/lib/endpoints/category';
import { accountGetDropdown } from '@/lib/endpoints/accounts';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Transaction as TransactionType } from '@/lib/types';
import { COMMON_CURRENCIES, fetchCurrencies } from '@/lib/endpoints/currency';
import CurrencySelect from '../currency-select';
import DateTimePicker from '../date-time-picker';

const transactionSchema = z.object({
  text: z.string().min(3, 'Transaction description must be at least 3 characters').max(255),
  amount: z.string().refine((val) => !isNaN(parseFloat(val)), 'Must be valid number'),
  isIncome: z.boolean(),
  categoryId: z.string().optional(),
  accountId: z.string(),
  createdAt: z.date(), // Keep as z.date()
  currency: z.string()
});

type TransactionFormSchema = z.infer<typeof transactionSchema>;

interface UpdateTransactionModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: TransactionType | null;
  onUpdate: () => void;
}

const UpdateTransactionModal = ({
  isOpen,
  onOpenChange,
  transaction,
  onUpdate
}: UpdateTransactionModalProps) => {
  const [isIncome, setIsIncome] = useState(false);
  const [openPopover, setOpenPopover] = useState(false); // Control Popover visibility

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
    control
  } = useForm<TransactionFormSchema>({
    resolver: zodResolver(transactionSchema)
  });

  const { showError, showSuccess } = useToast();

  const { data: categoriesData, isLoading: isLoadingCategory } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryGetAll
  });

  const { data: accountData, isLoading: isLoadingAccount } = useQuery({
    queryKey: ['accountDropdown'],
    queryFn: accountGetDropdown
  });

  //Register once.
  useEffect(() => {
    register('isIncome', { value: isIncome });
    register('currency');
  }, [register, isIncome]);

  useEffect(() => {
    if (transaction) {
      setValue('text', transaction.text);
      setValue('amount', transaction.amount.toFixed(2));
      setValue('isIncome', transaction.isIncome);
      setValue('categoryId', transaction.category?.id);
      setValue('accountId', transaction.account);
      setValue('createdAt', new Date(transaction.createdAt)); // Set as Date object
      setValue('currency', transaction.currency);
      setIsIncome(transaction.isIncome);
    }
  }, [transaction, setValue]);

  const { data: currencies, isLoading: isLoadingCurrencies } = useQuery({
    queryKey: ['currencies'],
    queryFn: fetchCurrencies,
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 7 * 24 * 60 * 60 * 1000,
    retry: 2,
    placeholderData: Object.entries(COMMON_CURRENCIES).map(([code, name]) => ({
      code,
      name
    }))
  });

  const handleUpdateTransaction = async (data: TransactionFormSchema) => {
    try {
      await transactionUpdate(transaction!.id, {
        ...data,
        amount: Number(data.amount),
        category: data.categoryId,
        account: data.accountId,
        createdAt: data.createdAt.toISOString() // Convert back to ISO string
      });
      showSuccess('Transaction updated successfully!');
      onOpenChange(false);
      onUpdate();
      reset();
    } catch (error: any) {
      showError(error.message);
    }
  };

  // Close popover when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setOpenPopover(false);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>Update Transaction</DialogTitle>
          <DialogDescription>Update your transaction details.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleUpdateTransaction)} className='space-y-6'>
          <div className='space-y-2'>
            <Label>Transaction Type</Label>
            <RadioGroup
              value={isIncome ? 'income' : 'expense'}
              className='flex gap-4'
              onValueChange={(value) => {
                setIsIncome(value === 'income');
                setValue('isIncome', value === 'income');
              }}
            >
              <div className='flex items-center space-x-2'>
                <RadioGroupItem value='expense' id='expense' />
                <Label htmlFor='expense' className='font-normal'>
                  Expense
                </Label>
              </div>
              <div className='flex items-center space-x-2'>
                <RadioGroupItem value='income' id='income' />
                <Label htmlFor='income' className='font-normal'>
                  Income
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='account'>Account</Label>
            <Select
              onValueChange={(value) => setValue('accountId', value)}
              value={watch('accountId')}
            >
              <SelectTrigger id='account' className='w-full'>
                <SelectValue
                  placeholder={isLoadingAccount ? 'Loading accounts...' : 'Select account'}
                />
              </SelectTrigger>
              <SelectContent className='z-[100]'>
                {accountData && accountData.length > 0 ? (
                  accountData.map((acc) => (
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
            {errors.accountId && <p className='text-sm text-red-500'>Account is required.</p>}
          </div>

          <div className='space-y-2'>
            <Label htmlFor='description'>Description</Label>
            <Input
              id='description'
              type='text'
              placeholder='Enter transaction description'
              {...register('text')}
              className='w-full'
              aria-invalid={!!errors.text}
            />
            {errors.text && <p className='text-sm text-red-500'>{errors.text.message}</p>}
          </div>
          <div className='space-y-2'>
            <Label htmlFor='currency'>Currency</Label>
            <CurrencySelect
              currencies={currencies}
              value={watch('currency')}
              onValueChange={(value) => setValue('currency', value)}
              isLoading={isLoadingCurrencies}
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='amount'>Amount</Label>
            <Input
              id='amount'
              type='text'
              placeholder='Enter amount'
              {...register('amount')}
              className='w-full'
              aria-invalid={!!errors.amount}
            />
            {errors.amount && <p className='text-sm text-red-500'>{errors.amount.message}</p>}
          </div>

          <div className='space-y-2'>
            <Label htmlFor='category'>Category</Label>
            <Select
              onValueChange={(value) => setValue('categoryId', value)}
              value={watch('categoryId')}
            >
              <SelectTrigger id='category' className='w-full'>
                <SelectValue
                  placeholder={isLoadingCategory ? 'Loading categories...' : 'Select category'}
                />
              </SelectTrigger>
              <SelectContent className='z-[100]'>
                {categoriesData?.categories && categoriesData.categories.length > 0 ? (
                  categoriesData.categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value='no-categories' disabled>
                    No categories found
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <div className='space-y-2'>
            <Label htmlFor='createdAt'>Date and Time</Label>
            <DateTimePicker
              value={watch('createdAt')}
              onChange={(date) => setValue('createdAt', date)}
            />
          </div>

          <Button type='submit' className='w-full' disabled={isSubmitting}>
            {isSubmitting ? 'Updating...' : 'Update Transaction'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UpdateTransactionModal;
