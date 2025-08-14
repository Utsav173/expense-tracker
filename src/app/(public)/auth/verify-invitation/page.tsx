'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/lib/hooks/useToast';
import { verifyInvitation } from '@/lib/endpoints/invitation';
import { Card, CardContent } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';

const VerifyInvitationPage = () => {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('Verifying invitation...');
  const { push } = useRouter();
  const searchParams = useSearchParams();
  const { showError } = useToast();

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setMessage('No invitation token found.');
      setLoading(false);
      return;
    }

    const handleVerification = async () => {
      try {
        await verifyInvitation(token);
        setMessage('Invitation verified. Redirecting to signup...');
        push(`/auth/signup?token=${token}`);
      } catch (e: any) {
        setMessage(`Invitation verification failed: ${e.message}`);
        showError(e.message);
      } finally {
        setLoading(false);
      }
    };

    handleVerification();
  }, [searchParams, push, showError]);

  return (
    <Card variant='auth'>
      <CardContent className='space-y-6 p-0 pt-4'>
        <div className='space-y-2 text-center select-none'>
          <h2 className='text-foreground text-2xl font-semibold'>Invitation</h2>
          <p className='text-muted-foreground text-sm'>{message}</p>
        </div>
        {loading && (
          <div className='flex justify-center'>
            <Icon name='loader2' className='text-primary h-8 w-8 animate-spin' />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VerifyInvitationPage;
