'use client';

import React from 'react';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { UpdateModal } from './update-modal';
import { Input } from '@/components/ui/input';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Landmark, Building, CircleDollarSign } from 'lucide-react';
import { investmentAccountUpdate } from '@/lib/endpoints/investmentAccount';
import { InvestmentAccount } from '@/lib/types';
import { fetchCurrencies, COMMON_CURRENCIES } from '@/lib/endpoints/currency';
import CurrencySelect from '../ui/currency-select';

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
    <UpdateModal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="Edit Investment Account"
      description="Update the name and platform for this investment account. Currency cannot be changed."
      initialValues={{
        name: account?.name ?? '',
        platform: account?.platform ?? ''
      }}
      validationSchema={investmentAccountUpdateSchema}
      updateFn={investmentAccountUpdate}
      invalidateKeys={[
        ['investmentAccounts'],
        ['investmentAccount', account.id],
        ['investmentPortfolioSummaryDashboard']
      ]}
      onSuccess={onAccountUpdated}
      entityId={account.id}
    >
      {(form) => (
        <>
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
                    disabled={form.formState.isSubmitting}
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
                    disabled={form.formState.isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
        </>
      )}
    </UpdateModal>
  );
};

export default UpdateInvestmentAccountModal;