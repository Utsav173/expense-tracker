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
import { User } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import { X } from 'lucide-react';
import { DropdownUser } from '@/lib/types';

const shareAccountSchema = z.object({
  accountId: z.string().uuid(),
  userIds: z.array(z.string().uuid()).min(1, 'Please select at least one user')
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
      userIds: []
    }
  });

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['userDropdown'],
    queryFn: usersGetDropdown
  });

  const { showError, showSuccess } = useToast();

  const shareAccountMutation = useMutation({
    mutationFn: (data: ShareAccountFormSchema) =>
      accountShare(data, 'Account shared successfully!', 'Failed to share account.'),
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
      form.setValue('userIds', []);
    }
  };

  const selectedUsers = form.watch('userIds');
  const availableUsers = usersData?.filter(
    (user: DropdownUser) => !selectedUsers.includes(user.id)
  );

  return (
    <AddModal
      title='Share Account'
      description='Share this account with other users. They will be able to view and manage transactions.'
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
              <FormItem>
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
            name='userIds'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Select Users</FormLabel>
                <FormControl>
                  <Select
                    onValueChange={(value) => {
                      if (!field.value.includes(value)) {
                        field.onChange([...field.value, value]);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Select users to share with' />
                    </SelectTrigger>
                    <SelectContent>
                      <ScrollArea className='h-72'>
                        {availableUsers?.map((user: DropdownUser) => (
                          <SelectItem key={user.id} value={user.id}>
                            <div className='flex items-center gap-2'>
                              <User className='h-4 w-4' />
                              <span>{user.name}</span>
                              <span className='text-muted-foreground'>({user.email})</span>
                            </div>
                          </SelectItem>
                        ))}
                      </ScrollArea>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {selectedUsers.length > 0 && (
            <div className='space-y-2'>
              <p className='text-sm font-medium'>Selected Users</p>
              <div className='flex flex-wrap gap-2'>
                {selectedUsers.map((userId: string) => {
                  const user = usersData?.find((u: DropdownUser) => u.id === userId);
                  return (
                    <Badge key={userId} variant='secondary' className='flex items-center gap-1'>
                      <User className='h-3 w-3' />
                      {user?.name}
                      <button
                        type='button'
                        onClick={() => {
                          form.setValue(
                            'userIds',
                            form.getValues('userIds').filter((id: string) => id !== userId)
                          );
                        }}
                        className='hover:text-destructive ml-1'
                      >
                        <X className='h-3 w-3' />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

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
