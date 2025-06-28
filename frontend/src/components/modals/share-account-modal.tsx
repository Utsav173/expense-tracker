'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/lib/hooks/useToast';
import { Button } from '../ui/button';
import AddModal from './add-modal';
import { accountShare, usersGetDropdown } from '@/lib/endpoints/accounts';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
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
import { DropdownUser } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

const shareAccountSchema = z.object({
  accountId: z.string().uuid(),
  userId: z.string().uuid()
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
      userId: ''
    }
  });

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['userDropdown'],
    queryFn: usersGetDropdown
  });

  const { showError, showSuccess } = useToast();

  const shareAccountMutation = useMutation({
    mutationFn: (data: ShareAccountFormSchema) => accountShare(data),
    onSuccess: async () => {
      await invalidate(['accounts', 'accountShares']);
      showSuccess('Account shared successfully!');
      setIsOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      showError(error.message);
    }
  });

  const handleShareAccount = async (data: ShareAccountFormSchema) => {
    await shareAccountMutation.mutate(data);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);

    if (open) {
      form.reset();
      form.setValue('accountId', accountId);
      form.setValue('userId', '');
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
            name='userId'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Select User</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder='Select a user to share with' />
                    </SelectTrigger>
                    <SelectContent>
                      {usersData?.map((user: DropdownUser) => (
                        <SelectItem key={user.id} value={user.id}>
                          <div className='flex items-center gap-2'>
                            <Avatar>
                              <AvatarImage src={user.profilePic || undefined} />
                              <AvatarFallback>
                                {user.name
                                  .split(' ')
                                  .map((n) => n[0])
                                  .join('')}
                              </AvatarFallback>
                            </Avatar>
                            <span>{user.name}</span>
                            <span className='text-muted-foreground'>({user.email})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
