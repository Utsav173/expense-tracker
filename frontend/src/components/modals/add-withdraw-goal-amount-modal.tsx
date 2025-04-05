'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { goalAddAmount, goalWithdrawAmount } from '@/lib/endpoints/goal';
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
import { useInvalidateQueries } from '@/hooks/useInvalidateQueries';

const amountSchema = z.object({
  amount: z.string().refine((value) => !isNaN(Number(value)) && Number(value) > 0, {
    message: 'Amount must be a positive number'
  })
});

type AmountFormSchema = z.infer<typeof amountSchema>;

interface AddWithdrawGoalAmountModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  goalId: string;
  mode: 'add' | 'withdraw';
  goalName: string;
  currentSavedAmount: number;
  onSuccess: () => void;
}

const AddWithdrawGoalAmountModal: React.FC<AddWithdrawGoalAmountModalProps> = ({
  isOpen,
  onOpenChange,
  goalId,
  mode,
  goalName,
  currentSavedAmount,
  onSuccess
}) => {
  const { showSuccess, showError } = useToast();
  const invalidate = useInvalidateQueries();

  const form = useForm<AmountFormSchema>({
    resolver: zodResolver(amountSchema),
    defaultValues: { amount: '' },
    mode: 'onSubmit'
  });

  const mutationFn = mode === 'add' ? goalAddAmount : goalWithdrawAmount;
  const successMessage =
    mode === 'add' ? 'Amount added successfully!' : 'Amount withdrawn successfully!';
  const errorMessage = mode === 'add' ? 'Failed to add amount' : 'Failed to withdraw amount';

  const addWithdrawMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { amount: number } }) => mutationFn(id, data),
    onSuccess: async () => {
      await invalidate(['goals']);
      showSuccess(successMessage);
      form.reset();
      onSuccess();
      onOpenChange(false);
    },
    onError: (error: any) => {
      showError(error.message || errorMessage);
    }
  });

  const handleSubmitAmount = (data: AmountFormSchema) => {
    const amountValue = Number(data.amount);
    if (mode === 'withdraw' && amountValue > currentSavedAmount) {
      showError('Withdrawal amount cannot exceed the saved amount.');
      return;
    }
    addWithdrawMutation.mutate({ id: goalId, data: { amount: amountValue } });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === 'add' ? 'Add Amount to Goal' : 'Withdraw Amount from Goal'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'add' ? 'Add funds towards' : 'Withdraw funds from'} '{goalName}'.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmitAmount)} className='space-y-4'>
            <FormField
              control={form.control}
              name='amount'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input type='number' step='0.01' placeholder='Enter amount' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
                disabled={addWithdrawMutation.isPending}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={addWithdrawMutation.isPending}>
                {addWithdrawMutation.isPending
                  ? mode === 'add'
                    ? 'Adding...'
                    : 'Withdrawing...'
                  : mode === 'add'
                    ? 'Add Amount'
                    : 'Withdraw Amount'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddWithdrawGoalAmountModal;
