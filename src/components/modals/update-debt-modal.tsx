'use client';

import React, { useMemo } from 'react';
import { z } from 'zod';
import { UpdateModal } from './update-modal';
import { Input } from '@/components/ui/input';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import DateRangePickerV2 from '../date/date-range-picker-v2';
import { NumericInput } from '../ui/numeric-input';
import { Info } from 'lucide-react';
import { format, parseISO, isValid as isDateValid } from 'date-fns';
import { Card, CardContent } from '../ui/card';
import { formatCurrency } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { DateRange } from 'react-day-picker';
import { apiUpdateDebt } from '@/lib/endpoints/debt';
import { Debts } from '@/lib/types';

const debtUpdateSchema = z
  .object({
    description: z
      .string()
      .min(3, 'Description must be at least 3 characters.')
      .max(255, 'Description too long.'),
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
      .nullable()
  })
  .superRefine((data, ctx) => {
    if (data.durationType !== 'custom' && (data.frequency === undefined || data.frequency === '')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Frequency (number of units) is required for this duration type.',
        path: ['frequency']
      });
    }
    if (data.durationType === 'custom') {
      if (!data.customDateRange?.from) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Start date is required for custom range.',
          path: ['customDateRange', 'from']
        });
      }
      if (!data.customDateRange?.to) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'End date is required for custom range.',
          path: ['customDateRange', 'to']
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

type DebtUpdateFormSchema = z.infer<typeof debtUpdateSchema>;

const parseInitialDuration = (
  debt: Debts
): Pick<DebtUpdateFormSchema, 'durationType' | 'frequency' | 'customDateRange'> => {
  const durationString = debt.duration;
  const frequencyString = debt.frequency;

  if (durationString && durationString.includes(',')) {
    const [fromStr, toStr] = durationString.split(',');
    const fromDate = parseISO(fromStr);
    const toDate = parseISO(toStr);
    if (isDateValid(fromDate) && isDateValid(toDate)) {
      return {
        durationType: 'custom',
        frequency: '',
        customDateRange: { from: fromDate, to: toDate }
      };
    }
  }

  if (['year', 'month', 'week', 'day'].includes(durationString || '')) {
    return {
      durationType: durationString as 'year' | 'month' | 'week' | 'day',
      frequency: frequencyString || '',
      customDateRange: undefined
    };
  }

  return {
    durationType: 'year',
    frequency: frequencyString || '',
    customDateRange: undefined
  };
};

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
  const initialDurationState = useMemo(() => parseInitialDuration(debt), [debt]);

  const handleUpdate = (id: string, formData: DebtUpdateFormSchema) => {
    let apiDuration: string;
    if (formData.durationType === 'custom') {
      apiDuration = `${format(formData.customDateRange!.from!, 'yyyy-MM-dd')},${format(
        formData.customDateRange!.to!,
        'yyyy-MM-dd'
      )}`;
    } else {
      apiDuration = formData.durationType;
    }

    const apiPayload = {
      description: formData.description,
      duration: apiDuration,
      frequency: formData.durationType !== 'custom' ? formData.frequency || undefined : undefined
    };

    return apiUpdateDebt(id, apiPayload);
  };

  return (
    <UpdateModal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="Edit Debt"
      description="Update the editable details for this debt record. Financial details cannot be changed here."
      initialValues={{
        description: debt.description || '',
        ...initialDurationState
      }}
      validationSchema={debtUpdateSchema}
      updateFn={handleUpdate}
      invalidateKeys={[[`debts`]]}
      onSuccess={onDebtUpdated}
      entityId={debt.id}
    >
      {(form) => {
        const durationType = form.watch('durationType');
        return (
          <>
            <Card className='border-border/50 bg-muted/50 mt-4 p-4'>
              <CardContent className='space-y-2 p-0 text-sm'>
                <h4 className='text-foreground mb-2 font-medium'>Original Details</h4>
                <div className='grid grid-cols-2 gap-x-4 gap-y-1'>
                  <span className='text-muted-foreground'>Amount:</span>
                  <span className='text-foreground font-semibold'>{formatCurrency(debt.amount)}</span>
                  {debt.premiumAmount > 0 && (
                    <>
                      <span className='text-muted-foreground'>Premium:</span>
                      <span className='text-foreground font-semibold'>
                        {formatCurrency(debt.premiumAmount)}
                      </span>
                    </>
                  )}
                  <span className='text-muted-foreground'>Type:</span>
                  <span className='text-foreground font-semibold capitalize'>{debt.type}</span>
                  <span className='text-muted-foreground'>Interest:</span>
                  <span className='text-foreground font-semibold capitalize'>
                    {debt.interestType} ({debt.percentage}%)
                  </span>
                  <span className='text-muted-foreground'>Status:</span>
                  <span
                    className={`font-semibold ${debt.isPaid ? 'text-success' : 'text-destructive'}`}
                  >
                    {debt.isPaid ? 'Paid' : 'Unpaid'}
                  </span>
                  {debt.dueDate && (
                    <>
                      <span className='text-muted-foreground'>Original Due:</span>
                      <span className='text-foreground font-semibold'>
                        {format(parseISO(debt.dueDate), 'MMM d, yyyy')}
                      </span>
                    </>
                  )}
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

            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              <FormField
                control={form.control}
                name='durationType'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Repayment Duration Type*</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        if (value === 'custom') {
                          form.setValue('frequency', '');
                        } else {
                          form.setValue('customDateRange', null);
                        }
                        form.clearErrors(['frequency', 'customDateRange']);
                      }}
                      value={field.value}
                      disabled={form.formState.isSubmitting}
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
                        <NumericInput
                          placeholder={`e.g., ${durationType === 'year' ? '3' : durationType === 'month' ? '12' : '4'}`}
                          className='w-full'
                          {...field}
                          value={field.value}
                          onValueChange={(values: { value: any }) => field.onChange(values.value)}
                          disabled={form.formState.isSubmitting}
                          allowNegative={false}
                          allowLeadingZeros={false}
                          decimalScale={0}
                          step={1}
                          min={1}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {durationType === 'custom' && (
              <FormField
                control={form.control}
                name='customDateRange'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custom Due Date Range*</FormLabel>
                    <DateRangePickerV2
                      date={field.value ? (field.value as DateRange) : undefined}
                      onDateChange={field.onChange}
                      disabled={form.formState.isSubmitting}
                      minDate={new Date()}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <Alert
              variant='default'
              className='border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950'
            >
              <Info className='h-4 w-4 text-blue-600 dark:text-blue-400' />
              <AlertTitle className='text-blue-800 dark:text-blue-300'>Note on Due Date</AlertTitle>
              <AlertDescription className='text-blue-700 dark:text-blue-300/90'>
                Updating duration/frequency here updates the record but does not automatically
                recalculate the original Due Date shown above. The due date is set only upon
                creation.
              </AlertDescription>
            </Alert>
          </>
        );
      }}
    </UpdateModal>
  );
};

export default UpdateDebtModal;