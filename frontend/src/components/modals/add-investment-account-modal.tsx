'use client';

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

export const investmentAccountSchema = z.object({
  name: z.string().min(2, 'Account name must be at least 2 characters.'),
  platform: z.string().min(1, 'Platform name is required.'),
  currency: z.string().min(3, 'Currency is required.')
});

type InvestmentAccountFormSchema = z.infer<typeof investmentAccountSchema>;

const AddInvestmentAccountModal = ({
  onAccountAdded,
  isOpen,
  onOpenChange,
  hideTriggerButton = false
}: {
  onAccountAdded: () => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  hideTriggerButton?: boolean;
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
    mode: 'onSubmit'
  });

  const createAccountMutation = useMutation({
    mutationFn: (data: InvestmentAccountFormSchema) => investmentAccountCreate(data),
    onSuccess: async () => {
      await invalidate(['investmentAccounts']);
      await invalidate(['investmentPortfolioSummaryDashboard']);
      showSuccess('Investment account created successfully!');
      form.reset();
      onAccountAdded();
      onOpenChange(false);
    },
    onError: (error: any) => {
      showError(error.message);
    }
  });

  const handleCreate = async (data: InvestmentAccountFormSchema) => {
    createAccountMutation.mutate(data);
  };

  return (
    <AddModal
      title='Add Investment Account'
      description='Create a new account to track your investments.'
      triggerButton={hideTriggerButton ? null : <Button>Add Investment Account</Button>}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleCreate)} className='space-y-6'>
          <FormField
            control={form.control}
            name='name'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Account Name</FormLabel>
                <FormControl>
                  <Input placeholder='e.g., Zerodha Stocks' {...field} />
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
                <FormLabel>Platform / Broker</FormLabel>
                <FormControl>
                  <Input placeholder='e.g., Zerodha, Groww, Upstox' {...field} />
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
                <FormLabel>Account Currency</FormLabel>
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

          <Button type='submit' disabled={createAccountMutation.isPending} className='w-full'>
            {createAccountMutation.isPending ? 'Adding...' : 'Add Account'}
          </Button>
        </form>
      </Form>
    </AddModal>
  );
};

export default AddInvestmentAccountModal;
