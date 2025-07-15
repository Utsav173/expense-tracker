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
  User,
  Trash2,
  BrainCircuit,
  Loader2,
  Check,
  Edit3,
  Shield,
  ExternalLink,
  Settings,
  Key,
  Mail,
  Globe
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
      showSuccess('Profile updated successfully!');
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

    if (!trimmedKey.startsWith('AIza')) {
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
      <div className='mx-auto max-w-5xl px-4 py-8'>
        <div className='space-y-8'>
          {/* Header Skeleton */}
          <div className='space-y-3 text-center'>
            <Skeleton className='mx-auto h-10 w-64' />
            <Skeleton className='mx-auto h-5 w-96' />
          </div>

          {/* Profile Card Skeleton */}
          <Card className='bg-background/80 border-border/50 backdrop-blur-sm'>
            <CardHeader>
              <Skeleton className='h-7 w-48' />
              <Skeleton className='h-4 w-72' />
            </CardHeader>
            <CardContent className='space-y-6'>
              <div className='flex items-start gap-8'>
                <Skeleton className='h-32 w-32 rounded-full' />
                <div className='flex-1 space-y-6'>
                  <Skeleton className='h-12 w-full' />
                  <Skeleton className='h-12 w-full' />
                  <Skeleton className='h-12 w-2/3' />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Settings Card Skeleton */}
          <Card className='bg-background/80 border-border/50 backdrop-blur-sm'>
            <CardHeader>
              <Skeleton className='h-7 w-56' />
              <Skeleton className='h-4 w-80' />
            </CardHeader>
            <CardContent className='space-y-6'>
              <Skeleton className='h-20 w-full' />
              <Skeleton className='h-12 w-full' />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className='mx-auto max-w-5xl px-4 py-8'>
        <Card className='bg-background/80 border-border/50 backdrop-blur-sm'>
          <CardContent className='p-12 text-center'>
            <div className='space-y-6'>
              <div className='bg-muted/50 mx-auto flex h-20 w-20 items-center justify-center rounded-full'>
                <User className='text-muted-foreground h-10 w-10' />
              </div>
              <div className='space-y-2'>
                <h3 className='text-xl font-semibold'>User Not Found</h3>
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
    <div className='mx-auto max-w-5xl p-4 max-sm:p-1'>
      <div className='space-y-8'>
        {/* Header Section */}
        <div className='space-y-3 text-center'>
          <h1 className='from-foreground to-foreground/70 bg-gradient-to-r bg-clip-text text-4xl font-bold tracking-tight text-transparent'>
            Profile Settings
          </h1>
          <p className='text-muted-foreground mx-auto max-w-2xl text-lg'>
            Manage your personal information and AI assistant preferences
          </p>
        </div>

        {/* Profile Information Card */}
        <Card className='bg-background/80 border-border/50 shadow-lg backdrop-blur-sm'>
          <CardHeader className='pb-8'>
            <div className='flex items-start justify-between'>
              <div className='space-y-2'>
                <CardTitle className='flex items-center gap-3 text-xl'>
                  <div className='bg-primary/10 rounded-lg p-2'>
                    <User className='text-primary h-5 w-5' />
                  </div>
                  Profile Information
                </CardTitle>
                <CardDescription className='text-base'>
                  Update your personal details and profile picture
                </CardDescription>
              </div>
              {!isEditingProfile && (
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setIsEditingProfile(true)}
                  className='shrink-0 gap-2'
                >
                  <Edit3 className='h-4 w-4' />
                  Edit Profile
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className='pt-0'>
            <Form {...profileForm}>
              <div onSubmit={profileForm.handleSubmit(onProfileSubmit)} className='space-y-8'>
                {/* Profile Picture and Basic Info */}
                <div className='flex flex-col gap-8 lg:flex-row'>
                  {/* Profile Picture Section */}
                  <div className='flex flex-col items-center space-y-4 lg:w-64'>
                    <div className='group relative'>
                      <Avatar className='border-background h-32 w-32 border-4 shadow-lg'>
                        <AvatarImage
                          src={previewUrl || user.profilePic || undefined}
                          alt={user.name}
                          className='object-cover'
                        />
                        <AvatarFallback className='from-primary/20 to-primary/10 bg-gradient-to-br text-3xl font-bold'>
                          {user.name?.charAt(0)?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>

                      {isEditingProfile && (
                        <label
                          htmlFor='profile-upload'
                          className='absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100'
                        >
                          <Camera className='h-8 w-8 text-white' />
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
                      <p className='text-muted-foreground max-w-48 text-center text-sm'>
                        Hover over your avatar to change your profile picture
                      </p>
                    )}
                  </div>

                  {/* Form Fields */}
                  <div className='flex-1 space-y-6'>
                    {/* Name Field */}
                    <FormField
                      control={profileForm.control}
                      name='name'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='flex items-center gap-2 text-base font-medium'>
                            <User className='h-4 w-4' />
                            Full Name
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder='Enter your full name'
                              {...field}
                              disabled={!isEditingProfile || isProfileSubmitting}
                              className={`h-12 text-base ${!isEditingProfile ? 'bg-muted/30' : ''}`}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Email Field */}
                    <div className='space-y-2'>
                      <Label className='flex items-center gap-2 text-base font-medium'>
                        <Mail className='h-4 w-4' />
                        Email Address
                      </Label>
                      <div className='flex items-center gap-3'>
                        <Input
                          value={user.email}
                          readOnly
                          disabled
                          className='bg-muted/30 h-12 flex-1 cursor-not-allowed text-base'
                        />
                        <Badge variant='secondary' className='px-3 py-1'>
                          <Check className='mr-1 h-3 w-3' />
                          Verified
                        </Badge>
                      </div>
                      <p className='text-muted-foreground text-sm'>
                        Email cannot be changed. Contact support if needed.
                      </p>
                    </div>

                    {/* Currency Field */}
                    <FormField
                      control={profileForm.control}
                      name='preferredCurrency'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='flex items-center gap-2 text-base font-medium'>
                            <Globe className='h-4 w-4' />
                            Preferred Currency
                          </FormLabel>
                          <div className='h-12'>
                            <CurrencySelect
                              currencies={currencies}
                              value={field.value ?? undefined}
                              onValueChange={field.onChange}
                              isLoading={isLoadingCurrencies}
                              disabled={!isEditingProfile || isProfileSubmitting}
                            />
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                {isEditingProfile && (
                  <div className='border-border/50 flex justify-end gap-3 border-t pt-6'>
                    <Button
                      type='button'
                      variant='outline'
                      onClick={handleProfileCancel}
                      disabled={isProfileSubmitting}
                      className='gap-2'
                    >
                      <X className='h-4 w-4' />
                      Cancel
                    </Button>
                    <Button
                      type='button'
                      onClick={() => onProfileSubmit(profileForm.getValues())}
                      disabled={
                        isProfileSubmitting ||
                        !profileForm.formState.isDirty ||
                        !profileForm.formState.isValid
                      }
                      className='gap-2'
                    >
                      {isProfileSubmitting ? (
                        <Loader2 className='h-4 w-4 animate-spin' />
                      ) : (
                        <Save className='h-4 w-4' />
                      )}
                      Save Changes
                    </Button>
                  </div>
                )}
              </div>
            </Form>
          </CardContent>
        </Card>

        {/* AI Assistant Settings Card */}
        <Card className='bg-background/80 border-border/50 shadow-lg backdrop-blur-sm'>
          <CardHeader className='pb-8'>
            <CardTitle className='flex items-center gap-3 text-xl'>
              <div className='bg-primary/10 rounded-lg p-2'>
                <BrainCircuit className='text-primary h-5 w-5' />
              </div>
              AI Assistant Settings
            </CardTitle>
            <CardDescription className='text-base'>
              Configure your AI API key to enable the AI assistant features
            </CardDescription>
          </CardHeader>

          <CardContent className='space-y-8 pt-0'>
            {/* Security Alert */}
            <Alert className='bg-muted/30 border-muted/50'>
              <Shield className='h-4 w-4' />
              <AlertTitle>Security & Privacy</AlertTitle>
              <AlertDescription>
                Your API key is encrypted and stored securely. It's only decrypted temporarily when
                you use the AI Assistant.
              </AlertDescription>
            </Alert>

            {/* API Key Management */}
            <div className='space-y-6'>
              {/* Status Header */}
              <div className='flex items-center justify-between'>
                <div className='space-y-1'>
                  <Label className='flex items-center gap-2 text-base font-medium'>
                    <Key className='h-4 w-4' />
                    API Key Status
                  </Label>
                  <p className='text-muted-foreground text-sm'>
                    {hasAiApiKey
                      ? 'Your AI assistant is ready to use'
                      : 'Add an API key to enable AI features'}
                  </p>
                </div>
                <Badge variant={hasAiApiKey ? 'default' : 'secondary'} className='px-3 py-1'>
                  {hasAiApiKey ? (
                    <>
                      <Check className='mr-2 h-3 w-3' />
                      Active
                    </>
                  ) : (
                    <>
                      <Settings className='mr-2 h-3 w-3' />
                      Not Set
                    </>
                  )}
                </Badge>
              </div>

              {/* API Key Display/Edit */}
              {hasAiApiKey && !isEditingApiKey && (
                <div className='flex w-full items-center gap-3'>
                  <PasswordInput
                    value='••••••••••••••••••••••••••••••••••••'
                    readOnly
                    disabled
                    className='bg-muted/30 flex-1 cursor-not-allowed text-base'
                    noEyeIcon
                  />
                  <div className='flex items-center gap-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => setIsEditingApiKey(true)}
                      disabled={isApiKeySubmitting}
                      className='gap-2'
                    >
                      <Edit3 className='h-4 w-4' />
                      Update
                    </Button>
                    <Button
                      variant='destructive'
                      size='sm'
                      onClick={() => setIsRemoveKeyConfirmOpen(true)}
                      disabled={isApiKeySubmitting}
                      className='gap-2'
                    >
                      <Trash2 className='h-4 w-4' />
                      Remove
                    </Button>
                  </div>
                </div>
              )}

              {/* API Key Input */}
              {(!hasAiApiKey || isEditingApiKey) && (
                <div className='space-y-6'>
                  <div className='space-y-3'>
                    <Label htmlFor='ai-api-key' className='text-base font-medium'>
                      Google AI API Key
                    </Label>
                    <PasswordInput
                      id='ai-api-key'
                      placeholder='Enter your Google AI API Key (e.g., AIza...)'
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                      disabled={isApiKeySubmitting}
                      autoComplete='off'
                      className='h-12 font-mono text-base'
                    />
                    <div className='text-muted-foreground flex items-center gap-2 text-sm'>
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

                  <div className='flex justify-end gap-3 pt-4'>
                    {isEditingApiKey && (
                      <Button
                        type='button'
                        variant='outline'
                        onClick={handleCancelApiKeyEdit}
                        disabled={isApiKeySubmitting}
                        className='gap-2'
                      >
                        <X className='h-4 w-4' />
                        Cancel
                      </Button>
                    )}
                    <Button
                      type='button'
                      onClick={handleSaveApiKey}
                      disabled={isApiKeySubmitting || !apiKeyInput.trim()}
                      className='gap-2'
                    >
                      {isApiKeySubmitting ? (
                        <Loader2 className='h-4 w-4 animate-spin' />
                      ) : (
                        <Save className='h-4 w-4' />
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
