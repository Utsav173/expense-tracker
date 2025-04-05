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
import { apiUpdateDebt } from '@/lib/endpoints/debt';
import { Debts } from '@/lib/types';
import { useInvalidateQueries } from '@/hooks/useInvalidateQueries';
import React from 'react';

const debtUpdateSchema = z.object({
  description: z.string().min(1, { message: 'Description is required' }),
  duration: z.string().optional(),
  frequency: z.string().optional()
});

type DebtUpdateFormSchema = z.infer<typeof debtUpdateSchema>;

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
  const { showSuccess, showError } = useToast();
  const invalidate = useInvalidateQueries();

  const form = useForm<DebtUpdateFormSchema>({
    resolver: zodResolver(debtUpdateSchema),
    defaultValues: {
      description: debt.description || '',
      duration: debt.duration || '',
      frequency: debt.frequency || ''
    },
    mode: 'onSubmit'
  });

  React.useEffect(() => {
    if (isOpen) {
      form.reset({
        description: debt.description || '',
        duration: debt.duration || '',
        frequency: debt.frequency || ''
      });
    }
  }, [isOpen, debt, form]);

  const updateDebtMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: DebtUpdateFormSchema }) =>
      apiUpdateDebt(id, data),
    onSuccess: async () => {
      await invalidate(['debts']);
      showSuccess('Debt updated successfully!');
      onOpenChange(false);
      onDebtUpdated();
    },
    onError: (error: any) => {
      showError(error.message);
    }
  });

  const handleUpdate = async (data: DebtUpdateFormSchema) => {
    await updateDebtMutation.mutate({ id: debt.id, data });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Debt</DialogTitle>
          <DialogDescription>Update your debt information.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleUpdate)} className='space-y-4'>
            <FormField
              control={form.control}
              name='description'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder='Debt description' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='duration'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration Type</FormLabel>
                  <FormControl>
                    <Input placeholder='e.g., month, year' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='frequency'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Frequency (Number)</FormLabel>
                  <FormControl>
                    <Input type='number' placeholder='e.g., 12' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='pt-2 text-sm'>
              <p>
                <span className='font-medium'>Amount:</span> {debt.amount}
              </p>
              <p>
                <span className='font-medium'>Type:</span> {debt.type}
              </p>
              <p>
                <span className='font-medium'>Interest Type:</span> {debt.interestType}
              </p>
              <p>
                <span className='font-medium'>Status:</span> {debt.isPaid ? 'Paid' : 'Unpaid'}
              </p>
            </div>

            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
                disabled={updateDebtMutation.isPending}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={updateDebtMutation.isPending}>
                {updateDebtMutation.isPending ? 'Updating...' : 'Update Debt'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default UpdateDebtModal;
