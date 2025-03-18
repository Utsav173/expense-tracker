'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
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
import DateTimePicker from '../date-time-picker';

const goalSchema = z.object({
  name: z.string().min(3, 'Goal name must be at least 3 characters'),
  targetAmount: z.string().refine((value) => !isNaN(Number(value)), {
    message: 'Target amount must be a valid number'
  }),
  targetDate: z.date().optional()
});

type GoalFormSchema = z.infer<typeof goalSchema>;

const AddGoalModal = ({
  onGoalAdded,
  isOpen,
  onOpenChange
}: {
  onGoalAdded: () => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<GoalFormSchema>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      name: '',
      targetAmount: '',
      targetDate: undefined
    },
    mode: 'onSubmit'
  });

  const createGoalMutation = useMutation({
    mutationFn: (data: GoalFormSchema) =>
      goalCreate({
        ...data,
        targetAmount: Number(data.targetAmount)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      showSuccess('Goal created successfully!');
      form.reset();
      onGoalAdded();
      onOpenChange(false);
    },
    onError: (error: any) => {
      showError(error.message);
    }
  });

  const handleCreate = async (data: GoalFormSchema) => {
    createGoalMutation.mutate(data);
  };

  return (
    <AddModal
      title='Add Goal'
      description='Create a new saving goal.'
      triggerButton={<Button>Add Goal</Button>}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleCreate)} className='space-y-6'>
          <FormField
            control={form.control}
            name='name'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Goal Name</FormLabel>
                <FormControl>
                  <Input placeholder='Goal name' {...field} />
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
                <FormLabel>Target Amount</FormLabel>
                <FormControl>
                  <Input type='text' placeholder='Target Amount' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='targetDate'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Target Date</FormLabel>
                <FormControl>
                  <DateTimePicker value={field.value} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type='submit' disabled={createGoalMutation.isPending} className='w-full'>
            {createGoalMutation.isPending ? 'Adding...' : 'Add Goal'}
          </Button>
        </form>
      </Form>
    </AddModal>
  );
};

export default AddGoalModal;
