'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/lib/hooks/useToast';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import AddModal from './add-modal';
import { accountShare } from '@/lib/endpoints/accounts';
import { useQuery } from '@tanstack/react-query';
import { accountGetDropdown } from '@/lib/endpoints/accounts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

const shareAccountSchema = z.object({
  accountId: z.string().uuid(),
  userId: z.string().uuid()
});

type ShareAccountFormSchema = z.infer<typeof shareAccountSchema>;

const ShareAccountModal = () => {
  const [isOpen, setIsOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue
  } = useForm<ShareAccountFormSchema>({
    resolver: zodResolver(shareAccountSchema)
  });

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['userDropdown'],
    queryFn: accountGetDropdown
  });

  const { showError } = useToast();

  const handleShareAccount = async (data: ShareAccountFormSchema) => {
    try {
      await accountShare(data, 'Account shared successfully!', 'Failed to share account.');
      setIsOpen(false);
      reset();
    } catch (error: any) {
      showError(error.message);
    }
  };

  return (
    <AddModal
      title='Share Account'
      description='Share an account with another user.'
      triggerButton={<Button>Share Account</Button>}
      isOpen={isOpen}
      onOpenChange={setIsOpen}
    >
      <form onSubmit={handleSubmit(handleShareAccount)} className='space-y-4'>
        <div>
          <label htmlFor='accountId' className='block text-sm font-medium text-gray-700'>
            Account ID
          </label>
          <Input
            id='accountId'
            type='text'
            placeholder='Enter account ID'
            {...register('accountId')}
            className='w-full'
          />
          {errors.accountId && (
            <p className='mt-1 text-sm text-red-500'>{errors.accountId.message}</p>
          )}
        </div>
        <div>
          <label htmlFor='userId'>User ID</label>

          <Select onValueChange={(value) => setValue('userId', value)}>
            <SelectTrigger id='userId' className='w-full'>
              <SelectValue placeholder={isLoading ? 'Loading accounts...' : 'Select account'} />
            </SelectTrigger>
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

          {errors.userId && <p className='mt-1 text-sm text-red-500'>{errors.userId.message}</p>}
        </div>

        <Button type='submit' className='w-full' disabled={isSubmitting}>
          {isSubmitting ? 'Sharing...' : 'Share Account'}
        </Button>
      </form>
    </AddModal>
  );
};

export default ShareAccountModal;
