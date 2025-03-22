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
import { useQuery } from '@tanstack/react-query';
import { categoryGetAll } from '@/lib/endpoints/category';
import { accountGetDropdown } from '@/lib/endpoints/accounts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { authGetUserPreferences } from '@/lib/endpoints/auth';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Calendar,
  CreditCard,
  PlusCircle,
  Tag
} from 'lucide-react';
import { AccountDropdown, Category } from '@/lib/types';
import { Label } from '../ui/label';
import DateTimePicker from '../date-time-picker';
import AddCategoryModal from './add-category-modal';
import { Card } from '../ui/card';

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
  createdAt: z.date().default(() => new Date()),
  currency: z.string().min(1, 'Currency is required')
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
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isIncome, setIsIncome] = useState(false);
  const { showError, showSuccess } = useToast();

  const {
    data: categoriesData,
    isLoading: isLoadingCategory,
    refetch: refetchCategories
  } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryGetAll
  });
  const [categories, setCategories] = useState<Category[]>([]);

  const { data: accountData, isLoading: isLoadingAccount } = useQuery({
    queryKey: ['accountDropdown'],
    queryFn: accountGetDropdown
  });
  const [accounts, setAccounts] = useState<AccountDropdown[]>([]);

  const { data: userPreferences } = useQuery({
    queryKey: ['userPreferences'],
    queryFn: authGetUserPreferences
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
      createdAt: new Date(),
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
    register('createdAt', { value: new Date() });
  }, [register]);

  useEffect(() => {
    setValue('isIncome', isIncome);
  }, [isIncome, setValue]);

  // Add new effect to update currency when account changes
  useEffect(() => {
    const selectedAccountId = accountId || watch('accountId');
    const selectedAccount = accounts.find((acc) => acc.id === selectedAccountId);
    if (selectedAccount) {
      setValue('currency', selectedAccount.currency);
    }
  }, [accountId, accounts, setValue, watch]);

  const handleCreateTransaction = async (data: TransactionFormSchema) => {
    try {
      const selectedAccount = accounts.find((acc) => acc.id === data.accountId);
      await transactionCreate({
        ...data,
        amount: Number(data.amount),
        category: data.categoryId,
        account: data.accountId,
        createdAt: data.createdAt.toISOString(),
        currency: selectedAccount?.currency || data.currency
      });

      showSuccess('Transaction created successfully!');
      setIsOpen(false);
      reset();
      onTransactionAdded();
    } catch (error: any) {
      showError(error.message || 'Failed to create transaction');
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);

    if (open) {
      reset({
        isIncome: false,
        createdAt: new Date(),
        ...(accountId && { accountId })
      });
      setIsIncome(false);
    }
  };

  return (
    <AddModal
      title='Add Transaction'
      description='Add a new transaction to your expense tracker.'
      triggerButton={
        triggerButton ?? (
          <Button
            className='bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md hover:from-blue-700 hover:to-indigo-700 max-sm:w-full'
            disabled={isSubmitting}
          >
            Add Transaction
          </Button>
        )
      }
      onOpenChange={handleOpenChange}
      isOpen={isOpen}
    >
      <form onSubmit={handleSubmit(handleCreateTransaction)} className='space-y-6'>
        {/* Transaction Type Selection */}
        <div className='mb-6 grid grid-cols-2 gap-4'>
          <Card
            className={`cursor-pointer border-2 p-4 transition-all ${!isIncome ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-red-500 hover:bg-red-50'} ${isSubmitting ? 'pointer-events-none opacity-50' : ''}`}
            onClick={() => {
              if (!isSubmitting) {
                setIsIncome(false);
                setValue('isIncome', false);
              }
            }}
          >
            <div className='flex flex-col items-center justify-center space-y-2'>
              <ArrowDownCircle
                className={`h-8 w-8 ${!isIncome ? 'text-red-500' : 'text-gray-400'}`}
              />
              <span className={`font-medium ${!isIncome ? 'text-red-500' : 'text-gray-500'}`}>
                Expense
              </span>
            </div>
          </Card>

          <Card
            className={`cursor-pointer border-2 p-4 transition-all ${isIncome ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-500 hover:bg-green-50'} ${isSubmitting ? 'pointer-events-none opacity-50' : ''}`}
            onClick={() => {
              if (!isSubmitting) {
                setIsIncome(true);
                setValue('isIncome', true);
              }
            }}
          >
            <div className='flex flex-col items-center justify-center space-y-2'>
              <ArrowUpCircle
                className={`h-8 w-8 ${isIncome ? 'text-green-500' : 'text-gray-400'}`}
              />
              <span className={`font-medium ${isIncome ? 'text-green-500' : 'text-gray-500'}`}>
                Income
              </span>
            </div>
          </Card>
        </div>

        {/* Account Selection */}

        {accountId ? (
          <input type='hidden' {...register('accountId')} value={accountId} />
        ) : (
          <div className='space-y-2'>
            <div className='flex items-center gap-2'>
              <CreditCard className='h-4 w-4 text-gray-500' />
              <Label htmlFor='account' className='font-medium'>
                Account
              </Label>
            </div>
            <Select
              onValueChange={(value) => setValue('accountId', value)}
              required
              disabled={isSubmitting}
            >
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
            {errors.accountId && <p className='text-sm text-red-500'>{errors.accountId.message}</p>}
          </div>
        )}

        {/* Description */}
        <div className='space-y-2'>
          <Label htmlFor='description' className='font-medium'>
            Description
          </Label>
          <Input
            id='description'
            type='text'
            placeholder='Enter transaction description'
            {...register('text')}
            className='w-full'
            disabled={isSubmitting}
          />
          {errors.text && <p className='text-sm text-red-500'>{errors.text.message}</p>}
        </div>

        {/* Amount and Currency */}
        <div className='space-y-2'>
          <Label htmlFor='amount' className='font-medium'>
            Amount
          </Label>
          <div className='relative'>
            <span className='pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3'>
              {accounts.find((acc) => acc.id === (accountId || watch('accountId')))?.currency || ''}
            </span>
            <Input
              id='amount'
              type='number'
              step='0.01'
              min='0'
              placeholder='0.00'
              {...register('amount')}
              className='w-full pr-10'
              disabled={isSubmitting}
            />
            {errors.amount && <p className='text-sm text-red-500'>{errors.amount.message}</p>}
          </div>
        </div>

        <input type='hidden' {...register('currency')} />

        {/* Category */}
        <div className='space-y-2'>
          <div className='flex items-center gap-2'>
            <Tag className='h-4 w-4 text-gray-500' />
            <Label htmlFor='category' className='font-medium'>
              Category
            </Label>

            <AddCategoryModal
              isOpen={isAddCategoryOpen}
              onOpenChange={setIsAddCategoryOpen}
              onCategoryAdded={refetchCategories}
              triggerButton={
                <Button
                  type='button'
                  variant='outline'
                  size='icon'
                  onClick={() => {
                    if (!isSubmitting) {
                      setIsAddCategoryOpen(true);
                    }
                  }}
                  className={`ml-auto h-6 w-6 ${isSubmitting ? 'pointer-events-none opacity-50' : ''}`}
                  disabled={isSubmitting}
                >
                  <PlusCircle className='h-4 w-4' />
                  <span className='sr-only'>Add category</span>
                </Button>
              }
            />
          </div>
          <Select onValueChange={(value) => setValue('categoryId', value)} disabled={isSubmitting}>
            <SelectTrigger id='category' className='w-full'>
              <SelectValue
                placeholder={isLoadingCategory ? 'Loading categories...' : 'Select category'}
              />
            </SelectTrigger>
            <SelectContent>
              {categories?.length > 0 ? (
                categories.map((cat) => (
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

        {/* Date and Time */}
        <div className='space-y-2'>
          <div className='flex items-center gap-2'>
            <Calendar className='h-4 w-4 text-gray-500' />
            <Label htmlFor='createdAt' className='font-medium'>
              Date and Time
            </Label>
          </div>
          <DateTimePicker
            value={watch('createdAt') || new Date()}
            onChange={(date) => setValue('createdAt', date)}
            disabled={isSubmitting}
          />
          {errors.createdAt && <p className='text-sm text-red-500'>{errors.createdAt.message}</p>}
        </div>

        {/* Submit Button */}
        <Button type='submit' className='w-full disabled:bg-gray-700' disabled={isSubmitting}>
          {isSubmitting ? 'Adding...' : `Add ${isIncome ? 'Income' : 'Expense'}`}
        </Button>
      </form>
    </AddModal>
  );
};

export default AddTransactionModal;
