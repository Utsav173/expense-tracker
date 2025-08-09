'use client';

import React from 'react';
import { z } from 'zod';
import { UpdateModal } from './update-modal';
import { Input } from '@/components/ui/input';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { Banknote, CircleDollarSign } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { accountUpdate } from '@/lib/endpoints/accounts';
import { apiEndpoints } from '@/lib/api/api-endpoints-request-types';

type FormSchema = z.infer<typeof apiEndpoints.accounts.update.body>;

interface UpdateAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountId: string;
  initialValues: {
    name: string;
    balance: number | undefined | null;
    currency: string | undefined;
    isDefault: boolean;
  };
  onAccountUpdated: () => void;
}

export function UpdateAccountModal({
  open,
  onOpenChange,
  accountId,
  initialValues,
  onAccountUpdated
}: UpdateAccountModalProps) {
  return (
    <UpdateModal
      isOpen={open}
      onOpenChange={onOpenChange}
      title='Edit Account Name'
      description='Update the name for this account. Balance and currency cannot be changed after creation.'
      initialValues={{
        name: initialValues.name,
        isDefault: initialValues.isDefault
      }}
      validationSchema={apiEndpoints.accounts.update.body}
      updateFn={accountUpdate}
      invalidateKeys={[[`accounts`], [`account`, accountId], [`dashboardData`]]}
      onSuccess={onAccountUpdated}
      entityId={accountId}
    >
      {(form) => (
        <>
          <FormField
            control={form.control}
            name='name'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Account Name*</FormLabel>
                <FormControl>
                  <Input
                    placeholder='Enter new account name'
                    {...field}
                    disabled={form.formState.isSubmitting}
                    autoFocus
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className='grid grid-cols-2 gap-4'>
            <FormItem>
              <FormLabel className='text-muted-foreground flex items-center gap-1.5 text-sm'>
                <Banknote className='h-4 w-4' />
                Current Balance
              </FormLabel>
              <FormControl>
                <Input
                  value={formatCurrency(initialValues.balance ?? 0, initialValues.currency)}
                  readOnly
                  disabled
                  className='bg-muted/50 cursor-not-allowed opacity-70'
                />
              </FormControl>
            </FormItem>
            <FormItem>
              <FormLabel className='text-muted-foreground flex items-center gap-1.5 text-sm'>
                <CircleDollarSign className='h-4 w-4' />
                Currency
              </FormLabel>
              <FormControl>
                <Input
                  value={initialValues.currency ?? 'N/A'}
                  readOnly
                  disabled
                  className='bg-muted/50 cursor-not-allowed opacity-70'
                />
              </FormControl>
            </FormItem>
          </div>

          <div className='flex items-center gap-2'>
            <FormField
              control={form.control}
              name='isDefault'
              render={({ field }) => (
                <FormItem className='flex flex-row items-center space-y-0 space-x-3'>
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={form.formState.isSubmitting}
                    />
                  </FormControl>
                  <FormLabel className='text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
                    Default Account
                  </FormLabel>
                </FormItem>
              )}
            />
          </div>
        </>
      )}
    </UpdateModal>
  );
}
