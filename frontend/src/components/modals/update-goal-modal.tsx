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
import { SavingGoal } from '@/lib/types';
import { goalUpdate } from '@/lib/endpoints/goal';
import DateTimePicker from '../date-time-picker';
import { format } from 'date-fns';
import { useInvalidateQueries } from '@/hooks/useInvalidateQueries';

const goalSchema = z.object({
  name: z.string().min(3, 'Goal name must be at least 3 characters'),
  targetAmount: z.string().refine((value) => !isNaN(Number(value)), {
    message: 'Target amount must be a valid number'
  }),
  savedAmount: z
    .string()
    .refine((value) => !isNaN(Number(value)), { message: 'Saved amount must be valid number' })
    .optional(),
  targetDate: z.date().optional()
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
      name: goal.name,
      targetAmount: goal.targetAmount.toString(),
      savedAmount: goal.savedAmount ? goal.savedAmount.toString() : undefined,
      targetDate: goal.targetDate ? new Date(goal.targetDate) : undefined
    },
    mode: 'onSubmit'
  });

  const updateGoalMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => goalUpdate(id, data),
    onSuccess: async () => {
      await invalidate(['goals']);
      showSuccess('Goal updated successfully!');
      onOpenChange(false);
      onGoalUpdated();
    },
    onError: (error: any) => {
      showError(error.message);
    }
  });

  const handleUpdate = async (data: GoalFormSchema) => {
    await updateGoalMutation.mutate({
      id: goal.id,
      data: {
        name: data.name,
        targetAmount: Number(data.targetAmount),
        savedAmount: data.savedAmount ? Number(data.savedAmount) : undefined,
        targetDate: data.targetDate
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Goal</DialogTitle>
          <DialogDescription>Update your goal information.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleUpdate)} className='space-y-4'>
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
              name='savedAmount'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Saved Amount</FormLabel>
                  <FormControl>
                    <Input type='text' placeholder='Saved Amount' {...field} />
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

            <DialogFooter>
              <Button type='submit' disabled={updateGoalMutation.isPending}>
                {updateGoalMutation.isPending ? 'Updating...' : 'Update Goal'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default UpdateGoalModal;
