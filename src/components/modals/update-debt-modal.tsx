'use client';

import React from 'react';
import { z } from 'zod';
import { UpdateModal } from './update-modal';
import { Input } from '@/components/ui/input';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { NumericInput } from '../ui/numeric-input';
import { Card, CardContent } from '../ui/card';
import { formatCurrency } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { apiUpdateDebt } from '@/lib/endpoints/debt';
import type { DebtAndInterestAPI } from '@/lib/api/api-types';
import { apiEndpoints } from '@/lib/api/api-endpoints-request-types';
import { Icon } from '../ui/icon';

type DebtUpdateFormSchema = z.infer<typeof apiEndpoints.interest.updateDebt.body>;

interface UpdateDebtModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  debt: DebtAndInterestAPI.Debt;
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
      validationSchema={apiEndpoints.interest.updateDebt.body}
      updateFn={(id, data) => apiUpdateDebt(id, data)}
      invalidateKeys={[['debts'], ['financialHealthAnalysis']]}
      onSuccess={onDebtUpdated}
      entityId={debt.id}
    >
      {(form) => {
        return (
          <>
            <Card>
              <CardContent className='space-y-2 p-4 text-sm'>
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

            <Alert variant='default'>
              <Icon name='info' className='h-4 w-4' />
              <AlertTitle>Note</AlertTitle>
              <AlertDescription>
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
