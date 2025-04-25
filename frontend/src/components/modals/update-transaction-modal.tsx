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
import { useMutation, useQuery } from '@tanstack/react-query';
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
import { Transaction as TransactionType } from '@/lib/types';
import DateTimePicker from '../date-time-picker';
import AddCategoryModal from './add-category-modal';
import { ArrowDownCircle, ArrowUpCircle, PlusCircle } from 'lucide-react';
import { Card } from '../ui/card';
import { useInvalidateQueries } from '@/hooks/useInvalidateQueries';

const transactionSchema = z.object({
  text: z.string().min(3, 'Description must be at least 3 characters').max(255),
  amount: z.string().refine((val) => !isNaN(parseFloat(val)), 'Must be a valid number'),
  isIncome: z.boolean(),
  categoryId: z.string().optional(),
  createdAt: z.date(),
  transfer: z.string().optional()
});

type TransactionFormSchema = z.infer<typeof transactionSchema>;

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
  const [isIncome, setIsIncome] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);

  const { showError, showSuccess } = useToast();
  const invalidate = useInvalidateQueries();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch
  } = useForm<TransactionFormSchema>({
    resolver: zodResolver(transactionSchema)
  });

  const {
    data: categoriesData,
    isLoading: isLoadingCategory,
    refetch: refetchCategories
  } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryGetAll
  });

  const { data: accountsData, isLoading: isLoadingAccount } = useQuery({
    queryKey: ['accountDropdown'],
    queryFn: accountGetDropdown
  });

  useEffect(() => {
    if (transaction) {
      setValue('text', transaction.text);
      setValue('amount', transaction.amount.toFixed(2));
      setValue('isIncome', transaction.isIncome);
      setValue('categoryId', transaction.category?.id || '');
      setValue('createdAt', new Date(transaction.createdAt));
      setValue('transfer', transaction.transfer || '');
      setIsIncome(transaction.isIncome);
    } else {
      reset();
    }
  }, [transaction, setValue, reset]);

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => transactionUpdate(id, data),
    onSuccess: async () => {
      showSuccess('Transaction updated successfully!');
      onOpenChange(false);
      if (queryKey) await invalidate(queryKey);
      onUpdate();
      reset();
    },
    onError: (error: any) => {
      showError(error.message);
    }
  });

  const handleUpdateTransaction = async (data: TransactionFormSchema) => {
    if (!transaction) return;

    await updateMutation.mutateAsync({
      id: transaction.id,
      data: {
        ...data,
        account: transaction.account,
        amount: Number(data.amount),
        category: data.categoryId,
        transfer: data.transfer || '',
        createdAt: data.createdAt.toISOString(),
        recurring: transaction.recurring,
        recurrenceType: transaction.recurrenceType,
        recurrenceEndDate: transaction.recurrenceEndDate,
        currency: transaction.currency
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Transaction</DialogTitle>
          <DialogDescription>Update your transaction details.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleUpdateTransaction)} className='space-y-6'>
          <div className='mb-6 grid grid-cols-2 gap-4'>
            <Card
              className={`cursor-pointer border-2 p-4 transition-all ${
                !isIncome
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-200 hover:border-red-500 hover:bg-red-50'
              } ${isSubmitting ? 'pointer-events-none opacity-50' : ''}`}
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
              className={`cursor-pointer border-2 p-4 transition-all ${
                isIncome
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-green-500 hover:bg-green-50'
              } ${isSubmitting ? 'pointer-events-none opacity-50' : ''}`}
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
          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <span className='block text-sm font-medium text-gray-700'>Account</span>
              <span className='block text-base text-gray-900'>
                {transaction
                  ? accountsData?.find((acc) => acc.id === transaction.account)?.name
                  : ''}
              </span>
            </div>

            <div className='space-y-2'>
              <span className='block text-sm font-medium text-gray-700'>Currency</span>
              <span className='block text-base text-gray-900'>{transaction?.currency || ''}</span>
            </div>
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
              disabled={isSubmitting}
            />
            {errors.text && <p className='text-sm text-red-500'>{errors.text.message}</p>}
          </div>

          <div className='space-y-2'>
            <Label htmlFor='amount' className='font-medium'>
              Amount
            </Label>
            <div className='relative'>
              <span className='pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3'>
                {transaction?.currency || ''}
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
          <div className='space-y-2'>
            <div className='flex items-center justify-between'>
              <Label htmlFor='category'>Category</Label>
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
                    className='ml-auto h-6 w-6' // Adjusted positioning
                    disabled={isSubmitting}
                  >
                    <PlusCircle className='h-4 w-4' />
                    <span className='sr-only'>Add category</span>
                  </Button>
                }
              />
            </div>

            <Select
              onValueChange={(value) => setValue('categoryId', value)}
              value={watch('categoryId')}
              disabled={isSubmitting}
            >
              <SelectTrigger id='category' className='w-full'>
                <SelectValue
                  placeholder={isLoadingCategory ? 'Loading categories...' : 'Select category'}
                />
              </SelectTrigger>
              <SelectContent className='z-100'>
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
              onChange={(date) => setValue('createdAt', date!)}
              disabled={isSubmitting}
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
