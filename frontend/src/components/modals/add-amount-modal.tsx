'use client';

import { useMutation } from '@tanstack/react-query';
import { goalAddAmount, goalWithdrawAmount } from '@/lib/endpoints/goal';
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
import { NumericFormat } from 'react-number-format';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { useState } from 'react';
import { useInvalidateQueries } from '@/hooks/useInvalidateQueries';
import { formatCurrency } from '@/lib/utils';

const amountSchema = (maxAmount?: number, actionType: 'add' | 'withdraw' = 'add') =>
  z.object({
    amount: z
      .string()
      .refine((value) => !isNaN(Number(value)) && Number(value) > 0, {
        message: 'Amount must be a positive number'
      })
      .refine(
        (value) => {
          if (actionType === 'withdraw' && maxAmount !== undefined) {
            return Number(value) <= maxAmount;
          }
          return true;
        },
        {
          message: `Cannot withdraw more than the saved amount (${formatCurrency(maxAmount ?? 0)})`
        }
      )
  });

type AmountFormSchema = z.infer<ReturnType<typeof amountSchema>>;

interface AddAmountModalProps {
  goalId: string;
  goalName: string;
  currentAmount: number;
  currency: string;
  actionType: 'add' | 'withdraw';
  triggerButton: React.ReactNode;
  onSuccess: () => void;
}

const AddAmountModal: React.FC<AddAmountModalProps> = ({
  goalId,
  goalName,
  currentAmount,
  currency,
  actionType,
  triggerButton,
  onSuccess
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { showSuccess, showError } = useToast();
  const invalidate = useInvalidateQueries();

  const form = useForm<AmountFormSchema>({
    resolver: zodResolver(
      amountSchema(actionType === 'withdraw' ? currentAmount : undefined, actionType)
    ),
    defaultValues: {
      amount: ''
    },
    mode: 'onSubmit'
  });

  const mutationFn = actionType === 'add' ? goalAddAmount : goalWithdrawAmount;

  const amountMutation = useMutation({
    mutationFn: (data: { id: string; data: { amount: number } }) => mutationFn(data.id, data.data),
    onSuccess: async () => {
      await invalidate(['goals']);
      showSuccess(`Amount ${actionType === 'add' ? 'added' : 'withdrawn'} successfully!`);
      form.reset();
      onSuccess();
      setIsOpen(false);
    },
    onError: (error: any) => {
      showError(error.message);
    }
  });

  const handleAction = async (data: AmountFormSchema) => {
    amountMutation.mutate({ id: goalId, data: { amount: Number(data.amount) } });
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      form.reset(); // Reset form when closing
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild onClick={(e) => e.stopPropagation()}>
        {triggerButton}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {actionType === 'add' ? 'Add Amount to Goal' : 'Withdraw Amount from Goal'}
          </DialogTitle>
          <DialogDescription>
            {actionType === 'add' ? 'Contribute towards' : 'Withdraw from'} "<b>{goalName}</b>".
            <br />
            Current saved amount: {formatCurrency(currentAmount, currency)}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleAction)} className='space-y-4'>
            <FormField
              control={form.control}
              name='amount'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount ({currency})</FormLabel>
                  <FormControl>
                    <NumericFormat
                      customInput={Input}
                      thousandSeparator=','
                      decimalSeparator='.'
                      allowNegative={false}
                      decimalScale={2}
                      placeholder='0.00'
                      autoComplete='off'
                      onValueChange={(values) => {
                        field.onChange(values.value); // Use field.onChange from RHF
                      }}
                      value={field.value} // Bind value from RHF
                      className='w-full'
                      disabled={amountMutation.isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button variant='outline' onClick={() => handleOpenChange(false)} type='button'>
                Cancel
              </Button>
              <Button type='submit' disabled={amountMutation.isPending}>
                {amountMutation.isPending
                  ? actionType === 'add'
                    ? 'Adding...'
                    : 'Withdrawing...'
                  : actionType === 'add'
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

export default AddAmountModal;
