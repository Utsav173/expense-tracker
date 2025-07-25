'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MailCheck } from 'lucide-react';
import { WebPage, WithContext } from 'schema-dts';
import { GoogleAnalytics } from '@next/third-parties/google';
import Script from 'next/script';

const jsonLd: WithContext<WebPage> = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Password Reset Email Sent Page - Expense Tracker',
  description: 'Confirmation page after sending a password reset email.',
  url: 'https://expense-pro.vercel.app/auth/forgot-password-sent'
};

const ForgotPasswordSentPage = () => {
  return (
    <>
      <Script
        id='json-ld'
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Card variant='auth'>
        <CardHeader className='items-center py-4'>
          <MailCheck className='text-success mb-3 h-12 w-12' />
          <CardTitle className='text-foreground text-center text-xl font-bold tracking-wide'>
            Check Your Email
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4 p-0 pb-4 text-center'>
          <p className='text-muted-foreground text-sm'>
            We&apos;ve sent a password reset link to your email address. Please check your inbox
            (and spam folder) to proceed.
          </p>
          <p className='text-muted-foreground text-xs'>
            If you don&apos;t receive the email within a few minutes, please try again or contact
            support.
          </p>
          <Button asChild variant={'link'} className='mt-4'>
            <Link href='/auth/login'>Back to Login</Link>
          </Button>
        </CardContent>
      </Card>
    </>
  );
};

export default ForgotPasswordSentPage;
