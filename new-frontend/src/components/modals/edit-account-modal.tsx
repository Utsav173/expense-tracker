'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { accountUpdate } from '@/lib/endpoints/accounts';
import CurrencySelect from '../currency-select';
import { fetchCurrencies, COMMON_CURRENCIES } from '@/lib/endpoints/currency';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { useToast } from '@/lib/hooks/useToast';

const formSchema = z.object({
  name: z.string().min(2, {
    message: 'Account name must be at least 2 characters.'
  }),
  balance: z.number().optional(),
  currency: z.string().optional()
});

interface EditAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountId: string;
  initialValues: {
    name: string;
    balance: number | undefined;
    currency: string | undefined;
  };
}

export function EditAccountModal({
  open,
  onOpenChange,
  accountId,
  initialValues
}: EditAccountModalProps) {
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialValues.name,
      balance: initialValues.balance,
      currency: initialValues.currency
    }
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await accountUpdate(accountId, values);
      showSuccess('Account updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      onOpenChange(false);
    } catch (error: any) {
      showError(error.message);
    }
  }

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>Edit Account</DialogTitle>
          <DialogDescription>Make changes to your account details here.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Name</FormLabel>
                  <FormControl>
                    <Input placeholder='Account name' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='balance'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Balance</FormLabel>
                  <FormControl>
                    <Input placeholder='Balance' type='number' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='currency'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Currency</FormLabel>
                  <FormControl>
                    <CurrencySelect
                      currencies={currencies}
                      value={field.value}
                      onValueChange={field.onChange}
                      isLoading={isLoadingCurrencies}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type='submit'>Update Account</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
