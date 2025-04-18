import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MailCheck } from 'lucide-react';

const ForgotPasswordSentPage = () => {
  return (
    <Card className='w-full border-0 p-0 shadow-none'>
      <CardHeader className='items-center py-4'>
        <MailCheck className='mb-3 h-12 w-12 text-green-500' />
        <CardTitle className='text-center text-xl font-bold tracking-wide text-gray-700'>
          Check Your Email
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4 p-0 pb-4 text-center'>
        <p className='text-sm text-gray-600'>
          We've sent a password reset link to your email address. Please check your inbox (and spam
          folder) to proceed.
        </p>
        <p className='text-xs text-gray-500'>
          If you don't receive the email within a few minutes, please try again or contact support.
        </p>
        <Button asChild variant={'link'} className='mt-4'>
          <Link href='/auth/login'>Back to Login</Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export default ForgotPasswordSentPage;
