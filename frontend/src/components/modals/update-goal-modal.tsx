'use client';

import React, { useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/lib/hooks/useToast';
import { Button } from '../ui/button';
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
import { SavingGoal } from '@/lib/types';
import { GoalApiPayload, goalUpdate } from '@/lib/endpoints/goal';
import { useInvalidateQueries } from '@/hooks/useInvalidateQueries';
import { NumericInput } from '../ui/numeric-input';
import DateTimePicker from '../date/date-time-picker';
import { Input } from '../ui/input';
import { Loader2, Pencil, Target, IndianRupee, CalendarDays, Coins } from 'lucide-react';

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

type GoalFormSchema = z.infer<typeof goalSchema>;

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
  const { showSuccess, showError } = useToast();
  const invalidate = useInvalidateQueries();

  const form = useForm<GoalFormSchema>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      name: '',
      targetAmount: 0,
      savedAmount: 0,
      targetDate: null
    },
    mode: 'onChange'
  });

  useEffect(() => {
    if (isOpen && goal) {
      form.reset({
        name: goal.name,
        targetAmount: goal.targetAmount,
        savedAmount: goal.savedAmount ? goal.savedAmount : 0,
        targetDate: goal.targetDate ? new Date(goal.targetDate) : null
      });
    }
  }, [isOpen, goal, form]);

  const updateGoalMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: GoalApiPayload }) => goalUpdate(id, data),
    onSuccess: async () => {
      await invalidate(['goals']);
      showSuccess('Goal updated successfully!');
      onGoalUpdated();
      handleClose();
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || error.message || 'Failed to update goal.';
      showError(message);
    }
  });

  const handleUpdate = (data: GoalFormSchema) => {
    const apiPayload: GoalApiPayload = {
      name: data.name,
      targetAmount: data.targetAmount,
      savedAmount: data.savedAmount,
      targetDate: data.targetDate ? data.targetDate.toISOString() : null
    };

    updateGoalMutation.mutate({ id: goal.id, data: apiPayload });
  };

  const handleClose = () => {
    if (!updateGoalMutation.isPending) {
      form.reset({
        name: '',
        targetAmount: 0,
        savedAmount: 0,
        targetDate: null
      });
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className='sm:max-w-[480px]'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Pencil className='h-5 w-5' /> Edit Saving Goal
          </DialogTitle>
          <DialogDescription>Update the details for your goal: "{goal?.name}".</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleUpdate)} className='space-y-5 pt-2'>
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
                      disabled={updateGoalMutation.isPending}
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
                      disabled={updateGoalMutation.isPending}
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
                      disabled={updateGoalMutation.isPending}
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
                      disabled={updateGoalMutation.isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className='gap-2 pt-4 sm:gap-0'>
              <DialogClose asChild>
                <Button type='button' variant='outline' disabled={updateGoalMutation.isPending}>
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type='submit'
                disabled={
                  updateGoalMutation.isPending || !form.formState.isValid || !form.formState.isDirty
                }
                className='min-w-[120px]'
              >
                {updateGoalMutation.isPending ? (
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

export default UpdateGoalModal;
