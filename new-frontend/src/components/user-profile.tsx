'use client';

import { useToast } from '@/lib/hooks/useToast';
import { useAuth } from '@/lib/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Separator } from './ui/separator';
import { Button } from './ui/button';
import { useState } from 'react';
import { authUpdateUser } from '@/lib/endpoints/auth';
import { Input } from './ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

const UserProfile = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { user, logoutAction } = useAuth();
  const { showError, showSuccess } = useToast();
  const [isEdit, setIsEdit] = useState(false);
  const queryClient = useQueryClient();
  const schema = z.object({
    preferredCurrency: z.string().optional(),
    name: z.string().min(3).max(64),
    profilePic: z.any().optional()
  });

  type Type = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors }
  } = useForm<Type>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: user?.name,
      preferredCurrency: user?.preferredCurrency,
      profilePic: null
    }
  });
  const profilePic = watch('profilePic');
  const handleSubmitPreference = async (data: Type) => {
    try {
      setIsLoading(true);
      const formData = new FormData();
      if (user?.name !== data.name) formData.append('name', data.name as string);

      if (user?.preferredCurrency !== data?.preferredCurrency) {
        formData.append('preferredCurrency', data.preferredCurrency as string);
      }
      if (data?.profilePic) formData.append('profilePic', data.profilePic as File);
      if (formData.entries().next().value) {
        await authUpdateUser(
          formData,
          'Profile information Updated!  ',
          ' could not perform operation , profile updation '
        );
      }

      queryClient.invalidateQueries({ queryKey: ['user'] }); // invalidate
      showSuccess('User profile has been updated!');
      setIsEdit(false);
    } catch (e: any) {
      showError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setValue('profilePic', file);
  };
  const handleCancel = () => {
    reset({ preferredCurrency: user?.preferredCurrency, name: user?.name, profilePic: null });
    setIsEdit(false);
  };

  if (!user) {
    return <div>No user information or Session not found please login </div>;
  }

  return (
    <Card className='w-full rounded-md bg-white shadow-md'>
      <CardHeader className='p-6'>
        <CardTitle className='text-center text-xl font-bold tracking-wide text-gray-700'>
          Profile{' '}
        </CardTitle>

        <Separator className='mt-2' />
      </CardHeader>

      <CardContent className='pb-4'>
        <div className='flex items-center gap-6 pb-8'>
          <Avatar>
            {user.profilePic ? (
              <AvatarImage src={user.profilePic} alt='user-image' />
            ) : (
              <AvatarFallback className='bg-gray-300 uppercase'>
                {user.name[0]} {user.name[1]}{' '}
              </AvatarFallback>
            )}
          </Avatar>

          <div>
            <h2 className='text-xl font-medium'> {user.name} </h2>
            <p className='text-sm text-muted-foreground'> {user.email} </p>
          </div>
        </div>

        {isEdit ? (
          <form onSubmit={handleSubmit(handleSubmitPreference)} className='space-y-4'>
            <div className='mb-2'>
              <Input type='text' placeholder='User Name' {...register('name')} className='w-full' />
              {errors.name && <p className='mt-1 text-sm text-red-500'> {errors.name.message} </p>}
            </div>
            <div className='mb-2'>
              <Input
                type='text'
                placeholder='Currency '
                {...register('preferredCurrency')}
                className='w-full'
              />
            </div>

            <div className='mt-2'>
              <Input type='file' onChange={handleFileChange} accept='image/*' className='w-full' />
            </div>

            <div className='mt-6 flex items-center justify-end gap-3'>
              <Button size='sm' type='submit' disabled={isLoading}>
                {' '}
                save Changes
              </Button>
              <Button variant='outline' type='button' size='sm' onClick={handleCancel}>
                {' '}
                cancel{' '}
              </Button>
            </div>
          </form>
        ) : (
          <div className='mt-4 flex items-center justify-end gap-2'>
            <p className='text-sm text-muted-foreground'>
              {' '}
              currency:
              <span className='font-medium text-foreground'> {user.preferredCurrency} </span>{' '}
            </p>

            <Button variant='outline' onClick={() => setIsEdit(true)} size='sm'>
              Edit profile
            </Button>
          </div>
        )}
        <Separator className='mt-2' />

        <div className='mt-6'>
          <Button onClick={logoutAction} size='sm'>
            {' '}
            Logout{' '}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserProfile;
