'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/lib/hooks/useToast';
import { useInvalidateQueries } from '@/hooks/useInvalidateQueries';
import { accountCreate } from '@/lib/endpoints/accounts';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import AddModal from './add-modal';
import { CurrencyCombobox } from '../ui/currency-combobox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { NumericFormat } from 'react-number-format';
import { Loader2, PlusCircle } from 'lucide-react';
import { apiEndpoints } from '@/lib/api/api-endpoints-request-types';

type AccountFormSchema = z.infer<typeof apiEndpoints.accounts.create.body>;

const AddAccountModal = () => {
  const invalidate = useInvalidateQueries();
  const [isOpen, setIsOpen] = useState(false);
  const { showError } = useToast();

  const form = useForm<AccountFormSchema>({
    resolver: zodResolver(apiEndpoints.accounts.create.body),
    defaultValues: {
      name: '',
      balance: 0,
      currency: 'INR'
    },
    mode: 'onChange'
  });

  const createAccountMutation = useMutation({
    mutationFn: accountCreate,
    onSuccess: async () => {
      await invalidate(['accounts']);
      await invalidate(['dashboardData']);
      setIsOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || error.message || 'Failed to create account.';
      showError(message);
    }
  });

  const handleCreate = (data: AccountFormSchema) => {
    createAccountMutation.mutate(data);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open && !createAccountMutation.isPending) {
      form.reset();
    }
  };

  return (
    <AddModal
      title='Add Account'
      description='Create a new financial account to track your transactions.'
      triggerButton={
        <Button className='w-full' variant='default'>
          <PlusCircle className='mr-2 h-4 w-4' /> Create Account
        </Button>
      }
      isOpen={isOpen}
      onOpenChange={handleOpenChange}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleCreate)} className='space-y-6 pt-2'>
          <FormField
            control={form.control}
            name='name'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Account Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder='E.g., Savings Account, Wallet'
                    {...field}
                    disabled={createAccountMutation.isPending}
                  />
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
                <FormLabel>Starting Balance</FormLabel>
                <FormControl>
                  <NumericFormat
                    customInput={Input}
                    thousandSeparator=','
                    decimalSeparator='.'
                    allowNegative={false}
                    fixedDecimalScale
                    placeholder='0.00'
                    className='w-full'
                    onValueChange={(values) => {
                      field.onChange(parseFloat(values.value));
                    }}
                    value={field.value}
                    disabled={createAccountMutation.isPending}
                  />
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
                <CurrencyCombobox
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={createAccountMutation.isPending}
                />
                <FormMessage />
              </FormItem>
            )}
          />

          <div className='flex justify-end gap-2 pt-4'>
            <Button
              type='button'
              variant='outline'
              onClick={() => handleOpenChange(false)}
              disabled={createAccountMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type='submit'
              disabled={createAccountMutation.isPending}
              className='min-w-[100px]'
            >
              {createAccountMutation.isPending ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Creating...
                </>
              ) : (
                'Create'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </AddModal>
  );
};

export default AddAccountModal;
