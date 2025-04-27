'use client';

import React, { useEffect, useMemo } from 'react';
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
import { apiUpdateDebt } from '@/lib/endpoints/debt';
import { Debts } from '@/lib/types'; // Use the specific Debts type
import { useInvalidateQueries } from '@/hooks/useInvalidateQueries';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import DateRangePickerV2 from '../date/date-range-picker-v2';
import { NumericInput } from '../ui/numeric-input';
import { Loader2, Pencil, Info } from 'lucide-react';
import { format, parseISO, isValid as isDateValid } from 'date-fns';
import { Card, CardContent } from '../ui/card';
import { formatCurrency } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { DateRange } from 'react-day-picker';

// Schema validates only the fields the backend endpoint updates
const debtUpdateSchema = z
  .object({
    description: z
      .string()
      .min(3, 'Description must be at least 3 characters.')
      .max(255, 'Description too long.'),
    durationType: z.enum(['year', 'month', 'week', 'day', 'custom'], {
      required_error: 'Duration type is required.'
    }),
    // Optional because it's only needed if durationType != 'custom'
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
    // Optional because it's only needed if durationType == 'custom'
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
          path: ['customDateRange', 'from'] // Target specific field
        });
      }
      if (!data.customDateRange?.to) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'End date is required for custom range.',
          path: ['customDateRange', 'to'] // Target specific field
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
          path: ['customDateRange'] // Target the range itself
        });
      }
    }
  });

// Type for the form data
type DebtUpdateFormSchema = z.infer<typeof debtUpdateSchema>;
// Type for the data sent to the API
type DebtUpdateApiPayload = {
  description: string;
  duration: string; // This will be formatted before sending
  frequency?: string; // Sent as string if applicable
};

interface UpdateDebtModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  debt: Debts; // Use the precise Debts type
  onDebtUpdated: () => void;
}

// Helper to parse initial duration/frequency from debt prop
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
        frequency: '', // Frequency not applicable for custom range
        customDateRange: { from: fromDate, to: toDate }
      };
    }
  }

  if (['year', 'month', 'week', 'day'].includes(durationString || '')) {
    return {
      durationType: durationString as 'year' | 'month' | 'week' | 'day',
      frequency: frequencyString || '', // Use existing frequency
      customDateRange: undefined
    };
  }

  // Fallback default if parsing fails
  return {
    durationType: 'year',
    frequency: frequencyString || '',
    customDateRange: undefined
  };
};

const UpdateDebtModal: React.FC<UpdateDebtModalProps> = ({
  isOpen,
  onOpenChange,
  debt,
  onDebtUpdated
}) => {
  const { showSuccess, showError } = useToast();
  const invalidate = useInvalidateQueries();

  const initialDurationState = useMemo(() => parseInitialDuration(debt), [debt]);

  const form = useForm<DebtUpdateFormSchema>({
    resolver: zodResolver(debtUpdateSchema),
    defaultValues: {
      description: debt.description || '',
      ...initialDurationState
    },
    mode: 'onChange'
  });

  const { watch, reset } = form;
  const durationType = watch('durationType');

  // Reset form when modal opens or debt data changes
  useEffect(() => {
    if (isOpen && debt) {
      const parsedDuration = parseInitialDuration(debt);
      reset({
        description: debt.description || '',
        ...parsedDuration
      });
    }
  }, [isOpen, debt, reset]);

  const updateDebtMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: DebtUpdateApiPayload }) =>
      apiUpdateDebt(id, data),
    onSuccess: async () => {
      await invalidate(['debts']);
      showSuccess('Debt updated successfully!');
      onDebtUpdated();
      handleClose(); // Close and reset
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || error.message || 'Failed to update debt.';
      showError(message);
    }
  });

  const handleUpdate = (formData: DebtUpdateFormSchema) => {
    let apiDuration: string;
    if (formData.durationType === 'custom') {
      // Validation should ensure from and to exist here
      apiDuration = `${format(formData.customDateRange!.from!, 'yyyy-MM-dd')},${format(
        formData.customDateRange!.to!,
        'yyyy-MM-dd'
      )}`;
    } else {
      apiDuration = formData.durationType;
    }

    const apiPayload: DebtUpdateApiPayload = {
      description: formData.description,
      duration: apiDuration,
      // Send frequency only if duration type is not 'custom'
      frequency: formData.durationType !== 'custom' ? formData.frequency || undefined : undefined
    };

    updateDebtMutation.mutate({ id: debt.id, data: apiPayload });
  };

  const handleClose = () => {
    if (!updateDebtMutation.isPending) {
      onOpenChange(false);
      // Resetting happens in useEffect based on isOpen
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Pencil className='h-5 w-5' /> Edit Debt
          </DialogTitle>
          <DialogDescription>
            Update the editable details for this debt record. Financial details cannot be changed
            here.
          </DialogDescription>
        </DialogHeader>

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

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleUpdate)} className='space-y-5 pt-4'>
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
                      disabled={updateDebtMutation.isPending}
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
                        // Reset conditional fields when type changes
                        if (value === 'custom') {
                          form.setValue('frequency', ''); // Clear frequency
                        } else {
                          form.setValue('customDateRange', null); // Clear date range
                        }
                        form.clearErrors(['frequency', 'customDateRange']); // Clear related errors
                      }}
                      value={field.value}
                      disabled={updateDebtMutation.isPending}
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
                          value={field.value} // Bind string value
                          onValueChange={(values: { value: any }) => field.onChange(values.value)} // Update with string
                          disabled={updateDebtMutation.isPending}
                          allowNegative={false}
                          allowLeadingZeros={false}
                          decimalScale={0} // Integer only
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
                      disabled={updateDebtMutation.isPending}
                      minDate={new Date()} // Example: Prevent past dates
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Alert about Due Date Calculation */}
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

            <DialogFooter className='gap-2 pt-4 sm:gap-0'>
              <DialogClose asChild>
                <Button type='button' variant='outline' disabled={updateDebtMutation.isPending}>
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type='submit'
                disabled={
                  updateDebtMutation.isPending || !form.formState.isValid || !form.formState.isDirty
                }
                className='min-w-[120px]'
              >
                {updateDebtMutation.isPending ? (
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

export default UpdateDebtModal;
