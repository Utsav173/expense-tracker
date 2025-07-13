'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { accountUpdate } from '@/lib/endpoints/accounts';
import { useToast } from '@/lib/hooks/useToast';
import { useInvalidateQueries } from '@/hooks/useInvalidateQueries';
import { Loader2, Pencil, Banknote, CircleDollarSign } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

const formSchema = z.object({
  name: z
    .string()
    .min(2, 'Account name must be at least 2 characters.')
    .max(64, 'Account name cannot exceed 64 characters.')
    .trim()
});

type AccountUpdatePayload = Pick<z.infer<typeof formSchema>, 'name'>;

interface UpdateAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountId: string;
  initialValues: {
    name: string;
    balance: number | undefined | null;
    currency: string | undefined;
  };
  onAccountUpdated: () => void;
}

export function UpdateAccountModal({
  open,
  onOpenChange,
  accountId,
  initialValues,
  onAccountUpdated
}: UpdateAccountModalProps) {
  const { showError } = useToast();
  const invalidate = useInvalidateQueries();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialValues.name
    },
    mode: 'onChange'
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        name: initialValues.name
      });
    }
  }, [initialValues.name, open, form]);

  const updateAccountMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: AccountUpdatePayload }) =>
      accountUpdate(id, data),
    onSuccess: async () => {
      await invalidate(['accounts']);
      await invalidate(['account', accountId]);
      await invalidate(['dashboardData']);
      onAccountUpdated();
      onOpenChange(false);
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || error.message || 'Failed to update account name.';
      showError(message);
    }
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const updateData: AccountUpdatePayload = { name: values.name };
    updateAccountMutation.mutate({ id: accountId, data: updateData });
  }

  const handleClose = () => {
    if (!updateAccountMutation.isPending) {
      onOpenChange(false);
      form.reset({ name: initialValues.name });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className='sm:max-w-[480px]'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Pencil className='h-5 w-5' />
            Edit Account Name
          </DialogTitle>
          <DialogDescription>
            Update the name for this account. Balance and currency cannot be changed after creation.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6 pt-2'>
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Name*</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='Enter new account name'
                      {...field}
                      disabled={updateAccountMutation.isPending}
                      autoFocus
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Display-only fields for balance and currency */}
            <div className='grid grid-cols-2 gap-4'>
              <FormItem>
                <FormLabel className='text-muted-foreground flex items-center gap-1.5 text-sm'>
                  <Banknote className='h-4 w-4' />
                  Current Balance
                </FormLabel>
                <FormControl>
                  <Input
                    value={formatCurrency(initialValues.balance ?? 0, initialValues.currency)}
                    readOnly
                    disabled
                    className='bg-muted/50 cursor-not-allowed opacity-70'
                  />
                </FormControl>
              </FormItem>
              <FormItem>
                <FormLabel className='text-muted-foreground flex items-center gap-1.5 text-sm'>
                  <CircleDollarSign className='h-4 w-4' />
                  Currency
                </FormLabel>
                <FormControl>
                  <Input
                    value={initialValues.currency ?? 'N/A'}
                    readOnly
                    disabled
                    className='bg-muted/50 cursor-not-allowed opacity-70'
                  />
                </FormControl>
              </FormItem>
            </div>

            <DialogFooter className='gap-2 pt-4 sm:gap-0'>
              <DialogClose asChild>
                <Button type='button' variant='outline' disabled={updateAccountMutation.isPending}>
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type='submit'
                disabled={
                  updateAccountMutation.isPending ||
                  !form.formState.isDirty ||
                  !form.formState.isValid
                }
                className='min-w-[120px]'
              >
                {updateAccountMutation.isPending ? (
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
}
