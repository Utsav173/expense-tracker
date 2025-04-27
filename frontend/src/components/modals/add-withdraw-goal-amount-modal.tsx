'use client';

import React, { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { goalAddAmount, goalWithdrawAmount } from '@/lib/endpoints/goal';
import { useToast } from '@/lib/hooks/useToast';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose // Import DialogClose
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
import { formatCurrency } from '@/lib/utils';
import { NumericInput } from '../ui/numeric-input'; // Use the new component
import { Loader2, MinusCircle, PlusCircle } from 'lucide-react';

// Schema factory to create schema dynamically based on mode and max amount
const createAmountSchema = (maxAmount?: number, actionType: 'add' | 'withdraw' = 'add') =>
  z.object({
    amount: z
      .string()
      .min(1, 'Amount is required.') // Ensure field is not empty
      .refine((value) => !isNaN(parseFloat(value)) && parseFloat(value) > 0, {
        message: 'Amount must be a positive number.'
      })
      .refine(
        (value) => {
          if (actionType === 'withdraw' && maxAmount !== undefined) {
            // Ensure the comparison happens with numbers
            return parseFloat(value) <= maxAmount;
          }
          return true;
        },
        {
          // Dynamically generate error message with formatted currency
          message: `Cannot withdraw more than the saved amount (${formatCurrency(maxAmount ?? 0)}).`
        }
      )
  });

type AmountFormSchema = z.infer<ReturnType<typeof createAmountSchema>>;

interface AddWithdrawGoalAmountModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  goalId: string;
  mode: 'add' | 'withdraw';
  goalName: string;
  currentSavedAmount: number;
  currency: string;
  triggerButton: React.ReactNode;
  onSuccess: () => void;
}

const AddWithdrawGoalAmountModal: React.FC<AddWithdrawGoalAmountModalProps> = ({
  isOpen,
  onOpenChange,
  goalId,
  mode,
  goalName,
  currentSavedAmount,
  currency,
  triggerButton,
  onSuccess
}) => {
  const { showSuccess, showError } = useToast();
  const invalidate = useInvalidateQueries();

  // Memoize the schema to prevent recreation on every render unless dependencies change
  const amountSchema = useMemo(
    () => createAmountSchema(mode === 'withdraw' ? currentSavedAmount : undefined, mode),
    [mode, currentSavedAmount]
  );

  const form = useForm<AmountFormSchema>({
    resolver: zodResolver(amountSchema),
    defaultValues: { amount: '' },
    mode: 'onChange' // Provide feedback as the user types
  });

  // Determine mutation function and messages based on mode
  const mutationFn = mode === 'add' ? goalAddAmount : goalWithdrawAmount;
  const successMessage =
    mode === 'add' ? 'Amount added successfully!' : 'Amount withdrawn successfully!';
  const errorMessage = mode === 'add' ? 'Failed to add amount.' : 'Failed to withdraw amount.';
  const buttonText = mode === 'add' ? 'Add Amount' : 'Withdraw Amount';
  const loadingText = mode === 'add' ? 'Adding...' : 'Withdrawing...';
  const modalTitle = mode === 'add' ? 'Add Amount to Goal' : 'Withdraw Amount from Goal';
  const modalDescription = `${mode === 'add' ? 'Contribute towards' : 'Withdraw from'} "${goalName}".`;
  const Icon = mode === 'add' ? PlusCircle : MinusCircle;

  const addWithdrawMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { amount: number } }) => mutationFn(id, data),
    onSuccess: async () => {
      await invalidate(['goals']); // Invalidate the goals query cache
      showSuccess(successMessage);
      onSuccess(); // Callback provided by parent
      handleClose(); // Close modal and reset form
    },
    onError: (error: any) => {
      // Use the specific error message from the API if available
      const message = error?.response?.data?.message || error.message || errorMessage;
      showError(message);
    }
  });

  const handleSubmitAmount = (data: AmountFormSchema) => {
    addWithdrawMutation.mutate({ id: goalId, data: { amount: Number(data.amount) } });
  };

  const handleClose = () => {
    form.reset({ amount: '' }); // Reset form state with default empty string
    onOpenChange(false); // Close the dialog
  };

  // Reset form when modal is opened or dependencies change
  useEffect(() => {
    if (isOpen) {
      form.reset({ amount: '' });
    }
  }, [isOpen, form]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogTrigger asChild onClick={(e) => e.stopPropagation()}>
        {triggerButton}
      </DialogTrigger>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Icon className='h-5 w-5' />
            {modalTitle}
          </DialogTitle>
          <DialogDescription>
            {modalDescription}
            <br />
            Current saved amount: <b>{formatCurrency(currentSavedAmount, currency)}</b>
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmitAmount)} className='space-y-6 pt-2'>
            <FormField
              control={form.control}
              name='amount'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount ({currency})</FormLabel>
                  <FormControl>
                    <NumericInput
                      placeholder='0.00'
                      className='w-full'
                      disabled={addWithdrawMutation.isPending}
                      value={field.value} // Bind value from RHF
                      onValueChange={(values: { value: any }) => {
                        // Update form state with the string value
                        field.onChange(values.value);
                      }}
                      autoFocus
                      // Pass the ref if NumericInput forwards it
                      ref={field.ref as React.Ref<HTMLInputElement>}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className='gap-2 sm:gap-0'>
              {/* Explicitly use DialogClose for the Cancel button */}
              <DialogClose asChild>
                <Button type='button' variant='outline' disabled={addWithdrawMutation.isPending}>
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type='submit'
                disabled={addWithdrawMutation.isPending || !form.formState.isValid} // Disable if form is invalid
                className='min-w-[120px]'
              >
                {addWithdrawMutation.isPending ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    {loadingText}
                  </>
                ) : (
                  buttonText
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddWithdrawGoalAmountModal;
