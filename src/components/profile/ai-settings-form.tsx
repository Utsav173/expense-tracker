'use client';

import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useToast } from '@/lib/hooks/useToast';
import { useInvalidateQueries } from '@/hooks/useInvalidateQueries';
import { getSettings, updateAiApiKey } from '@/lib/endpoints/settings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import DeleteConfirmationModal from '../modals/delete-confirmation-modal';
import { Icon } from '../ui/icon';

export const AiSettingsForm = () => {
  const {
    data: settings,
    isLoading,
    refetch
  } = useQuery({ queryKey: ['userSettings'], queryFn: getSettings });
  const { showSuccess, showError } = useToast();
  const invalidate = useInvalidateQueries();
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isRemoveKeyConfirmOpen, setIsRemoveKeyConfirmOpen] = useState(false);

  useEffect(() => {
    if (settings && !settings.hasAiApiKey) {
      setIsEditing(true);
    }
  }, [settings]);

  const mutation = useMutation({
    mutationFn: (apiKey: string | null) => updateAiApiKey({ apiKey }),
    onSuccess: (data) => {
      showSuccess(data?.message || 'AI API Key updated!');
      invalidate(['userSettings', 'user']);
      refetch();
      setApiKeyInput('');
      setIsEditing(false);
    },
    onError: (err: any) => showError(err.message)
  });

  const handleSave = () => {
    if (!apiKeyInput.trim()) {
      showError('API Key cannot be empty.');
      return;
    }
    mutation.mutate(apiKeyInput.trim());
  };

  const handleRemove = () => {
    mutation.mutate(null);
    setIsRemoveKeyConfirmOpen(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setApiKeyInput('');
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className='h-6 w-56' />
          <Skeleton className='h-4 w-80' />
        </CardHeader>
        <CardContent className='space-y-6'>
          <Skeleton className='h-20 w-full' />
          <Skeleton className='h-12 w-full' />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Assistant Settings</CardTitle>
        <CardDescription>
          Manage your Google AI API key to enable AI-powered features.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-6'>
        <Alert>
          <Icon name='shield' className='h-4 w-4' />
          <AlertTitle>Security & Privacy</AlertTitle>
          <AlertDescription>
            Your API key is securely encrypted and only used to process your requests.
          </AlertDescription>
        </Alert>

        {!isEditing && settings?.hasAiApiKey && (
          <div className='space-y-2'>
            <Label>Your Saved API Key</Label>
            <div className='flex items-center gap-2'>
              <PasswordInput
                value='••••••••••••••••••••••••••••••••••••'
                readOnly
                disabled
                noEyeIcon
                className='cursor-default'
              />
              <Button variant='outline' onClick={() => setIsEditing(true)}>
                <Icon name='edit' className='mr-2 h-4 w-4' />
                Edit
              </Button>
              <Button variant='destructive' onClick={() => setIsRemoveKeyConfirmOpen(true)}>
                <Icon name='trash' className='mr-2 h-4 w-4' />
                Remove
              </Button>
            </div>
          </div>
        )}

        {isEditing && (
          <div className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='api-key'>
                {settings?.hasAiApiKey
                  ? 'Update Your Google AI API Key'
                  : 'Enter Your Google AI API Key'}
              </Label>
              <PasswordInput
                id='api-key'
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder='Enter your API key (starts with AIza...)'
                disabled={mutation.isPending}
                autoFocus
              />
            </div>
            <div className='flex justify-end gap-2'>
              <Button variant='ghost' onClick={handleCancelEdit} disabled={mutation.isPending}>
                <Icon name='x' className='mr-2 h-4 w-4' />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={mutation.isPending || !apiKeyInput.trim()}>
                {mutation.isPending ? (
                  <Icon name='loader2' className='mr-2 h-4 w-4 animate-spin' />
                ) : (
                  <Icon name='save' className='mr-2 h-4 w-4' />
                )}
                Save Key
              </Button>
            </div>
          </div>
        )}

        <div className='text-muted-foreground flex items-center gap-2 text-sm'>
          Get your free API key from
          <a
            href='https://aistudio.google.com/app/apikey'
            target='_blank'
            rel='noopener noreferrer'
            className='text-primary hover:text-primary/80 inline-flex items-center gap-1 font-medium underline'
          >
            Google AI Studio <Icon name='externalLink' className='h-3 w-3' />
          </a>
        </div>
      </CardContent>
      <DeleteConfirmationModal
        title='Remove AI API Key'
        description='Are you sure? AI features will be disabled.'
        onConfirm={handleRemove}
        open={isRemoveKeyConfirmOpen}
        onOpenChange={setIsRemoveKeyConfirmOpen}
      />
    </Card>
  );
};
