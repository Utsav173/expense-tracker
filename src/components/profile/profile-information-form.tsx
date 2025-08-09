'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useToast } from '@/lib/hooks/useToast';
import { useInvalidateQueries } from '@/hooks/useInvalidateQueries';
import { useAuth } from '@/components/providers/auth-provider';
import { authUpdateUser, UpdateUserBody } from '@/lib/endpoints/auth';
import { fetchCurrencies, COMMON_CURRENCIES } from '@/lib/endpoints/currency';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import CurrencySelect from '../ui/currency-select';
import { Loader2, Camera, Edit3, X, Save } from 'lucide-react';
import { Label } from '../ui/label';

const profileUpdateSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters.').max(64).trim(),
  preferredCurrency: z.string().optional().or(z.literal('')),
  image: z.instanceof(File).optional().nullable()
});

type ProfileUpdateFormSchema = z.infer<typeof profileUpdateSchema>;

export const ProfileInformationForm = () => {
  const { session, isLoading: userIsLoading } = useAuth();
  const user = session?.user;
  const { showError, showSuccess } = useToast();
  const invalidate = useInvalidateQueries();
  const [isEditing, setIsEditing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const form = useForm<ProfileUpdateFormSchema>({
    resolver: zodResolver(profileUpdateSchema),
    mode: 'onChange'
  });

  const { data: currencies, isLoading: isLoadingCurrencies } = useQuery({
    queryKey: ['currencies'],
    queryFn: fetchCurrencies,
    staleTime: Infinity,
    placeholderData: Object.entries(COMMON_CURRENCIES).map(([code, name]) => ({ code, name }))
  });

  const mutation = useMutation({
    mutationFn: (data: UpdateUserBody) => authUpdateUser(data),
    onSuccess: async () => {
      await invalidate(['user']);
      setIsEditing(false);
      setPreviewUrl(null);
      showSuccess('Profile updated successfully!');
    },
    onError: (error: any) => showError(error.message || 'Failed to update profile.')
  });

  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name || '',
        preferredCurrency: user.preferredCurrency || 'INR',
        image: undefined
      });
    }
  }, [user, form, isEditing]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showError('Profile picture must be less than 5MB');
        return;
      }
      form.setValue('image', file, { shouldDirty: true });
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setPreviewUrl(null);
    form.reset();
  };

  const onSubmit = (data: ProfileUpdateFormSchema) => {
    mutation.mutate(data);
  };

  if (!user) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personal Information</CardTitle>
        <CardDescription>Update your personal details and profile picture.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
            <div className='flex items-center gap-6'>
              <div className='relative'>
                <Avatar className='h-24 w-24 border'>
                  <AvatarImage src={previewUrl || user.image || undefined} alt={user.name} />
                  <AvatarFallback>{user.name?.charAt(0)?.toUpperCase()}</AvatarFallback>
                </Avatar>
                {isEditing && (
                  <label
                    htmlFor='profile-upload'
                    className='bg-primary text-primary-foreground absolute -right-2 -bottom-2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full transition-transform hover:scale-110'
                  >
                    <Camera className='h-4 w-4' />
                    <input
                      id='profile-upload'
                      type='file'
                      onChange={handleFileChange}
                      className='hidden'
                    />
                  </label>
                )}
              </div>
              <div className='flex items-center gap-2'>
                {!isEditing && (
                  <Button variant='outline' onClick={() => setIsEditing(true)}>
                    <Edit3 className='mr-2 h-4 w-4' /> Edit Profile
                  </Button>
                )}
              </div>
            </div>

            <div className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Your name'
                        {...field}
                        disabled={!isEditing || mutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className='space-y-2'>
                <Label>Email Address</Label>
                <Input value={user.email} readOnly disabled className='cursor-not-allowed' />
              </div>
            </div>
            <FormField
              control={form.control}
              name='preferredCurrency'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred Currency</FormLabel>
                  <CurrencySelect
                    currencies={currencies}
                    value={field.value ?? undefined}
                    onValueChange={field.onChange}
                    isLoading={isLoadingCurrencies}
                    disabled={!isEditing || mutation.isPending}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            {isEditing && (
              <div className='flex justify-end gap-2 border-t pt-6'>
                <Button
                  type='button'
                  variant='ghost'
                  onClick={handleCancel}
                  disabled={mutation.isPending}
                >
                  <X className='mr-2 h-4 w-4' /> Cancel
                </Button>
                <Button type='submit' disabled={mutation.isPending || !form.formState.isDirty}>
                  {mutation.isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                  <Save className='mr-2 h-4 w-4' /> Save Changes
                </Button>
              </div>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
