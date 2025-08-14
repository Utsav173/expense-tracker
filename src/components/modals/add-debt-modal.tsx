'use client';

import React, { useEffect, useState } from 'react';
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
import DatePicker from '../date/date-picker';
import { NumericInput } from '../ui/numeric-input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { apiEndpoints } from '@/lib/api/api-endpoints-request-types';
import { Icon } from '../ui/icon';

type DebtFormValues = z.infer<typeof apiEndpoints.interest.createDebt.body>;
type InterestFormSchema = z.infer<typeof apiEndpoints.interest.calculate.body>;

interface AddDebtModalProps {
  onDebtAdded: () => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  hideTriggerButton?: boolean;
  initialData?: Partial<DebtFormValues>;
}

const AddDebtModal: React.FC<AddDebtModalProps> = ({
  onDebtAdded,
  isOpen,
  onOpenChange,
  hideTriggerButton = false,
  initialData
}) => {
  const { showError } = useToast();
  const invalidate = useInvalidateQueries();
  const { data: accountsData, isLoading: isLoadingAccounts } = useQuery({
    queryKey: ['accountsDropdown'],
    queryFn: accountGetDropdown,
    staleTime: 5 * 60 * 1000
  });

  const form = useForm<DebtFormValues>({
    resolver: zodResolver(apiEndpoints.interest.createDebt.body),
    defaultValues: {
      type: 'taken',
      interestType: 'simple',
      termUnit: 'months',
      paymentFrequency: 'monthly',
      startDate: new Date(),
      ...initialData
    },
    mode: 'onChange'
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({
        type: 'taken',
        interestType: 'simple',
        termUnit: 'months',
        paymentFrequency: 'monthly',
        startDate: new Date(),
        ...initialData
      });
    }
  }, [isOpen, form, initialData]);

  const createDebtMutation = useMutation({
    mutationFn: (data: any) => apiCreateDebt(data),
    onSuccess: async () => {
      await invalidate(['debts', 'accounts']);
      onDebtAdded();
      onOpenChange(false);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || error.message || 'Failed to create debt.';
      showError(message);
    }
  });

  const handleCreate = (formData: DebtFormValues) => {
    const apiPayload = {
      ...formData,
      amount: Number(formData.amount),
      interestRate: Number(formData.interestRate || 0),
      startDate: (formData.startDate as Date)?.toISOString()
    };
    createDebtMutation.mutate(apiPayload);
  };

  return (
    <AddModal
      title='Add Debt Record'
      description='Log money you owe or money owed to you.'
      triggerButton={
        hideTriggerButton ? null : (
          <Button variant='default'>
            <Icon name='plusCircle' className='mr-2 h-4 w-4' /> Add Debt
          </Button>
        )
      }
      isOpen={isOpen}
      onOpenChange={onOpenChange}
    >
      <TooltipProvider>
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
                      placeholder='E.g., Loan for rent'
                      {...field}
                      value={field.value ?? ''}
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
                      value={String(field.value)}
                      onValueChange={({ value }: { value: string }) =>
                        field.onChange(parseFloat(value))
                      }
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
                  <FormLabel>This is money I have...*</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select type' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='taken'>Taken (Borrowed)</SelectItem>
                      <SelectItem value='given'>Given (Lent)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='user'
              render={({ field }) => (
                <FormItem className='md:col-span-2'>
                  <FormLabel>Counterparty (Who is involved?)*</FormLabel>
                  <FormControl>
                    <InvitationCombobox
                      onChange={(option) => field.onChange(option?.value ?? '')}
                      disabled={createDebtMutation.isPending}
                      placeholder='Select or invite user by email...'
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
                      {accountsData?.map((acc) => (
                        <SelectItem key={acc.id} value={acc.id}>
                          {acc.name} ({acc.currency})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='interestRate'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='flex items-center gap-1.5'>
                    Interest Rate (% p.a.)
                    <Tooltip delayDuration={100}>
                      <TooltipTrigger type='button' onClick={(e) => e.preventDefault()}>
                        <Icon name='info' className='text-muted-foreground h-3 w-3' />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>The annual interest rate for the loan. Enter 0 for no interest.</p>
                      </TooltipContent>
                    </Tooltip>
                  </FormLabel>
                  <FormControl>
                    <NumericInput
                      placeholder='5.5'
                      className='w-full'
                      disabled={createDebtMutation.isPending}
                      value={String(field.value)}
                      onValueChange={({ value }: { value: string }) =>
                        field.onChange(parseFloat(value))
                      }
                      decimalScale={2}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='interestType'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='flex items-center gap-1.5'>
                    Interest Type*
                    <Tooltip delayDuration={100}>
                      <TooltipTrigger type='button' onClick={(e) => e.preventDefault()}>
                        <Icon name='info' className='text-muted-foreground h-3 w-3' />
                      </TooltipTrigger>
                      <TooltipContent className='max-w-xs'>
                        <p>
                          <b>Simple:</b> Calculated only on the principal amount.
                        </p>
                        <p>
                          <b>Compound:</b> Calculated on principal + accumulated interest.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
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
              name='startDate'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date*</FormLabel>
                  <FormControl>
                    <DatePicker value={field.value as Date} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='termLength'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='flex shrink-0 items-center gap-1.5'>
                      <p className='w-full'>Term Length*</p>
                      <Tooltip delayDuration={100}>
                        <TooltipTrigger type='button' onClick={(e) => e.preventDefault()}>
                          <Icon name='info' className='text-muted-foreground h-3 w-3' />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>The total duration of the loan.</p>
                        </TooltipContent>
                      </Tooltip>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        placeholder='e.g., 24'
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='termUnit'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit*</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Unit' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='days'>Days</SelectItem>
                        <SelectItem value='weeks'>Weeks</SelectItem>
                        <SelectItem value='months'>Months</SelectItem>
                        <SelectItem value='years'>Years</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name='paymentFrequency'
              render={({ field }) => (
                <FormItem className='md:col-span-2'>
                  <FormLabel className='flex items-center gap-1.5'>
                    Payment Frequency*
                    <Tooltip delayDuration={100}>
                      <TooltipTrigger type='button' onClick={(e) => e.preventDefault()}>
                        <Icon name='info' className='text-muted-foreground h-3 w-3' />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>How often are payments expected?</p>
                      </TooltipContent>
                    </Tooltip>
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select frequency' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='daily'>Daily</SelectItem>
                      <SelectItem value='weekly'>Weekly</SelectItem>
                      <SelectItem value='monthly'>Monthly</SelectItem>
                      <SelectItem value='yearly'>Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='flex justify-end gap-2 pt-4 md:col-span-2'>
              <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type='submit' disabled={createDebtMutation.isPending}>
                {createDebtMutation.isPending ? (
                  <>
                    <Icon name='loader2' className='mr-2 h-4 w-4 animate-spin' /> Creating...
                  </>
                ) : (
                  'Create Debt'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </TooltipProvider>
    </AddModal>
  );
};

export default AddDebtModal;
