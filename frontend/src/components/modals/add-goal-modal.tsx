'use client';

import React, { useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { goalCreate } from '@/lib/endpoints/goal';
import { useToast } from '@/lib/hooks/useToast';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '../ui/button';
import AddModal from './add-modal';
import { useInvalidateQueries } from '@/hooks/useInvalidateQueries';
import { NumericInput } from '../ui/numeric-input';
import DateTimePicker from '../date/date-time-picker';
import { Loader2, PlusCircle, Target, CalendarDays } from 'lucide-react';

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
  targetDate: z.date({ required_error: 'Target date is required.' })
});

type GoalFormSchema = z.infer<typeof goalSchema>;
type GoalApiPayload = Omit<GoalFormSchema, 'targetDate'> & {
  targetDate: string;
};

interface AddGoalModalProps {
  onGoalAdded: () => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  hideTriggerButton?: boolean;
}

const AddGoalModal: React.FC<AddGoalModalProps> = ({
  onGoalAdded,
  isOpen,
  onOpenChange,
  hideTriggerButton = false
}) => {
  const { showError } = useToast();
  const invalidate = useInvalidateQueries();

  const form = useForm<GoalFormSchema>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      name: '',
      targetAmount: 0,
      targetDate: new Date()
    },
    mode: 'onChange'
  });

  const createGoalMutation = useMutation({
    mutationFn: (data: GoalApiPayload) => goalCreate(data),
    onSuccess: async () => {
      await invalidate(['goals']);
      onGoalAdded();
      handleClose();
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || error.message || 'Failed to create goal.';
      showError(message);
    }
  });

  const handleCreate = (data: GoalFormSchema) => {
    const apiPayload: GoalApiPayload = {
      ...data,
      targetDate: data.targetDate.toISOString()
    };
    createGoalMutation.mutate(apiPayload);
  };

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  };

  useEffect(() => {
    if (isOpen) {
      form.reset({
        name: '',
        targetAmount: 0,
        targetDate: new Date()
      });
    }
  }, [isOpen, form]);

  return (
    <AddModal
      title='Add New Saving Goal'
      description='Define your financial target and track your progress.'
      triggerButton={
        hideTriggerButton ? null : (
          <Button size='sm'>
            <PlusCircle className='mr-2 h-4 w-4' /> Add Goal
          </Button>
        )
      }
      isOpen={isOpen}
      onOpenChange={handleClose}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleCreate)} className='space-y-5 pt-2'>
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
                    placeholder='E.g., Vacation Fund, New Car'
                    {...field}
                    disabled={createGoalMutation.isPending}
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
                <FormLabel>Target Amount*</FormLabel>
                <FormControl>
                  <NumericInput
                    placeholder='5,000.00'
                    className='w-full'
                    disabled={createGoalMutation.isPending}
                    value={field.value}
                    onValueChange={(values: { value: string }) => {
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
                  Target Date*
                </FormLabel>
                <FormControl>
                  <DateTimePicker
                    value={field.value}
                    onChange={field.onChange}
                    disabled={createGoalMutation.isPending ? true : { before: new Date() }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className='flex justify-end gap-2 pt-4'>
            <Button
              type='button'
              variant='outline'
              onClick={handleClose}
              disabled={createGoalMutation.isPending}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={createGoalMutation.isPending} className='min-w-[100px]'>
              {createGoalMutation.isPending ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Adding...
                </>
              ) : (
                'Add Goal'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </AddModal>
  );
};

export default AddGoalModal;
