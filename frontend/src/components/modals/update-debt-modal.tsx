'use client';

import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { apiUpdateDebt } from '@/lib/endpoints/debt';
import { Debts } from '@/lib/types';
import { useInvalidateQueries } from '@/hooks/useInvalidateQueries';
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import DateRangePicker from '../date-range-picker';

const debtUpdateSchema = z.object({
  description: z.string().min(1, { message: 'Description is required' }),
  durationType: z.enum(['year', 'month', 'week', 'day', 'custom']),
  durationValue: z.preprocess(
    (val) => (val === '' ? undefined : Number(val)),
    z
      .number({ invalid_type_error: 'Duration value must be a number' })
      .positive('Duration value must be positive')
      .optional()
  ),
  customDateRange: z.object({ from: z.date(), to: z.date() }).optional(),
  frequency: z.preprocess(
    (val) => (val === '' ? undefined : Number(val)),
    z
      .number({ invalid_type_error: 'Frequency must be a number' })
      .int('Frequency must be a whole number')
      .positive('Frequency must be positive')
      .optional()
  )
});

type DebtUpdateFormSchema = z.infer<typeof debtUpdateSchema>;

interface UpdateDebtModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  debt: Debts;
  onDebtUpdated: () => void;
}

const UpdateDebtModal: React.FC<UpdateDebtModalProps> = ({
  isOpen,
  onOpenChange,
  debt,
  onDebtUpdated
}) => {
  const { showSuccess, showError } = useToast();
  const invalidate = useInvalidateQueries();

  const form = useForm<DebtUpdateFormSchema>({
    resolver: zodResolver(debtUpdateSchema),
    defaultValues: {
      description: debt.description || '',
      durationType: ['year', 'month', 'week', 'day'].includes(debt.duration || '')
        ? (debt.duration as any)
        : 'year',
      durationValue: debt.frequency ? Number(debt.frequency) : 1,
      customDateRange:
        debt.duration && debt.duration.includes(',')
          ? (() => {
              const [from, to] = debt.duration.split(',');
              return { from: new Date(from), to: new Date(to) };
            })()
          : undefined,
      frequency: debt.frequency ? Number(debt.frequency) : undefined
    },
    mode: 'onSubmit'
  });

  React.useEffect(() => {
    if (isOpen) {
      form.reset({
        description: debt.description || '',
        durationType: ['year', 'month', 'week', 'day'].includes(debt.duration || '')
          ? (debt.duration as any)
          : 'year',
        durationValue: debt.frequency ? Number(debt.frequency) : 1,
        customDateRange:
          debt.duration && debt.duration.includes(',')
            ? (() => {
                const [from, to] = debt.duration.split(',');
                return { from: new Date(from), to: new Date(to) };
              })()
            : undefined,
        frequency: debt.frequency ? Number(debt.frequency) : undefined
      });
    }
  }, [isOpen, debt, form]);

  const updateDebtMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: DebtUpdateFormSchema }) => {
      let duration: string | undefined = data.durationType;
      if (data.durationType === 'custom' && data.customDateRange) {
        const { from, to } = data.customDateRange;
        if (!from || !to || from >= to) {
          showError('Invalid custom date range.');
          return;
        }
        duration = `${from.toISOString().split('T')[0]},${to.toISOString().split('T')[0]}`;
      }
      const payload: any = {
        description: data.description,
        duration: duration,
        frequency: data.durationType === 'custom' ? undefined : data.durationValue
      };
      return apiUpdateDebt(id, payload);
    },
    onSuccess: async () => {
      await invalidate(['debts']);
      showSuccess('Debt updated successfully!');
      onOpenChange(false);
      onDebtUpdated();
    },
    onError: (error: any) => {
      showError(error.message);
    }
  });

  const handleUpdate = async (data: DebtUpdateFormSchema) => {
    await updateDebtMutation.mutate({ id: debt.id, data });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Debt</DialogTitle>
          <DialogDescription>Update your debt information.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleUpdate)} className='space-y-4'>
            <FormField
              control={form.control}
              name='description'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder='Debt description' {...field} />
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
                  <FormLabel>Duration*</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select duration' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='year'>Year</SelectItem>
                      <SelectItem value='month'>Month</SelectItem>
                      <SelectItem value='week'>Week</SelectItem>
                      <SelectItem value='day'>Day</SelectItem>
                      <SelectItem value='custom'>Custom Date Range</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {form.watch('durationType') === 'custom' ? (
              <FormField
                control={form.control}
                name='customDateRange'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custom Date Range*</FormLabel>
                    <DateRangePicker
                      dateRange={field.value}
                      setDateRange={field.onChange}
                      disabled={[{ before: new Date() }]}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <FormField
                control={form.control}
                name='durationValue'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration Value*</FormLabel>
                    <FormControl>
                      <Input type='number' placeholder='e.g., 1' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className='pt-2 text-sm'>
              <p>
                <span className='font-medium'>Amount:</span> {debt.amount}
              </p>
              <p>
                <span className='font-medium'>Type:</span> {debt.type}
              </p>
              <p>
                <span className='font-medium'>Interest Type:</span> {debt.interestType}
              </p>
              <p>
                <span className='font-medium'>Status:</span> {debt.isPaid ? 'Paid' : 'Unpaid'}
              </p>
            </div>

            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
                disabled={updateDebtMutation.isPending}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={updateDebtMutation.isPending}>
                {updateDebtMutation.isPending ? 'Updating...' : 'Update Debt'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default UpdateDebtModal;
