'use client';

import React, { useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { investmentAccountCreate } from '@/lib/endpoints/investmentAccount';
import { useToast } from '@/lib/hooks/useToast';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '../ui/button';
import AddModal from './add-modal';
import { fetchCurrencies, COMMON_CURRENCIES } from '@/lib/endpoints/currency';
import { useInvalidateQueries } from '@/hooks/useInvalidateQueries';
import CurrencySelect from '../ui/currency-select';
import { Building, Landmark, PlusCircle, Loader2 } from 'lucide-react';

export const investmentAccountSchema = z.object({
  name: z
    .string()
    .min(2, 'Account name must be at least 2 characters.')
    .max(100, 'Account name cannot exceed 100 characters.')
    .trim(),
  platform: z
    .string()
    .min(1, 'Platform name is required.')
    .max(64, 'Platform name cannot exceed 64 characters.')
    .trim(),
  currency: z.string().length(3, 'Currency must be a 3-letter code.')
});

type InvestmentAccountFormSchema = z.infer<typeof investmentAccountSchema>;

interface AddInvestmentAccountModalProps {
  onAccountAdded: () => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  hideTriggerButton?: boolean;
}

const AddInvestmentAccountModal: React.FC<AddInvestmentAccountModalProps> = ({
  onAccountAdded,
  isOpen,
  onOpenChange,
  hideTriggerButton = false
}) => {
  const { showSuccess, showError } = useToast();
  const invalidate = useInvalidateQueries();

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

  const form = useForm<InvestmentAccountFormSchema>({
    resolver: zodResolver(investmentAccountSchema),
    defaultValues: {
      name: '',
      platform: '',
      currency: 'INR'
    },
    mode: 'onChange'
  });

  const createAccountMutation = useMutation({
    mutationFn: (data: InvestmentAccountFormSchema) => investmentAccountCreate(data),
    onSuccess: async () => {
      await invalidate(['investmentAccounts']);
      await invalidate(['investmentPortfolioSummaryDashboard']);
      showSuccess('Investment account created successfully!');
      onAccountAdded();
      handleClose();
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || error.message || 'Failed to create investment account.';
      showError(message);
    }
  });

  const handleCreate = (data: InvestmentAccountFormSchema) => {
    createAccountMutation.mutate(data);
  };

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  };

  useEffect(() => {
    if (isOpen) {
      form.reset({
        name: '',
        platform: '',
        currency: 'INR'
      });
    }
  }, [isOpen, form]);

  return (
    <AddModal
      title='Add Investment Account'
      description='Create a new account to track your investments (e.g., stocks, mutual funds).'
      triggerButton={
        hideTriggerButton ? null : (
          <Button>
            <PlusCircle className='mr-2 h-4 w-4' /> Add Investment Account
          </Button>
        )
      }
      isOpen={isOpen}
      onOpenChange={handleClose}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleCreate)} className='space-y-5 pt-2'>
          <FormField
            control={form.control}
            name='name'
            render={({ field }) => (
              <FormItem>
                <FormLabel className='flex items-center gap-1.5'>
                  <Landmark className='text-muted-foreground h-4 w-4' />
                  Account Name*
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder='E.g., Zerodha Stocks, Groww MF Portfolio'
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
            name='platform'
            render={({ field }) => (
              <FormItem>
                <FormLabel className='flex items-center gap-1.5'>
                  <Building className='text-muted-foreground h-4 w-4' />
                  Platform / Broker*
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder='E.g., Zerodha, Groww, Upstox, HDFC Securities'
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
            name='currency'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Account Currency*</FormLabel>
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
              onClick={handleClose}
              disabled={createAccountMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type='submit'
              disabled={createAccountMutation.isPending}
              className='min-w-[120px]'
            >
              {createAccountMutation.isPending ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Adding...
                </>
              ) : (
                'Add Account'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </AddModal>
  );
};

export default AddInvestmentAccountModal;
