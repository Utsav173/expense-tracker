'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/lib/hooks/useToast';
import { Button } from '../ui/button';
import AddModal from './add-modal';
import { accountShare } from '@/lib/endpoints/accounts';
import { useMutation } from '@tanstack/react-query';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '../ui/input';
import { useInvalidateQueries } from '@/hooks/useInvalidateQueries';
import { InvitationCombobox } from '../invitation/InvitationCombobox';

const shareAccountSchema = z.object({
  accountId: z.string().uuid(),
  user: z.object({
    value: z.string().uuid(),
    label: z.string().email()
  })
});

type ShareAccountFormSchema = z.infer<typeof shareAccountSchema>;

const ShareAccountModal = ({
  accountId,
  triggerButton
}: {
  accountId: string;
  triggerButton?: React.ReactNode;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const invalidate = useInvalidateQueries();

  const form = useForm<ShareAccountFormSchema>({
    resolver: zodResolver(shareAccountSchema),
    defaultValues: {
      accountId: accountId,
      user: {
        value: '',
        label: ''
      }
    }
  });

  const { showError } = useToast();

  const shareAccountMutation = useMutation({
    mutationFn: (data: { accountId: string; userId: string }) => accountShare(data),
    onSuccess: async () => {
      await invalidate(['accounts', 'accountShares']);
      setIsOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      showError(error.message);
    }
  });

  const handleShareAccount = async (data: ShareAccountFormSchema) => {
    if (!data.user || !data.user.value) return;
    if (data.user.value.startsWith('invite:')) {
      return;
    }
    const payload = { accountId: data.accountId, userId: data.user.value };
    await shareAccountMutation.mutate(payload);
  };

  // Keep form userId in sync with selectedUser
  const handleUserChange = (option: { label: string; value: string }) => {};

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);

    if (open) {
      form.reset();
      form.setValue('accountId', accountId);
      form.setValue('user', {
        value: '',
        label: ''
      });
    }
  };

  return (
    <AddModal
      title='Share Account'
      description='Share this account with another user. They will be able to view and manage transactions.'
      triggerButton={triggerButton ?? <Button>Share Account</Button>}
      isOpen={isOpen}
      onOpenChange={handleOpenChange}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleShareAccount)} className='space-y-4'>
          <FormField
            control={form.control}
            name='accountId'
            render={({ field }) => (
              <FormItem hidden>
                <FormLabel>Account</FormLabel>
                <FormControl>
                  <Input {...field} disabled />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='user'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Select User</FormLabel>
                <FormControl>
                  <InvitationCombobox
                    value={field.value}
                    onChange={field.onChange}
                    placeholder='Select a user to share with or invite by email'
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className='flex justify-end gap-2'>
            <Button type='button' variant='outline' onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type='submit' disabled={shareAccountMutation.isPending}>
              {shareAccountMutation.isPending ? 'Sharing...' : 'Share Account'}
            </Button>
          </div>
        </form>
      </Form>
    </AddModal>
  );
};

export default ShareAccountModal;
