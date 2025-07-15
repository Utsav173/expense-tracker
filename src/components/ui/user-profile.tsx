'use client';

import { useToast } from '@/lib/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';
import React, { useEffect, useState, useMemo } from 'react';
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
  Trash2,
  BrainCircuit,
  Loader2,
  Check,
  Edit3,
  Shield,
  ExternalLink
} from 'lucide-react';
import { useInvalidateQueries } from '@/hooks/useInvalidateQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';
import { Input } from './input';
import { Button } from './button';
import { Skeleton } from './skeleton';
import { PasswordInput } from './password-input';
import DeleteConfirmationModal from '../modals/delete-confirmation-modal';
import { Alert, AlertDescription, AlertTitle } from './alert';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Label } from './label';
import { Badge } from './badge';

const profileUpdateSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters.').max(64).trim(),
  preferredCurrency: z.string().optional().or(z.literal('')),
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

  const hasAiApiKey = useMemo(
    () => user?.hasAiApiKey && !isApiKeyRemoved,
    [user?.hasAiApiKey, isApiKeyRemoved]
  );

  const profileForm = useForm<ProfileUpdateFormSchema>({
    resolver: zodResolver(profileUpdateSchema),
    mode: 'onChange'
  });

  const updateApiKeyMutation = useMutation({
    mutationFn: (apiKeyData: string | null) => authUpdateUserAiApiKey(apiKeyData),
    onSuccess: async (data, variables) => {
      await invalidate(['user']);
      refetchUser?.();
      showSuccess(data?.message || 'AI API Key updated successfully!');
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
  }, [user, profileForm]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleProfileFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showError('Profile picture must be less than 5MB');
        return;
      }

      if (!file.type.startsWith('image/')) {
        showError('Please select a valid image file');
        return;
      }

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
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const onProfileSubmit = (data: ProfileUpdateFormSchema) => {
    const formData = new FormData();
    formData.append('name', data.name);
    if (data.preferredCurrency) {
      formData.append('preferredCurrency', data.preferredCurrency);
    }
    if (data.profilePic instanceof File) {
      formData.append('profilePic', data.profilePic);
    }
    updateProfileMutation.mutate(formData);
  };

  const handleSaveApiKey = () => {
    const trimmedKey = apiKeyInput.trim();
    if (!trimmedKey) {
      showError('API Key cannot be empty.');
      return;
    }

    if (!trimmedKey.startsWith('AIza') && !trimmedKey.startsWith('AIza')) {
      showError('Please enter a valid Google AI API Key (should start with "AIza").');
      return;
    }

    updateApiKeyMutation.mutate(trimmedKey);
  };

  const handleRemoveApiKey = () => {
    updateApiKeyMutation.mutate(null);
    setIsRemoveKeyConfirmOpen(false);
  };

  const handleCancelApiKeyEdit = () => {
    setIsEditingApiKey(false);
    setApiKeyInput('');
  };

  if (userIsLoading) {
    return (
      <div className='mx-auto max-w-4xl p-4 max-sm:p-1 md:p-8'>
        <div className='grid gap-6 md:grid-cols-1'>
          <Card className='w-full'>
            <CardHeader>
              <Skeleton className='h-8 w-48' />
              <Skeleton className='h-4 w-64' />
            </CardHeader>
            <CardContent className='space-y-8'>
              <div className='flex items-center gap-6'>
                <Skeleton className='h-24 w-24 rounded-full' />
                <div className='flex-1 space-y-4'>
                  <Skeleton className='h-10 w-full' />
                  <Skeleton className='h-10 w-full' />
                  <Skeleton className='h-10 w-2/3' />
                </div>
              </div>
              <div className='space-y-4'>
                <Skeleton className='h-6 w-32' />
                <Skeleton className='h-20 w-full' />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className='mx-auto max-w-4xl p-4 max-sm:p-1 md:p-8'>
        <Card className='w-full'>
          <CardContent className='p-8 text-center'>
            <div className='space-y-4'>
              <UserIcon className='text-muted-foreground mx-auto h-12 w-12' />
              <div>
                <h3 className='text-lg font-semibold'>User Not Found</h3>
                <p className='text-muted-foreground'>Please log in again to access your profile.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isProfileSubmitting = updateProfileMutation.isPending;
  const isApiKeySubmitting = updateApiKeyMutation.isPending;

  return (
    <div className='mx-auto max-w-4xl p-4 max-sm:p-1 md:p-8'>
      <div className='space-y-8'>
        {/* Header */}
        <div className='space-y-2 text-center'>
          <h1 className='text-3xl font-bold tracking-tight'>Profile Settings</h1>
          <p className='text-muted-foreground'>
            Manage your personal information and AI assistant preferences
          </p>
        </div>

        {/* Profile Information Card */}
        <Card>
          <CardHeader className='pb-6'>
            <div className='flex items-center justify-between max-sm:flex-col max-sm:gap-2'>
              <div className='max-sm:space-y-2'>
                <CardTitle className='flex items-center gap-2 max-sm:mx-auto max-sm:w-fit'>
                  <UserIcon className='h-5 w-5' />
                  Profile Information
                </CardTitle>
                <CardDescription className='max-sm:text-center'>
                  Update your personal details and profile picture
                </CardDescription>
              </div>
              {!isEditingProfile && (
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setIsEditingProfile(true)}
                  className='shrink-0'
                >
                  <Edit3 className='mr-2 h-4 w-4' />
                  Edit Profile
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Form {...profileForm}>
              <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className='space-y-6'>
                {/* Profile Picture Section */}
                <div className='flex flex-col items-start gap-6 sm:flex-row'>
                  <div className='flex flex-col items-center gap-3'>
                    <div className='relative'>
                      <Avatar className='h-24 w-24 border-2'>
                        <AvatarImage
                          src={previewUrl || user.profilePic || undefined}
                          alt={user.name}
                          className='object-cover'
                        />
                        <AvatarFallback className='text-2xl font-semibold'>
                          {user.name?.charAt(0)?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      {isEditingProfile && (
                        <label
                          htmlFor='profile-upload'
                          className='bg-background hover:bg-accent absolute -right-2 -bottom-2 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-2 shadow-lg transition-colors'
                        >
                          <Camera className='text-muted-foreground h-4 w-4' />
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
                    {isEditingProfile && (
                      <p className='text-muted-foreground max-w-32 text-center text-xs'>
                        Click the camera icon to change your profile picture
                      </p>
                    )}
                  </div>

                  {/* Form Fields */}
                  <div className='w-full flex-1 space-y-4'>
                    <FormField
                      control={profileForm.control}
                      name='name'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder='Enter your full name'
                              {...field}
                              disabled={!isEditingProfile || isProfileSubmitting}
                              className={!isEditingProfile ? 'bg-muted/50' : ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className='space-y-2'>
                      <Label className='text-sm font-medium'>Email Address</Label>
                      <div className='flex items-center gap-2'>
                        <Input
                          value={user.email}
                          readOnly
                          disabled
                          className='bg-muted/50 flex-1 cursor-not-allowed opacity-70'
                        />
                        <Badge variant='secondary' className='shrink-0'>
                          Verified
                        </Badge>
                      </div>
                      <p className='text-muted-foreground text-xs'>
                        Email cannot be changed. Contact support if needed.
                      </p>
                    </div>

                    <FormField
                      control={profileForm.control}
                      name='preferredCurrency'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preferred Currency</FormLabel>
                          <CurrencySelect
                            currencies={currencies}
                            value={field.value ?? undefined}
                            onValueChange={field.onChange}
                            isLoading={isLoadingCurrencies}
                            disabled={!isEditingProfile || isProfileSubmitting}
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                {isEditingProfile && (
                  <div className='flex justify-end gap-3 border-t pt-4'>
                    <Button
                      type='button'
                      variant='outline'
                      onClick={handleProfileCancel}
                      disabled={isProfileSubmitting}
                    >
                      <X className='mr-2 h-4 w-4' />
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
                      Save Changes
                    </Button>
                  </div>
                )}
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* AI Assistant Settings Card */}
        <Card>
          <CardHeader className='pb-6'>
            <CardTitle className='flex items-center gap-2'>
              <BrainCircuit className='text-primary h-5 w-5' />
              AI Assistant Settings
            </CardTitle>
            <CardDescription>
              Configure your AI API key to enable the AI assistant features
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-6'>
            {/* Security Alert */}
            <Alert className='bg-muted/50 border-muted'>
              <Shield className='h-4 w-4' />
              <AlertTitle>Security & Privacy</AlertTitle>
              <AlertDescription className='text-sm'>
                Your API key is encrypted and stored securely. It's only decrypted temporarily when
                you use the AI Assistant.
              </AlertDescription>
            </Alert>

            {/* API Key Status */}
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <Label className='text-base font-medium'>API Key Status</Label>
                  <p className='text-muted-foreground mt-1 text-sm'>
                    {hasAiApiKey
                      ? 'Your AI assistant is ready to use'
                      : 'Add an API key to enable AI features'}
                  </p>
                </div>
                <Badge className='shrink-0' variant={hasAiApiKey ? 'default' : 'secondary'}>
                  {hasAiApiKey ? (
                    <>
                      <Check className='mr-1 h-3 w-3' />
                      Active
                    </>
                  ) : (
                    'Not Set'
                  )}
                </Badge>
              </div>

              {hasAiApiKey && !isEditingApiKey && (
                <div className='flex w-full items-center gap-3'>
                  <PasswordInput
                    value='••••••••••••••••••••••••••••••••••••'
                    readOnly
                    disabled
                    className='bg-muted/50 flex-1 cursor-not-allowed opacity-70'
                    noEyeIcon
                  />
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setIsEditingApiKey(true)}
                    disabled={isApiKeySubmitting}
                  >
                    <Edit3 className='mr-2 h-4 w-4' />
                    Update
                  </Button>
                  <Button
                    variant='destructive'
                    size='sm'
                    onClick={() => setIsRemoveKeyConfirmOpen(true)}
                    disabled={isApiKeySubmitting}
                  >
                    <Trash2 className='mr-2 h-4 w-4' />
                    Remove
                  </Button>
                </div>
              )}

              {(!hasAiApiKey || isEditingApiKey) && (
                <div className='space-y-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='ai-api-key' className='text-sm font-medium'>
                      Google AI API Key *
                    </Label>
                    <PasswordInput
                      id='ai-api-key'
                      placeholder='Enter your Google AI API Key (e.g., AIza...)'
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                      disabled={isApiKeySubmitting}
                      autoComplete='off'
                      className='font-mono'
                    />
                    <div className='text-muted-foreground flex items-center gap-2 text-xs'>
                      <span>Get your free API key from</span>
                      <a
                        href='https://aistudio.google.com/app/apikey'
                        target='_blank'
                        rel='noopener noreferrer'
                        className='text-primary hover:text-primary/80 inline-flex items-center gap-1 font-medium underline'
                      >
                        Google AI Studio
                        <ExternalLink className='h-3 w-3' />
                      </a>
                    </div>
                  </div>

                  <div className='flex justify-end gap-3 pt-2'>
                    {isEditingApiKey && (
                      <Button
                        type='button'
                        variant='outline'
                        onClick={handleCancelApiKeyEdit}
                        disabled={isApiKeySubmitting}
                      >
                        <X className='mr-2 h-4 w-4' />
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
                      {isEditingApiKey ? 'Update Key' : 'Save Key'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        title='Remove AI API Key'
        description='Are you sure you want to remove your AI API Key? You will need to add it again to use the AI Assistant features.'
        onConfirm={handleRemoveApiKey}
        open={isRemoveKeyConfirmOpen}
        onOpenChange={setIsRemoveKeyConfirmOpen}
      />
    </div>
  );
};

export default UserProfile;
