'use client';

import React from 'react';
import { AiChat } from '@/components/ai/ai-chat';
import { useAuth } from '@/components/providers/auth-provider';
import Loader from '@/components/ui/loader';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Icon } from '@/components/ui/icon';

const AiChatPage = () => {
  const { session, isLoading } = useAuth();
  const user = session?.user;

  if (isLoading) {
    return (
      <div className='flex h-full flex-1 items-center justify-center p-4'>
        <Loader />
      </div>
    );
  }

  if (!user) {
    return (
      <div className='flex h-full flex-1 items-center justify-center p-4'>
        <Alert variant='destructive' className='max-w-md'>
          <Icon name='alertCircle' className='h-4 w-4' />
          <AlertTitle>Error Loading User</AlertTitle>
          <AlertDescription>
            Could not load user information. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!user?.hasAiApiKey) {
    return (
      <div className='flex h-full flex-1 items-center justify-center p-4'>
        <Alert variant='default' className='mx-auto max-w-lg text-center'>
          <Icon name='keyRound' className='mx-auto h-5 w-5' />
          <AlertTitle className='mt-2 text-lg font-semibold'>AI Assistant Disabled</AlertTitle>
          <AlertDescription className='mt-2'>
            To use the AI Assistant, please select a provider and add your API key in your profile
            settings.
            <br />
            <Button asChild variant='link' className='mt-3'>
              <Link href='/profile'>Go to Profile Settings</Link>
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className='h-[calc(100vh_-_8rem)] w-full'>
      <AiChat isFullPage={true} />
    </div>
  );
};

export default AiChatPage;
