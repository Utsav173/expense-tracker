'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/lib/hooks/useToast';
import { useInvalidateQueries } from '@/hooks/useInvalidateQueries';
import { accountCreate } from '@/lib/endpoints/accounts';
import { fetchCurrencies, COMMON_CURRENCIES } from '@/lib/endpoints/currency';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import AddModal from './add-modal';
import CurrencySelect from '../ui/currency-select';
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

// Define the schema matching the API request body for creating an account
const accountSchema = z.object({
  name: z
    .string()
    .min(2, 'Account name must be at least 2 characters.')
    .max(64, 'Account name cannot exceed 64 characters.'),
  balance: z
    .string() // Accept string input from NumericFormat
    .refine((val) => !isNaN(parseFloat(val)), {
      message: 'Starting balance must be a valid number.'
    })
    .transform((val) => parseFloat(val)) // Transform to number for API
    .refine((val) => val >= 0, {
      message: 'Starting balance cannot be negative.'
    }),
  currency: z.string().min(3, 'Currency is required.')
});

type AccountFormSchema = z.infer<typeof accountSchema>;

const AddAccountModal = () => {
  const invalidate = useInvalidateQueries();
  const [isOpen, setIsOpen] = useState(false);
  const { showError, showSuccess } = useToast();

  const form = useForm<AccountFormSchema>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: '',
      balance: 0, // Default balance as string for NumericFormat
      currency: 'INR' // Default to INR as per project context
    },
    mode: 'onChange' // Validate on change for better UX
  });

  const { data: currencies, isLoading: isLoadingCurrencies } = useQuery({
    queryKey: ['currencies'],
    queryFn: fetchCurrencies,
    staleTime: 24 * 60 * 60 * 1000, // Cache currencies for a day
    gcTime: 7 * 24 * 60 * 60 * 1000, // Keep cache for a week
    retry: 2,
    placeholderData: Object.entries(COMMON_CURRENCIES).map(([code, name]) => ({
      code,
      name
    })) // Provide common currencies as initial data
  });

  const createAccountMutation = useMutation({
    mutationFn: accountCreate,
    onSuccess: async () => {
      await invalidate(['accounts']); // Invalidate accounts list query
      await invalidate(['dashboardData']); // Invalidate dashboard summary
      showSuccess('Account created successfully!');
      setIsOpen(false);
      form.reset(); // Reset form after successful submission
    },
    onError: (error: any) => {
      // Use the specific error message from the API if available
      const message =
        error?.response?.data?.message || error.message || 'Failed to create account.';
      showError(message);
    }
  });

  const handleCreate = (data: AccountFormSchema) => {
    // The schema transformation already converts balance to number
    createAccountMutation.mutate(data);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open && !createAccountMutation.isPending) {
      form.reset(); // Reset form when closing if not submitting
    }
  };

  return (
    <AddModal
      title='Add Account'
      description='Create a new financial account to track your transactions.'
      triggerButton={
        <Button className='max-sm:w-full'>
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
                      // Update the form state with the string value
                      field.onChange(values.value);
                    }}
                    value={field.value} // Bind value from RHF
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
                <CurrencySelect
                  currencies={currencies}
                  value={field.value}
                  onValueChange={field.onChange}
                  isLoading={isLoadingCurrencies}
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
