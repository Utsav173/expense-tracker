'use client';

import { useToast } from '@/lib/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';
import React, { useEffect, useState, useCallback, useMemo } from 'react'; // Added useMemo
import { authUpdateUser, authUpdateUserAiApiKey } from '@/lib/endpoints/auth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { fetchCurrencies, COMMON_CURRENCIES } from '@/lib/endpoints/currency';
import CurrencySelect from './currency-select';
import {
  Camera,
  Save,
  X,
  User as UserIcon,
  KeyRound,
  Trash2,
  Eye,
  EyeOff,
  BrainCircuit,
  Loader2,
  Check
} from 'lucide-react';
import { useInvalidateQueries } from '@/hooks/useInvalidateQueries';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';
import { Separator } from './separator';
import { Input } from './input';
import { Button } from './button';
import { Skeleton } from './skeleton';
import { PasswordInput } from './password-input';
import DeleteConfirmationModal from '../modals/delete-confirmation-modal';
import { Alert, AlertDescription, AlertTitle } from './alert';
// Import Form components
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Label } from './label';

const profileUpdateSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters.').max(64).trim(),
  preferredCurrency: z.string().length(3, 'Invalid currency.').optional(),
  profilePic: z.instanceof(File).optional().nullable()
});

type ProfileUpdateFormSchema = z.infer<typeof profileUpdateSchema>;

const UserProfile = () => {
  const { user, refetchUser, userIsLoading } = useAuth();
  const { showError, showSuccess } = useToast();
  const invalidate = useInvalidateQueries();

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isEditingApiKey, setIsEditingApiKey] = useState(false);
  const [isApiKeyRemoved, setIsApiKeyRemoved] = useState(false);
  const [isRemoveKeyConfirmOpen, setIsRemoveKeyConfirmOpen] = useState(false);

  // FIX: Use useMemo import
  const hasAiApiKey = useMemo(
    () => user?.hasAiApiKey && !isApiKeyRemoved,
    [user?.hasAiApiKey, isApiKeyRemoved]
  );

  const profileForm = useForm<ProfileUpdateFormSchema>({
    resolver: zodResolver(profileUpdateSchema),
    mode: 'onChange'
  });

  const updateApiKeyMutation = useMutation({
    mutationFn: (apiKeyData: string | null) => authUpdateUserAiApiKey(apiKeyData), // FIX: Correct variable name
    onSuccess: async (data, variables) => {
      await invalidate(['user']);
      refetchUser?.();
      showSuccess(data?.message || 'AI API Key updated!');
      setIsEditingApiKey(false);
      setApiKeyInput('');
      setIsApiKeyRemoved(variables === null);
    },
    onError: (error: any) => {
      showError(error.message || 'Failed to update AI API Key.');
    }
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: FormData) => authUpdateUser(data),
    onSuccess: async () => {
      await invalidate(['user']);
      refetchUser?.();
      showSuccess('Profile updated successfully!');
      setIsEditingProfile(false);
      setPreviewUrl(null);
    },
    onError: (error: any) => {
      showError(error.message || 'Failed to update profile.');
    }
  });

  const { data: currencies, isLoading: isLoadingCurrencies } = useQuery({
    queryKey: ['currencies'],
    queryFn: fetchCurrencies,
    staleTime: Infinity,
    placeholderData: Object.entries(COMMON_CURRENCIES).map(([code, name]) => ({ code, name }))
  });

  useEffect(() => {
    if (user) {
      profileForm.reset({
        name: user.name || '',
        preferredCurrency: user.preferredCurrency || 'INR',
        profilePic: undefined
      });
      setIsApiKeyRemoved(false);
    }
  }, [user, profileForm.reset]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleProfileFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      profileForm.setValue('profilePic', file, { shouldDirty: true });
      const url = URL.createObjectURL(file);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(url);
    }
  };

  const handleProfileCancel = () => {
    profileForm.reset({
      name: user?.name || '',
      preferredCurrency: user?.preferredCurrency || 'INR',
      profilePic: undefined
    });
    setIsEditingProfile(false);
    setPreviewUrl(null);
  };

  const onProfileSubmit = (data: ProfileUpdateFormSchema) => {
    const formData = new FormData();
    formData.append('name', data.name);
    if (data.preferredCurrency) {
      formData.append('preferredCurrency', data.preferredCurrency);
    }
    if (data.profilePic instanceof File) {
      formData.append('profilePic', data.profilePic);
    } else if (data.profilePic === null) {
      // Optional: Handle explicit null if needed by backend
    }
    updateProfileMutation.mutate(formData);
  };

  const handleSaveApiKey = () => {
    if (!apiKeyInput.trim()) {
      showError('API Key cannot be empty.');
      return;
    }
    updateApiKeyMutation.mutate(apiKeyInput);
  };

  const handleRemoveApiKey = () => {
    updateApiKeyMutation.mutate(null);
    setIsRemoveKeyConfirmOpen(false);
  };

  if (userIsLoading) {
    return (
      <div className='mx-auto flex max-w-2xl justify-center p-4 md:p-8'>
        <Card className='w-full'>
          <CardHeader>
            <Skeleton className='h-8 w-48' />
          </CardHeader>
          <CardContent className='space-y-6'>
            <div className='flex items-center gap-4'>
              <Skeleton className='h-20 w-20 rounded-full' />
              <div className='space-y-2'>
                <Skeleton className='h-6 w-40' />
                <Skeleton className='h-4 w-60' />
              </div>
            </div>
            <Skeleton className='h-10 w-full' />
            <Skeleton className='h-10 w-full' />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className='mx-auto flex max-w-2xl justify-center p-4 md:p-8'>
        <Card className='w-full p-8 text-center'>
          <p className='text-muted-foreground'>User not found. Please log in again.</p>
        </Card>
      </div>
    );
  }

  const isProfileSubmitting = updateProfileMutation.isPending;
  const isApiKeySubmitting = updateApiKeyMutation.isPending;

  return (
    <div className='z-10 mx-auto flex max-w-2xl justify-center p-4 md:p-8'>
      <Card className='w-full'>
        <CardHeader>
          <CardTitle className='text-2xl'>User Profile</CardTitle>
          <CardDescription>Manage your personal information and settings.</CardDescription>
        </CardHeader>
        <CardContent className='space-y-8'>
          <section className='space-y-4'>
            <h3 className='mb-4 border-b pb-2 text-lg font-semibold'>Personal Information</h3>
            <div className='flex flex-col items-center gap-4 sm:flex-row sm:items-start'>
              <div className='relative shrink-0'>
                <Avatar className='h-24 w-24 border'>
                  <AvatarImage
                    src={previewUrl || user.profilePic || undefined}
                    alt={user.name}
                    className='object-cover'
                  />
                  <AvatarFallback className='text-3xl uppercase'>
                    {user.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                {isEditingProfile && (
                  <label
                    htmlFor='profile-upload'
                    className='bg-background hover:bg-accent absolute -right-1 -bottom-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border shadow-sm transition-colors'
                  >
                    <Camera size={16} className='text-muted-foreground' />
                    <input
                      id='profile-upload'
                      type='file'
                      onChange={handleProfileFileChange}
                      accept='image/*'
                      className='sr-only'
                      disabled={isProfileSubmitting}
                    />
                  </label>
                )}
              </div>
              <div className='flex-1 text-center sm:text-left'>
                {/* FIX: Use Form component */}
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className='space-y-4'>
                    {/* FIX: Use FormField */}
                    <FormField
                      control={profileForm.control}
                      name='name'
                      render={({ field }) => (
                        // FIX: Use FormItem
                        <FormItem>
                          {/* FIX: Use FormLabel */}
                          <FormLabel>Full Name</FormLabel>
                          {/* FIX: Use FormControl */}
                          <FormControl>
                            <Input
                              placeholder='Your Name'
                              {...field}
                              disabled={!isEditingProfile || isProfileSubmitting}
                            />
                          </FormControl>
                          {/* FIX: Use FormMessage */}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className='space-y-1'>
                      {/* FIX: Use Label */}
                      <Label className='text-sm'>Email</Label>
                      <Input
                        value={user.email}
                        readOnly
                        disabled
                        className='bg-muted/50 cursor-not-allowed opacity-70'
                      />
                    </div>
                    {/* FIX: Use FormField */}
                    <FormField
                      control={profileForm.control}
                      name='preferredCurrency'
                      render={({ field }) => (
                        // FIX: Use FormItem
                        <FormItem>
                          {/* FIX: Use FormLabel */}
                          <FormLabel>Preferred Currency</FormLabel>
                          <CurrencySelect
                            currencies={currencies}
                            value={field.value ?? undefined} // Handle potential null value
                            onValueChange={field.onChange}
                            isLoading={isLoadingCurrencies}
                            disabled={!isEditingProfile || isProfileSubmitting}
                          />
                          {/* FIX: Use FormMessage */}
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {isEditingProfile && (
                      <div className='flex justify-end gap-2 pt-2'>
                        <Button
                          type='button'
                          variant='ghost'
                          onClick={handleProfileCancel}
                          disabled={isProfileSubmitting}
                        >
                          Cancel
                        </Button>
                        <Button
                          type='submit'
                          disabled={
                            isProfileSubmitting ||
                            !profileForm.formState.isDirty ||
                            !profileForm.formState.isValid
                          }
                        >
                          {isProfileSubmitting ? (
                            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                          ) : (
                            <Save className='mr-2 h-4 w-4' />
                          )}
                          Save Profile
                        </Button>
                      </div>
                    )}
                  </form>
                </Form>
                {!isEditingProfile && (
                  <div className='flex justify-end pt-4'>
                    <Button variant='outline' onClick={() => setIsEditingProfile(true)} size='sm'>
                      <UserIcon size={16} className='mr-2' /> Edit Profile
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </section>

          <Separator />

          <section className='space-y-4'>
            <h3 className='mb-4 flex items-center gap-2 border-b pb-2 text-lg font-semibold'>
              <BrainCircuit className='text-primary h-5 w-5' />
              AI Assistant Settings
            </h3>

            <Alert variant='default' className='bg-muted/50'>
              <KeyRound className='h-4 w-4' />
              <AlertTitle>API Key Security</AlertTitle>
              <AlertDescription className='text-xs'>
                Your AI API key is stored securely encrypted in our database. It is only decrypted
                temporarily on the server when you use the AI Assistant.
              </AlertDescription>
            </Alert>

            {hasAiApiKey && !isEditingApiKey && (
              <div className='space-y-2'>
                {/* FIX: Use Label */}
                <Label>Your AI API Key</Label>
                <div className='flex items-center gap-2'>
                  <PasswordInput
                    value='••••••••••••••••••••••••••'
                    readOnly
                    disabled
                    className='bg-muted/50 flex-1 cursor-not-allowed opacity-70'
                  />
                  <Button variant='outline' size='sm' onClick={() => setIsEditingApiKey(true)}>
                    Replace
                  </Button>
                  <Button
                    variant='destructive'
                    size='sm'
                    onClick={() => setIsRemoveKeyConfirmOpen(true)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            )}

            {(!hasAiApiKey || isEditingApiKey) && (
              <div className='space-y-2'>
                {/* FIX: Use Label */}
                <Label htmlFor='ai-api-key'>Enter your Google AI API Key</Label>
                <PasswordInput
                  id='ai-api-key'
                  placeholder='Enter your AI API Key (e.g., AIza...)'
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  disabled={isApiKeySubmitting}
                  autoComplete='off'
                />
                <p className='text-muted-foreground text-xs'>
                  Get your key from{' '}
                  <a
                    href='https://aistudio.google.com/app/apikey'
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-primary hover:text-primary/80 underline'
                  >
                    Google AI Studio
                  </a>
                  .
                </p>
                <div className='flex justify-end gap-2 pt-2'>
                  {isEditingApiKey && (
                    <Button
                      type='button'
                      variant='ghost'
                      onClick={() => {
                        setIsEditingApiKey(false);
                        setApiKeyInput('');
                      }}
                      disabled={isApiKeySubmitting}
                    >
                      Cancel
                    </Button>
                  )}
                  <Button
                    type='button'
                    onClick={handleSaveApiKey}
                    disabled={isApiKeySubmitting || !apiKeyInput.trim()}
                  >
                    {isApiKeySubmitting ? (
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    ) : (
                      <Save className='mr-2 h-4 w-4' />
                    )}
                    {isEditingApiKey ? 'Replace Key' : 'Save Key'}
                  </Button>
                </div>
              </div>
            )}
          </section>
        </CardContent>
      </Card>

      <DeleteConfirmationModal
        title='Remove AI API Key'
        description='Are you sure you want to remove your AI API Key? You will need to add it again to use the AI Assistant.'
        onConfirm={handleRemoveApiKey}
        open={isRemoveKeyConfirmOpen}
        onOpenChange={setIsRemoveKeyConfirmOpen}
      />
    </div>
  );
};

export default UserProfile;
