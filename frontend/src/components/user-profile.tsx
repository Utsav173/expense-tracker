'use client';

import { useToast } from '@/lib/hooks/useToast';
import { useAuth } from '@/lib/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Separator } from './ui/separator';
import { Button } from './ui/button';
import { useEffect, useState } from 'react';
import { authUpdateUser } from '@/lib/endpoints/auth';
import { Input } from './ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { fetchCurrencies, COMMON_CURRENCIES } from '@/lib/endpoints/currency';
import { useQuery } from '@tanstack/react-query';
import CurrencySelect from './currency-select';
import { Camera, Save, X, User as UserIcon } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useInvalidateQueries } from '@/hooks/useInvalidateQueries';

const PixelCanvas = dynamic(() => import('./ui/pixel-canvas').then((mod) => mod.PixelCanvas), {
  ssr: false
});

const UserProfile = () => {
  const { user, refetchUser } = useAuth();
  const { showError, showSuccess } = useToast();
  const [isEdit, setIsEdit] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const invalidate = useInvalidateQueries();

  const schema = z.object({
    name: z.string().min(3).max(64),
    preferredCurrency: z.string().optional(),
    profilePic: z.instanceof(File).optional()
  });

  type FormSchema = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<FormSchema>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: user?.name,
      preferredCurrency: user?.preferredCurrency,
      profilePic: undefined
    }
  });

  watch('profilePic');

  const updateUserMutation = useMutation({
    mutationFn: (data: FormData) =>
      authUpdateUser(
        data,
        'Profile information Updated!',
        'Could not perform operation, profile update failed'
      ),
    onSuccess: async () => {
      await invalidate(['user']);
      refetchUser && refetchUser();
      showSuccess('User profile has been updated!');
      setIsEdit(false);
      setPreviewUrl(null);
    },
    onError: (error: any) => {
      showError(error.message);
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setValue('profilePic', file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleCancel = () => {
    reset({
      name: user?.name,
      preferredCurrency: user?.preferredCurrency
    });
    setIsEdit(false);
    setPreviewUrl(null);
  };

  const { data: currencies, isLoading: isLoadingCurrencies } = useQuery({
    queryKey: ['currencies'],
    queryFn: fetchCurrencies,
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 7 * 24 * 60 * 60 * 1000,
    retry: 2,
    placeholderData: Object.entries(COMMON_CURRENCIES).map(([code, name]) => ({
      code,
      name
    }))
  });

  const onSubmit = (data: FormSchema) => {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('preferredCurrency', data.preferredCurrency || '');
    if (data.profilePic) {
      formData.append('profilePic', data.profilePic);
    }

    updateUserMutation.mutate(formData);
  };

  useEffect(() => {
    reset({
      name: user?.name,
      preferredCurrency: user?.preferredCurrency
    });
  }, [user, reset]);

  // Cleanup preview URL when component unmounts
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  if (!user) {
    return (
      <Card className='w-full rounded-lg border-none bg-white shadow-md md:w-[450px]'>
        <CardContent className='flex h-48 items-center justify-center'>
          <p className='text-center text-gray-500'>No user information found. Please log in.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='z-10 w-full rounded-lg border border-gray-100 bg-white shadow-md md:w-[450px]'>
      <CardHeader className='relative bg-blue-600 p-6'>
        <CardTitle className='text-center text-xl font-bold tracking-wide text-white'>
          User Profile
        </CardTitle>
        <PixelCanvas
          gap={10}
          speed={25}
          colors={['#e0f2fe', '#7dd3fc', '#0ea5e9']}
          variant='icon'
        />
      </CardHeader>

      <CardContent className='p-6'>
        <div className='mb-8 flex flex-col items-center gap-4 pt-4 sm:flex-row sm:gap-6'>
          <div className='relative'>
            <Avatar className='h-20 w-20 border-4 border-white shadow-md'>
              {previewUrl ? (
                <AvatarImage src={previewUrl} alt='preview' className='object-cover' />
              ) : user.profilePic ? (
                <AvatarImage src={user.profilePic} alt='user-image' className='object-cover' />
              ) : (
                <AvatarFallback className='bg-blue-500 text-xl uppercase text-white'>
                  {user.name?.charAt(0) || 'U'}
                </AvatarFallback>
              )}
            </Avatar>

            {isEdit && (
              <label
                htmlFor='profile-upload'
                className='absolute -bottom-2 -right-2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-blue-500 text-white shadow-md transition-all hover:bg-blue-600'
              >
                <Camera size={16} />
                <input
                  id='profile-upload'
                  type='file'
                  onChange={handleFileChange}
                  accept='image/*'
                  className='hidden'
                />
              </label>
            )}
          </div>

          <div className='text-center sm:text-left'>
            <h2 className='text-2xl font-semibold text-gray-800'>{user.name}</h2>
            <p className='text-sm text-gray-500'>{user.email}</p>
            {!isEdit && (
              <div className='mt-2 flex items-center justify-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600 sm:justify-start'>
                <span>Preferred currency:</span>
                <span className='font-medium'>{user.preferredCurrency || 'Not set'}</span>
              </div>
            )}
          </div>
        </div>

        <Separator className='my-4' />

        {isEdit ? (
          <form onSubmit={handleSubmit(onSubmit)} className='space-y-4 pt-2'>
            <div>
              <label htmlFor='name' className='mb-1 block text-sm font-medium text-gray-700'>
                Full Name
              </label>
              <Input
                id='name'
                type='text'
                placeholder='Your Name'
                {...register('name')}
                className='w-full rounded-md border-gray-200 focus:border-blue-500 focus:ring-blue-500'
              />
              {errors.name && <p className='mt-1 text-sm text-red-500'>{errors.name.message}</p>}
            </div>

            <div>
              <label htmlFor='currency' className='mb-1 block text-sm font-medium text-gray-700'>
                Preferred Currency
              </label>
              <CurrencySelect
                currencies={currencies}
                value={watch('preferredCurrency')}
                onValueChange={(value) => setValue('preferredCurrency', value)}
                isLoading={isLoadingCurrencies}
              />
            </div>

            <div className='mt-6 flex items-center justify-end gap-3'>
              <Button
                size='sm'
                type='submit'
                disabled={isSubmitting}
                className='flex items-center gap-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300'
              >
                <Save size={16} />
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                variant='outline'
                type='button'
                size='sm'
                onClick={handleCancel}
                className='flex items-center gap-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
              >
                <X size={16} />
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <div className='flex justify-end py-2'>
            <Button
              variant='outline'
              onClick={() => setIsEdit(true)}
              size='sm'
              className='flex items-center gap-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            >
              <UserIcon size={16} />
              Edit Profile
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserProfile;
