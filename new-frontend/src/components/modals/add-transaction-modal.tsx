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
import { categoryGetAll, categoryCreate } from '@/lib/endpoints/category';
import { accountGetDropdown } from '@/lib/endpoints/accounts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { authGetUserPreferences } from '@/lib/endpoints/auth';
import { PlusCircle } from 'lucide-react';
import { AccountDropdown, Category } from '@/lib/types';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
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

const categorySchema = z.object({
  name: z
    .string()
    .min(1, 'Category name must be at least 1 character') // Improved error messages
    .max(64, 'Category name must be no more than 64 characters')
    .trim()
});

type TransactionFormSchema = z.infer<typeof transactionSchema>;
type CategoryFormSchema = z.infer<typeof categorySchema>; //Created type

interface AddTransactionModalProps {
  onTransactionAdded: () => void;
}

const AddTransactionModal = ({ onTransactionAdded }: AddTransactionModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isIncome, setIsIncome] = useState(false);

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

  const preferredCurrency = userPreferences?.preferredCurrency || 'INR';

  const categoryForm = useForm<CategoryFormSchema>({
    resolver: zodResolver(categorySchema)
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
      currency: preferredCurrency
    }
  });

  const { showError, showSuccess } = useToast();

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

  //Register once.
  useEffect(() => {
    register('isIncome', { value: isIncome });
    register('currency'); //Register currency.
  }, [register, isIncome]);

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

  const handleCreateTransaction = async (data: TransactionFormSchema) => {
    try {
      await transactionCreate({
        ...data,
        amount: Number(data.amount),
        category: data.categoryId,
        account: data.accountId,
        createdAt: data.createdAt.toISOString() // Convert back to ISO string
      });
      showSuccess('Transaction created successfully!');
      setIsOpen(false);
      reset();
      onTransactionAdded();
    } catch (error: any) {
      showError(error.message);
    }
  };
  //Separate handler for the category form:

  const handleAddCategory = async (formData: CategoryFormSchema) => {
    try {
      const result = await categoryCreate(formData);

      if (result) {
        showSuccess('Category created successfully!');
        refetchCategories();
        setValue('categoryId', result?.id);
        setIsAddCategoryOpen(false);
      }
    } catch (error: any) {
      showError(error.message);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);

    if (open) {
      reset();
      //
      setValue('isIncome', false);
      const preferredCurrency = userPreferences?.preferredCurrency || 'INR'; // get

      setValue('currency', preferredCurrency); // to avoid race condition.
      setIsIncome(false);
    }
  };

  return (
    <AddModal
      title='Add Transaction'
      description='Add a new transaction to your expense tracker.'
      triggerButton={<Button>Add Transaction</Button>}
      onOpenChange={handleOpenChange}
      isOpen={isOpen}
    >
      <form onSubmit={handleSubmit(handleCreateTransaction)} className='space-y-6'>
        <div className='space-y-2'>
          <Label>Transaction Type</Label>
          <RadioGroup
            defaultValue='expense'
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
          <Select onValueChange={(value) => setValue('accountId', value)}>
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
          <div className='flex items-center gap-2'>
            <Label htmlFor='category'>Category</Label>
            <Button
              type='button'
              variant='outline'
              size='icon'
              onClick={() => setIsAddCategoryOpen(true)}
              className='h-6 w-6'
            >
              <PlusCircle className='h-4 w-4' />
              <span className='sr-only'>Add category</span>
            </Button>
          </div>
          <Select onValueChange={(value) => setValue('categoryId', value)}>
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
        <div className='space-y-2'>
          <Label htmlFor='createdAt'>Date and Time</Label>
          <DateTimePicker
            value={watch('createdAt')}
            onChange={(date) => setValue('createdAt', date)}
          />
        </div>

        <Button type='submit' className='w-full' disabled={isSubmitting}>
          {isSubmitting ? 'Adding...' : 'Add Transaction'}
        </Button>
      </form>

      <AddModal
        title='Add Category'
        description='Add a new category'
        triggerButton={<></>}
        onOpenChange={setIsAddCategoryOpen}
        isOpen={isAddCategoryOpen}
      >
        <form onSubmit={categoryForm.handleSubmit(handleAddCategory)} className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='categoryName'>Category Name</Label>
            <Input
              id='categoryName'
              type='text'
              placeholder='Enter category name'
              {...categoryForm.register('name')}
              className='w-full'
            />
            {categoryForm.formState.errors.name && (
              <p className='text-sm text-red-500'>{categoryForm.formState.errors.name.message}</p>
            )}
          </div>
          <Button type='submit' className='w-full'>
            Add Category
          </Button>
        </form>
      </AddModal>
    </AddModal>
  );
};

export default AddTransactionModal;
