'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/lib/hooks/useToast';
import { Button } from '../ui/button';
import AddModal from './add-modal';
import { accountShare, usersGetDropdown } from '@/lib/endpoints/accounts';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accountGetDropdown } from '@/lib/endpoints/accounts';
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

const shareAccountSchema = z.object({
  accountId: z.string().uuid(),
  userIds: z.array(z.string().uuid()).min(1, 'Please select at least one user') // Changed to array
});

type ShareAccountFormSchema = z.infer<typeof shareAccountSchema>;

const ShareAccountModal = ({ accountId }: { accountId: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<ShareAccountFormSchema>({
    resolver: zodResolver(shareAccountSchema),
    defaultValues: {
      accountId: accountId,
      userIds: [] // Initialize as an empty array
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      showSuccess('Account shared successfully!');
      setIsOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      showError(error.message);
    }
  });

  const handleShareAccount = async (data: ShareAccountFormSchema) => {
    // Backend expects a single object with accountId and userIds (array)
    await shareAccountMutation.mutate(data);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);

    if (open) {
      form.reset();
      form.setValue('accountId', accountId);
      form.setValue('userIds', []); // Reset selected users on open
    }
  };

  return (
    <AddModal
      title='Share Account'
      description='Share an account with other users.'
      triggerButton={<Button>Share Account</Button>}
      isOpen={isOpen}
      onOpenChange={handleOpenChange}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleShareAccount)} className='space-y-4'>
          <div>
            <label htmlFor='accountId' className='block text-sm font-medium text-gray-700'>
              Account ID
            </label>
            <Input
              id='accountId'
              type='text'
              placeholder='Enter account ID'
              {...form.register('accountId')}
              className='w-full'
              disabled
            />
            {form.formState.errors.accountId && (
              <p className='mt-1 text-sm text-red-500'>{form.formState.errors.accountId.message}</p>
            )}
          </div>
          <div>
            <FormField
              control={form.control}
              name='userIds'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Users</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value?.join(',')} // Join for display, split on submit
                  >
                    <FormControl>
                      <SelectTrigger className='w-full'>
                        <SelectValue
                          placeholder={isLoading ? 'Loading users...' : 'Select Users'}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {usersData && usersData.length > 0 ? (
                        usersData.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value='no-user' disabled>
                          No user found
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button type='submit' className='w-full' disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Sharing...' : 'Share Account'}
          </Button>
        </form>
      </Form>
    </AddModal>
  );
};

export default ShareAccountModal;
