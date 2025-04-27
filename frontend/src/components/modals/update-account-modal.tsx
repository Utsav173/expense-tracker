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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { accountUpdate } from '@/lib/endpoints/accounts';
import { fetchCurrencies, COMMON_CURRENCIES } from '@/lib/endpoints/currency';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/lib/hooks/useToast';
import { useInvalidateQueries } from '@/hooks/useInvalidateQueries';
import { NumericFormat } from 'react-number-format';
import { cn } from '@/lib/utils';
import CurrencySelect from '../ui/currency-select';

const formSchema = z.object({
  name: z.string().min(2, {
    message: 'Account name must be at least 2 characters.'
  }),
  balance: z.number().optional(),
  currency: z.string().optional()
});

type AccountUpdatePayload = Pick<z.infer<typeof formSchema>, 'name'>;

interface UpdateAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountId: string;
  initialValues: {
    name: string;
    balance: number | undefined;
    currency: string | undefined;
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
  const { showSuccess, showError } = useToast();
  const invalidate = useInvalidateQueries();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialValues.name,
      balance: initialValues.balance,
      currency: initialValues.currency
    }
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        name: initialValues.name,
        balance: initialValues.balance,
        currency: initialValues.currency
      });
    }
  }, [initialValues, open, form.reset]);

  const updateAccountMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: AccountUpdatePayload }) =>
      accountUpdate(id, data),
    onSuccess: async () => {
      await invalidate(['accounts']);
      showSuccess('Account updated successfully!');
      onOpenChange(false);
      onAccountUpdated();
    },
    onError: (error: any) => {
      showError(error.message || 'Failed to update account.');
    }
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const updateData = {
      name: values.name,
      balance: initialValues.balance,
      currency: initialValues.currency
    };
    await updateAccountMutation.mutate({ id: accountId, data: updateData });
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Account Name</DialogTitle>
          <DialogDescription>
            Update the name for this account. Balance and currency cannot be changed here.
          </DialogDescription>
        </DialogHeader>
        <TooltipProvider>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Name</FormLabel>
                    <FormControl>
                      <Input placeholder='Account name' {...field} autoFocus />
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
                    <FormLabel>Current Balance</FormLabel>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span tabIndex={0} className={cn('inline-block w-full')}>
                          <FormControl>
                            <NumericFormat
                              customInput={Input}
                              thousandSeparator=','
                              decimalSeparator='.'
                              allowNegative={false}
                              decimalScale={2}
                              fixedDecimalScale
                              value={field.value ?? 0}
                              readOnly
                              disabled
                              className='w-full disabled:cursor-not-allowed disabled:opacity-70'
                              onValueChange={() => {}}
                            />
                          </FormControl>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Balance cannot be edited.</p>
                      </TooltipContent>
                    </Tooltip>
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
                        isLoading={isLoadingCurrencies}
                        disabled
                        disabledTooltip='Currency cannot be edited.'
                        className='w-full disabled:cursor-not-allowed disabled:opacity-70'
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => onOpenChange(false)}
                  disabled={updateAccountMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type='submit'
                  disabled={updateAccountMutation.isPending || !form.formState.isDirty}
                >
                  {updateAccountMutation.isPending ? 'Updating...' : 'Update Name'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </TooltipProvider>
      </DialogContent>
    </Dialog>
  );
}
