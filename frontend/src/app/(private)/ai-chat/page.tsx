'use client';

import React from 'react';
import { AiChat } from '@/components/ai/ai-chat';
import { useAuth } from '@/lib/hooks/useAuth';
import Loader from '@/components/ui/loader';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const AiChatPage = () => {
  const { user, userIsLoading, userIsError, userQueryError } = useAuth();

  if (userIsLoading) {
    return (
      <div className='flex h-[calc(100vh-8rem)] w-full flex-1 items-center justify-center p-4'>
        <Loader />
      </div>
    );
  }

  if (userIsError) {
    return (
      <div className='flex h-full w-full flex-1 items-center justify-center p-4'>
        <Alert variant='destructive' className='max-w-md'>
          <AlertCircle className='h-4 w-4' />
          <AlertTitle>Error Loading User</AlertTitle>
          <AlertDescription>
            Could not load user information. Please try refreshing the page.
            {userQueryError?.message && <p className='mt-2 text-xs'>{userQueryError.message}</p>}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!user?.hasAiApiKey) {
    return (
      <div className='flex h-full w-full flex-1 items-center justify-center p-4'>
        <Alert variant='default' className='max-w-lg text-center'>
          <KeyRound className='h-4 w-4' />
          <AlertTitle className='text-lg font-semibold'>AI Assistant Disabled</AlertTitle>
          <AlertDescription className='mt-2'>
            To use the AI Assistant, please add your Google AI API key in your profile settings.
            <br />
            <Button asChild variant='link' className='mt-3'>
              <Link href='/profile'>Go to Profile Settings</Link>
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Only render AiChat if loading is done and user has API key
  return (
    <div className='container mx-auto flex h-full w-full flex-1 items-center justify-center'>
      <AiChat />
    </div>
  );
};

export default AiChatPage;
