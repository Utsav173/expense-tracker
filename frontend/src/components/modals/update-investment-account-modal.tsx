'use client';

import React, { useEffect } from 'react';
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
  DialogTitle,
  DialogClose
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
import { fetchCurrencies, COMMON_CURRENCIES } from '@/lib/endpoints/currency';
import { useInvalidateQueries } from '@/hooks/useInvalidateQueries';
import CurrencySelect from '../ui/currency-select';
import { Loader2, Pencil, Landmark, Building, CircleDollarSign } from 'lucide-react';

const investmentAccountUpdateSchema = z.object({
  name: z
    .string()
    .min(2, 'Account name must be at least 2 characters.')
    .max(100, 'Account name cannot exceed 100 characters.')
    .trim(),
  platform: z
    .string()
    .min(1, 'Platform name is required.')
    .max(64, 'Platform name cannot exceed 64 characters.')
    .trim()
});

type InvestmentAccountUpdateFormSchema = z.infer<typeof investmentAccountUpdateSchema>;

interface UpdateInvestmentAccountModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  account: InvestmentAccount;
  onAccountUpdated: () => void;
}

const UpdateInvestmentAccountModal: React.FC<UpdateInvestmentAccountModalProps> = ({
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
      name: account?.name ?? '',
      platform: account?.platform ?? ''
    },
    mode: 'onChange'
  });

  useEffect(() => {
    if (isOpen && account) {
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
      onAccountUpdated();
      handleClose();
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || error.message || 'Failed to update investment account.';
      showError(message);
    }
  });

  const handleUpdate = (data: InvestmentAccountUpdateFormSchema) => {
    updateAccountMutation.mutate({ id: account.id, data });
  };

  const handleClose = () => {
    if (!updateAccountMutation.isPending) {
      form.reset({ name: account?.name ?? '', platform: account?.platform ?? '' });
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className='sm:max-w-[480px]'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Pencil className='h-5 w-5' /> Edit Investment Account
          </DialogTitle>
          <DialogDescription>
            Update the name and platform for this investment account. Currency cannot be changed.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleUpdate)} className='space-y-5 pt-2'>
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
                      placeholder='E.g., Zerodha Stocks'
                      {...field}
                      disabled={updateAccountMutation.isPending}
                      autoFocus
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
                      placeholder='E.g., Zerodha, Groww, Upstox'
                      {...field}
                      disabled={updateAccountMutation.isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Display Currency (Read-only) */}
            <FormItem>
              <FormLabel className='text-muted-foreground flex items-center gap-1.5 text-sm'>
                <CircleDollarSign className='h-4 w-4' />
                Currency (Read-only)
              </FormLabel>
              <CurrencySelect
                currencies={currencies}
                value={account.currency}
                isLoading={isLoadingCurrencies}
                disabled
                disabledTooltip='Currency cannot be changed after creation.'
              />
            </FormItem>

            <DialogFooter className='gap-2 pt-4 sm:gap-0'>
              <DialogClose asChild>
                <Button type='button' variant='outline' disabled={updateAccountMutation.isPending}>
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type='submit'
                disabled={
                  updateAccountMutation.isPending ||
                  !form.formState.isDirty ||
                  !form.formState.isValid
                }
                className='min-w-[120px]'
              >
                {updateAccountMutation.isPending ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default UpdateInvestmentAccountModal;
