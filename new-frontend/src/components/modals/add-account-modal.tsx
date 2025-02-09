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
import { useQueryClient } from '@tanstack/react-query';

const accountSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters long').max(64),
  balance: z.string().refine((value) => !isNaN(Number(value)), 'Must be Valid Number'), // number is better if client data types not changed
  currency: z
    .string()
    .min(3, 'Currency must have three characters ')
    .max(3, 'Currency must have three characters ')
    .transform((val) => val.toUpperCase())
});
type Type = z.infer<typeof accountSchema>;

const AddAccountModal = () => {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<Type>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      currency: 'INR' // provide  a generic data
    }
  });
  const { showError, showSuccess } = useToast();
  const handleCreate = async (data: Type) => {
    try {
      await accountCreate(
        { ...data, balance: Number(data.balance) },
        'Account created successfully!'
      );
      queryClient.invalidateQueries({ queryKey: ['accounts'] }); //invalidate
      showSuccess('Created successfully!');

      setIsOpen(false);
      reset();
    } catch (err: any) {
      showError(err.message);
    }
  };

  return (
    <AddModal
      onOpenChange={(open) => setIsOpen(open)}
      title='Add Account'
      description=' Add an new expense tracker  account.'
      triggerButton={<Button> Create Account</Button>}
      isOpen={isOpen}
    >
      <form onSubmit={handleSubmit(handleCreate)} className='space-y-6'>
        <div>
          <Input type='text' placeholder='Account Name' {...register('name')} className='w-full' />
          {errors.name && <p className='text-sm text-red-500'>{errors.name.message}</p>}
        </div>
        <div>
          <Input
            type='text'
            placeholder='Starting Balance'
            {...register('balance')}
            className='w-full'
          />
          {errors.balance && <p className='text-sm text-red-500'> {errors.balance.message}</p>}
        </div>

        <div>
          <Input type='text' placeholder='Currency' {...register('currency')} className='w-full' />

          {errors.currency && <p className='text-sm text-red-500'> {errors.currency.message} </p>}
        </div>

        <Button type='submit' className='w-full'>
          {' '}
          Create{' '}
        </Button>
      </form>
    </AddModal>
  );
};

export default AddAccountModal;
