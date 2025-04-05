'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { investmentAccountUpdate } from '@/lib/endpoints/investmentAccount';
import { useToast } from '@/lib/hooks/useToast';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { InvestmentAccount } from '@/lib/types';
import CurrencySelect from '../currency-select';
import { fetchCurrencies, COMMON_CURRENCIES } from '@/lib/endpoints/currency';
import { useInvalidateQueries } from '@/hooks/useInvalidateQueries';

const investmentAccountUpdateSchema = z.object({
  name: z.string().min(2, 'Account name must be at least 2 characters.'),
  platform: z.string().min(1, 'Platform name is required.')
});

type InvestmentAccountUpdateFormSchema = z.infer<typeof investmentAccountUpdateSchema>;

interface EditInvestmentAccountModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  account: InvestmentAccount;
  onAccountUpdated: () => void;
}

const EditInvestmentAccountModal: React.FC<EditInvestmentAccountModalProps> = ({
  isOpen,
  onOpenChange,
  account,
  onAccountUpdated
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

  const form = useForm<InvestmentAccountUpdateFormSchema>({
    resolver: zodResolver(investmentAccountUpdateSchema),
    defaultValues: {
      name: account.name,
      platform: account.platform || ''
    },
    mode: 'onSubmit'
  });

  React.useEffect(() => {
    if (isOpen) {
      form.reset({
        name: account.name,
        platform: account.platform || ''
      });
    }
  }, [isOpen, account, form]);

  const updateAccountMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: InvestmentAccountUpdateFormSchema }) =>
      investmentAccountUpdate(id, data),
    onSuccess: async () => {
      await invalidate(['investmentAccounts']);
      await invalidate(['investmentAccount', account.id]);
      await invalidate(['investmentPortfolioSummaryDashboard']);
      showSuccess('Investment account updated successfully!');
      onOpenChange(false);
      onAccountUpdated();
    },
    onError: (error: any) => {
      showError(error.message);
    }
  });

  const handleUpdate = async (data: InvestmentAccountUpdateFormSchema) => {
    await updateAccountMutation.mutate({ id: account.id, data });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Investment Account</DialogTitle>
          <DialogDescription>Update the details of your investment account.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleUpdate)} className='space-y-4'>
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

            <div className='space-y-2'>
              <FormLabel>Currency (Read-only)</FormLabel>
              <CurrencySelect
                currencies={currencies}
                value={account.currency}
                isLoading={isLoadingCurrencies}
                disabled
                disabledTooltip='Currency cannot be changed after creation.'
              />
            </div>

            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
                disabled={updateAccountMutation.isPending}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={updateAccountMutation.isPending}>
                {updateAccountMutation.isPending ? 'Updating...' : 'Update Account'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditInvestmentAccountModal;
