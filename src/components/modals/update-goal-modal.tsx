'use client';

import React from 'react';
import { z } from 'zod';
import { UpdateModal } from './update-modal';
import { Input } from '@/components/ui/input';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { NumericInput } from '../ui/numeric-input';
import DateTimePicker from '../date/date-time-picker';
import { Target, IndianRupee, CalendarDays, Coins } from 'lucide-react';
import { goalUpdate } from '@/lib/endpoints/goal';
import { SavingGoal } from '@/lib/types';

const goalSchema = z.object({
  name: z
    .string()
    .min(3, 'Goal name must be at least 3 characters.')
    .max(100, 'Goal name cannot exceed 100 characters.'),
  targetAmount: z
    .string()
    .min(1, { message: 'Target amount is required.' })
    .refine((value) => !isNaN(parseFloat(value)) && parseFloat(value) > 0, {
      message: 'Target amount must be a positive number.'
    })
    .transform((val) => parseFloat(val)),
  savedAmount: z
    .string()
    .optional()
    .refine(
      (value) =>
        value === undefined ||
        value === '' ||
        (!isNaN(parseFloat(value)) && parseFloat(value) >= 0),
      { message: 'Saved amount must be a non-negative number.' }
    )
    .transform((val) => (val ? parseFloat(val) : undefined)),
  targetDate: z.date().optional().nullable()
});

interface UpdateGoalModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  goal: SavingGoal;
  onGoalUpdated: () => void;
}

const UpdateGoalModal: React.FC<UpdateGoalModalProps> = ({
  isOpen,
  onOpenChange,
  goal,
  onGoalUpdated
}) => {
  const handleUpdate = (id: string, data: z.infer<typeof goalSchema>) => {
    const apiPayload = {
      ...data,
      targetDate: data.targetDate ? data.targetDate.toISOString() : null
    };
    return goalUpdate(id, apiPayload);
  };

  return (
    <UpdateModal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title='Edit Saving Goal'
      description={`Update the details for your goal: "${goal?.name}".`}
      initialValues={{
        name: goal.name,
        targetAmount: goal.targetAmount,
        savedAmount: goal.savedAmount ?? 0,
        targetDate: goal.targetDate ? new Date(goal.targetDate) : null
      }}
      validationSchema={goalSchema}
      updateFn={handleUpdate}
      invalidateKeys={[[`goals`]]}
      onSuccess={onGoalUpdated}
      entityId={goal.id}
    >
      {(form) => (
        <>
          <FormField
            control={form.control}
            name='name'
            render={({ field }) => (
              <FormItem>
                <FormLabel className='flex items-center gap-1.5'>
                  <Target className='text-muted-foreground h-4 w-4' />
                  Goal Name*
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder='E.g., Emergency Fund'
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
            name='targetAmount'
            render={({ field }) => (
              <FormItem>
                <FormLabel className='flex items-center gap-1.5'>
                  <IndianRupee className='text-muted-foreground h-4 w-4' />
                  Target Amount*
                </FormLabel>
                <FormControl>
                  <NumericInput
                    placeholder='5,000.00'
                    className='w-full'
                    disabled={form.formState.isSubmitting}
                    value={field.value}
                    onValueChange={(values: { value: any }) => {
                      field.onChange(values.value);
                    }}
                    ref={field.ref as React.Ref<HTMLInputElement>}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='savedAmount'
            render={({ field }) => (
              <FormItem>
                <FormLabel className='flex items-center gap-1.5'>
                  <Coins className='text-muted-foreground h-4 w-4' />
                  Current Saved Amount (Optional)
                </FormLabel>
                <FormControl>
                  <NumericInput
                    placeholder='Current progress (e.g., 1250.00)'
                    className='w-full'
                    disabled={form.formState.isSubmitting}
                    value={field.value}
                    onValueChange={(values: { value: any }) => {
                      field.onChange(values.value);
                    }}
                    ref={field.ref as React.Ref<HTMLInputElement>}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='targetDate'
            render={({ field }) => (
              <FormItem className='flex flex-col'>
                <FormLabel className='flex items-center gap-1.5'>
                  <CalendarDays className='text-muted-foreground h-4 w-4' />
                  Target Date (Optional)
                </FormLabel>
                <FormControl>
                  <DateTimePicker
                    value={field.value ?? undefined}
                    onChange={field.onChange}
                    disabled={form.formState.isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      )}
    </UpdateModal>
  );
};

export default UpdateGoalModal;
