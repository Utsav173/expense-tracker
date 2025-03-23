'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/lib/hooks/useToast';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import AddModal from './add-modal';
import { accountCreate } from '@/lib/endpoints/accounts';
import { Label } from '../ui/label';
import CurrencySelect from '../currency-select';
import { useQuery } from '@tanstack/react-query';
import { fetchCurrencies, COMMON_CURRENCIES } from '@/lib/endpoints/currency';
import { useInvalidateQueries } from '@/hooks/useInvalidateQueries';

const accountSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters long').max(64),
  balance: z.string().refine((value) => !isNaN(Number(value)), 'Must be a valid number'),
  currency: z.string()
});

type Type = z.infer<typeof accountSchema>;

const AddAccountModal = () => {
  const invalidate = useInvalidateQueries();
  const [isOpen, setIsOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch
  } = useForm<Type>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      currency: 'INR'
    }
  });
  const { showError, showSuccess } = useToast();

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

  const handleCreate = async (data: Type) => {
    try {
      await accountCreate(
        { ...data, balance: Number(data.balance) },
        'Account created successfully!'
      );
      await invalidate(['accounts']);
      showSuccess('Created successfully!');

      setIsOpen(false);
      reset();
    } catch (err: any) {
      showError(err.message);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);

    if (!open) {
      reset();
    }
  };

  return (
    <AddModal
      onOpenChange={handleOpenChange}
      title='Add Account'
      triggerButton={<Button className='max-sm:w-full'>Create Account</Button>}
      isOpen={isOpen}
    >
      <form onSubmit={handleSubmit(handleCreate)} className='space-y-6'>
        <div className='space-y-2'>
          <Label>Account Name</Label>
          <Input type='text' placeholder='Account Name' {...register('name')} className='w-full' />
          {errors.name && <p className='text-sm text-red-500'>{errors.name.message}</p>}
        </div>
        <div className='space-y-2'>
          <Label>Starting Balance</Label>
          <Input
            type='text'
            placeholder='Starting Balance'
            {...register('balance')}
            className='w-full'
          />
          {errors.balance && <p className='text-sm text-red-500'> {errors.balance.message}</p>}
        </div>
        <div className='space-y-2'>
          <Label htmlFor='currency'>Currency</Label>
          <CurrencySelect
            currencies={currencies}
            value={watch('currency')}
            onValueChange={(value) => setValue('currency', value)}
            isLoading={isLoadingCurrencies}
          />
          {errors.currency && <p className='text-sm text-red-500'> {errors.currency.message} </p>}
        </div>
        <Button type='submit' className='w-full' disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create'}
        </Button>
      </form>
    </AddModal>
  );
};

export default AddAccountModal;
