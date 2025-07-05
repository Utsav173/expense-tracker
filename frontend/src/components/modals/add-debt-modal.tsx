'use client';

import React, { useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/lib/hooks/useToast';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import AddModal from './add-modal';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { accountGetDropdown } from '@/lib/endpoints/accounts';
import { InvitationCombobox } from '@/components/invitation/InvitationCombobox';
import { apiCreateDebt } from '@/lib/endpoints/debt';
import { useInvalidateQueries } from '@/hooks/useInvalidateQueries';
import { useAuth } from '@/hooks/useAuth';
import DateRangePickerV2 from '../date/date-range-picker-v2';
import { NumericInput } from '../ui/numeric-input';
import { Loader2, PlusCircle } from 'lucide-react';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';

const debtFormSchema = z
  .object({
    description: z.string().min(3, 'Description must be at least 3 characters.'),
    amount: z
      .string()
      .min(1, { message: 'Amount is required.' })
      .refine((value) => !isNaN(parseFloat(value)) && parseFloat(value) > 0, {
        message: 'Amount must be a positive number.'
      }),
    premiumAmount: z
      .string()
      .optional()
      .refine(
        (value) =>
          value === undefined ||
          value === '' ||
          (!isNaN(parseFloat(value)) && parseFloat(value) >= 0),
        {
          message: 'Premium amount must be a non-negative number if provided.'
        }
      ),
    account: z.string().uuid('Account selection is required.'),
    counterparty: z.object({
      label: z.string().email('Counterparty email is required.'),
      value: z.string()
    }),
    type: z.enum(['given', 'taken'], { required_error: 'Debt type is required.' }),
    interestType: z.enum(['simple', 'compound'], {
      required_error: 'Interest type is required.'
    }),
    percentage: z
      .string()
      .optional()
      .refine(
        (value) =>
          value === undefined ||
          value === '' ||
          (!isNaN(parseFloat(value)) && parseFloat(value) >= 0),
        {
          message: 'Interest rate must be a non-negative number if provided.'
        }
      ),
    durationType: z.enum(['year', 'month', 'week', 'day', 'custom'], {
      required_error: 'Duration type is required.'
    }),
    frequency: z
      .string()
      .optional()
      .refine(
        (value) =>
          value === undefined || value === '' || (!isNaN(parseInt(value)) && parseInt(value) > 0),
        {
          message: 'Frequency must be a positive whole number.'
        }
      ),
    customDateRange: z
      .object({
        from: z.date().optional(),
        to: z.date().optional()
      })
      .optional()
  })
  .superRefine((data, ctx) => {
    if (data.durationType !== 'custom' && (data.frequency === undefined || data.frequency === '')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Frequency is required when duration type is not "custom".',
        path: ['frequency']
      });
    }
    if (data.durationType === 'custom') {
      if (!data.customDateRange?.from) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Start date is required for custom range.',
          path: ['customDateRange']
        });
      }
      if (!data.customDateRange?.to) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'End date is required for custom range.',
          path: ['customDateRange']
        });
      }
      if (
        data.customDateRange?.from &&
        data.customDateRange?.to &&
        data.customDateRange.from >= data.customDateRange.to
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'End date must be after start date.',
          path: ['customDateRange']
        });
      }
    }
  });

type DebtFormValues = z.infer<typeof debtFormSchema>;

type DebtApiPayload = {
  amount: number;
  premiumAmount?: number;
  description: string;
  duration: string;
  percentage?: number;
  frequency?: string;
  user: string;
  type: 'given' | 'taken';
  interestType: 'simple' | 'compound';
  account: string;
};

interface AddDebtModalProps {
  onDebtAdded: () => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  hideTriggerButton?: boolean;
}

const AddDebtModal: React.FC<AddDebtModalProps> = ({
  onDebtAdded,
  isOpen,
  onOpenChange,
  hideTriggerButton = false
}) => {
  const { showError } = useToast();
  const invalidate = useInvalidateQueries();
  const { user } = useAuth();

  const { data: accountsData, isLoading: isLoadingAccounts } = useQuery({
    queryKey: ['accountsDropdown'],
    queryFn: accountGetDropdown,
    staleTime: 5 * 60 * 1000
  });

  const form = useForm<DebtFormValues>({
    resolver: zodResolver(debtFormSchema),
    defaultValues: {
      type: 'taken',
      interestType: 'simple',
      description: '',
      amount: '',
      premiumAmount: '',
      percentage: '',
      frequency: '',
      account: '',
      counterparty: {
        label: '',
        value: ''
      },
      durationType: 'year',
      customDateRange: undefined
    },
    mode: 'onChange'
  });

  const durationType = form.watch('durationType');

  useEffect(() => {
    if (isOpen) {
      form.reset({
        type: 'taken',
        interestType: 'simple',
        description: '',
        amount: '',
        premiumAmount: '',
        percentage: '',
        frequency: '',
        account: '',
        counterparty: {
          label: '',
          value: ''
        },
        durationType: 'year',
        customDateRange: undefined
      });
    }
  }, [isOpen, form]);

  const createDebtMutation = useMutation({
    mutationFn: (data: DebtApiPayload) => apiCreateDebt(data),
    onSuccess: async () => {
      await invalidate(['debts', 'accounts']);
      onDebtAdded();
      onOpenChange(false);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || error.message || 'Failed to create debt.';
      showError(message);
      console.error('Debt creation failed:', error);
    }
  });

  const handleCreate = (formData: DebtFormValues) => {
    if (!user?.id) {
      showError('User information not found. Cannot create debt.');
      return;
    }

    let apiDuration: string;
    if (formData.durationType === 'custom') {
      if (!formData.customDateRange?.from || !formData.customDateRange?.to) {
        showError('Custom date range is incomplete.');
        return;
      }
      apiDuration = `${format(formData.customDateRange.from, 'yyyy-MM-dd')},${format(
        formData.customDateRange.to,
        'yyyy-MM-dd'
      )}`;
    } else {
      apiDuration = formData.durationType;
    }

    const apiPayload: DebtApiPayload = {
      amount: parseFloat(formData.amount),
      premiumAmount:
        formData.premiumAmount && formData.premiumAmount !== ''
          ? parseFloat(formData.premiumAmount)
          : undefined,
      description: formData.description,
      duration: apiDuration,
      percentage:
        formData.percentage && formData.percentage !== ''
          ? parseFloat(formData.percentage)
          : undefined,
      frequency:
        formData.durationType !== 'custom' && formData.frequency
          ? String(formData.frequency)
          : undefined,
      user: formData.counterparty?.value,
      type: formData.type,
      interestType: formData.interestType,
      account: formData.account
    };

    createDebtMutation.mutate(apiPayload);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && !createDebtMutation.isPending) {
      form.reset();
    }
    onOpenChange(open);
  };

  return (
    <AddModal
      title='Add Debt Record'
      description='Log money you owe or money owed to you.'
      triggerButton={
        hideTriggerButton ? null : (
          <Button size='sm'>
            <PlusCircle className='mr-2 h-4 w-4' /> Add Debt
          </Button>
        )
      }
      isOpen={isOpen}
      onOpenChange={handleOpenChange}
    >
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleCreate)}
          className='grid grid-cols-1 gap-x-4 gap-y-5 pt-2 md:grid-cols-2'
        >
          <FormField
            control={form.control}
            name='description'
            render={({ field }) => (
              <FormItem className='md:col-span-2'>
                <FormLabel>Description*</FormLabel>
                <FormControl>
                  <Input
                    placeholder='E.g., Loan from John for rent'
                    {...field}
                    disabled={createDebtMutation.isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='amount'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Principal Amount*</FormLabel>
                <FormControl>
                  <NumericInput
                    placeholder='1000.00'
                    className='w-full'
                    disabled={createDebtMutation.isPending}
                    value={field.value}
                    onValueChange={(values: { value: any }) => field.onChange(values.value)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='premiumAmount'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Premium Amount</FormLabel>
                <FormControl>
                  <NumericInput
                    placeholder='50.00'
                    className='w-full'
                    disabled={createDebtMutation.isPending}
                    value={field.value}
                    onValueChange={(values: { value: any }) => field.onChange(values.value)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='account'
            render={({ field }) => (
              <FormItem className='md:col-span-2'>
                <FormLabel>Associated Account*</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={isLoadingAccounts || createDebtMutation.isPending}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder='Select account...' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {isLoadingAccounts ? (
                      <SelectItem value='loading' disabled>
                        Loading accounts...
                      </SelectItem>
                    ) : accountsData && accountsData.length > 0 ? (
                      accountsData.map((acc) => (
                        <SelectItem key={acc.id} value={acc.id}>
                          {acc.name} ({acc.currency})
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value='no-accounts' disabled>
                        No accounts found
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='counterparty'
            render={({ field }) => (
              <FormItem className='md:col-span-2'>
                <FormLabel>Counterparty*</FormLabel>
                <FormControl>
                  <InvitationCombobox
                    value={field.value}
                    onChange={field.onChange}
                    disabled={createDebtMutation.isPending}
                    placeholder='Select or invite user...'
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='type'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type*</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={createDebtMutation.isPending}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder='Select type' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value='given'>Given (I lent money)</SelectItem>
                    <SelectItem value='taken'>Taken (I borrowed money)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='interestType'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Interest Type*</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={createDebtMutation.isPending}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder='Select interest type' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value='simple'>Simple</SelectItem>
                    <SelectItem value='compound'>Compound</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='percentage'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Interest Rate (% p.a., Optional)</FormLabel>
                <FormControl>
                  <NumericInput
                    placeholder='5.5'
                    className='w-full'
                    disabled={createDebtMutation.isPending}
                    value={field.value}
                    onValueChange={(values: { value: any }) => field.onChange(values.value)}
                    decimalScale={2}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='durationType'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Repayment Duration Type*</FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    form.setValue('frequency', '');
                    form.setValue('customDateRange', undefined);
                  }}
                  value={field.value}
                  disabled={createDebtMutation.isPending}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder='Select duration type' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value='year'>Years</SelectItem>
                    <SelectItem value='month'>Months</SelectItem>
                    <SelectItem value='week'>Weeks</SelectItem>
                    <SelectItem value='day'>Days</SelectItem>
                    <SelectItem value='custom'>Custom Date Range</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {durationType !== 'custom' && (
            <FormField
              control={form.control}
              name='frequency'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Number of{' '}
                    {durationType === 'year'
                      ? 'Years'
                      : durationType.charAt(0).toUpperCase() + durationType.slice(1)}
                    s*
                  </FormLabel>
                  <FormControl>
                    <Input
                      type='number'
                      placeholder={`e.g., ${durationType === 'year' ? '3' : durationType === 'month' ? '12' : '4'}`}
                      {...field}
                      disabled={createDebtMutation.isPending}
                      step='1'
                      min='1'
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {durationType === 'custom' && (
            <FormField
              control={form.control}
              name='customDateRange'
              render={({ field }) => (
                <FormItem className='md:col-span-2'>
                  <FormLabel>Custom Due Date Range*</FormLabel>
                  <DateRangePickerV2
                    date={
                      field.value?.from && field.value?.to ? (field.value as DateRange) : undefined
                    }
                    onDateChange={field.onChange}
                    disabled={createDebtMutation.isPending}
                    minDate={new Date()}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <div className='flex justify-end gap-2 pt-4 md:col-span-2'>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
              disabled={createDebtMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type='submit'
              disabled={createDebtMutation.isPending || !user?.id}
              className='min-w-[120px]'
            >
              {createDebtMutation.isPending ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Creating...
                </>
              ) : (
                'Create Debt'
              )}
            </Button>
          </div>
          {!user && (
            <p className='text-destructive text-center text-sm md:col-span-2'>
              User information not found.
            </p>
          )}
        </form>
      </Form>
    </AddModal>
  );
};

export default AddDebtModal;
