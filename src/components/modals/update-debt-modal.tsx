'use client';

import React, { useMemo } from 'react';
import { z } from 'zod';
import { UpdateModal } from './update-modal';
import { Input } from '@/components/ui/input';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { NumericInput } from '../ui/numeric-input';
import { Info } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { formatCurrency } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { apiUpdateDebt } from '@/lib/endpoints/debt';
import { Debts } from '@/lib/types';

const debtUpdateSchema = z.object({
  description: z
    .string()
    .min(3, 'Description must be at least 3 characters.')
    .max(255, 'Description too long.'),
  termLength: z.number().int().positive('Term length must be a positive integer.'),
  termUnit: z.enum(['days', 'weeks', 'months', 'years']),
  interestRate: z.number().min(0, 'Interest rate cannot be negative.')
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
  return (
    <UpdateModal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title='Edit Debt'
      description='Update the editable details for this debt record.'
      initialValues={{
        description: debt.description || '',
        termLength: debt.termLength,
        termUnit: debt.termUnit,
        interestRate: debt.interestRate
      }}
      validationSchema={debtUpdateSchema}
      updateFn={(id, data) => apiUpdateDebt(id, data)}
      invalidateKeys={[['debts']]}
      onSuccess={onDebtUpdated}
      entityId={debt.id}
    >
      {(form) => {
        return (
          <>
            <Card className='border-border/50 bg-muted/50 mt-4 p-4'>
              <CardContent className='space-y-2 p-0 text-sm'>
                <h4 className='text-foreground mb-2 font-medium'>Original Details</h4>
                <div className='grid grid-cols-2 gap-x-4 gap-y-1'>
                  <span className='text-muted-foreground'>Amount:</span>
                  <span className='text-foreground font-semibold'>
                    {formatCurrency(debt.amount)}
                  </span>
                  <span className='text-muted-foreground'>Type:</span>
                  <span className='text-foreground font-semibold capitalize'>{debt.type}</span>
                  <span className='text-muted-foreground'>Status:</span>
                  <span
                    className={`font-semibold ${debt.isPaid ? 'text-success' : 'text-destructive'}`}
                  >
                    {debt.isPaid ? 'Paid' : 'Unpaid'}
                  </span>
                </div>
              </CardContent>
            </Card>

            <FormField
              control={form.control}
              name='description'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description*</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='Debt description'
                      {...field}
                      disabled={form.formState.isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='interestRate'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Interest Rate (% p.a.)</FormLabel>
                  <FormControl>
                    <NumericInput
                      placeholder='5.5'
                      className='w-full'
                      value={field.value}
                      onValueChange={({ value }: { value: number }) =>
                        field.onChange(Number(value))
                      }
                      disabled={form.formState.isSubmitting}
                      decimalScale={2}
                    />
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
                    <FormLabel>Term Length*</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        placeholder='e.g., 24'
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                        disabled={form.formState.isSubmitting}
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
                    <FormLabel>Term Unit*</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={form.formState.isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Select unit' />
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

            <Alert
              variant='default'
              className='border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950'
            >
              <Info className='h-4 w-4 text-blue-600 dark:text-blue-400' />
              <AlertTitle className='text-blue-800 dark:text-blue-300'>Note</AlertTitle>
              <AlertDescription className='text-blue-700 dark:text-blue-300/90'>
                Changing the term will affect the calculated final due date but does not alter
                payment schedules.
              </AlertDescription>
            </Alert>
          </>
        );
      }}
    </UpdateModal>
  );
};

export default UpdateDebtModal;
