'use client';

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/lib/hooks/useToast';
import { authResetPassword } from '@/lib/endpoints/auth';
import { PasswordInput } from '@/components/ui/password-input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { WebPage, WithContext } from 'schema-dts';
import { GoogleAnalytics } from '@next/third-parties/google';
import Script from 'next/script';

const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters long').max(255),
  resetPasswordToken: z.string().min(1, 'Reset token is missing')
});

type ResetPasswordSchemaType = z.infer<typeof resetPasswordSchema>;

const jsonLd: WithContext<WebPage> = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Reset Password Page - Expense Tracker',
  description: 'Reset password page for Expense Tracker application.',
  url: 'https://expense-pro.vercel.app/auth/reset-password'
};

const ResetPasswordPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const { showError } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue
  } = useForm<ResetPasswordSchemaType>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      resetPasswordToken: token || ''
    }
  });

  useEffect(() => {
    if (token) {
      setValue('resetPasswordToken', token);
    } else if (!token && !isLoading) {
      router.replace('/auth/login');
      showError('Invalid or missing reset token.');
    }
  }, [token, router, showError, setValue, isLoading]);

  const handleResetPassword = async (data: ResetPasswordSchemaType) => {
    if (!data.resetPasswordToken) {
      showError('Reset token is missing.');
      return;
    }
    setIsLoading(true);
    try {
      await authResetPassword(data);
      router.push('/auth/login');
    } catch (e: any) {
      showError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return null;
  }

  return (
    <>
      <Script
        id='json-ld'
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Card variant='auth'>
        <CardHeader className='py-4'>
          <CardTitle className='text-center text-xl font-bold tracking-wide text-foreground'>
            Reset Password
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-6 p-0 pb-4'>
          <form onSubmit={handleSubmit(handleResetPassword)} className='space-y-4'>
            <div>
              <label className='text-sm font-medium text-foreground' htmlFor='password'>
                New Password
              </label>
              {/* Use PasswordInput here */}
              <PasswordInput
                id='password'
                placeholder='New Password'
                {...register('password')}
                variant='auth'
                disabled={isLoading}
              />
              {errors.password && (
                <p className='py-1 text-xs text-destructive'>{errors.password.message}</p>
              )}
            </div>
            {/* Hidden input for the token */}
            <input type='hidden' {...register('resetPasswordToken')} />
            {errors.resetPasswordToken && (
              <p className='py-1 text-xs text-destructive'>{errors.resetPasswordToken.message}</p>
            )}

            <Button type='submit' className='w-full' disabled={isLoading} variant={'authButton'}>
              {isLoading ? 'Resetting Password...' : 'Reset Password'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className='flex justify-center p-4'>
          <Link href='/auth/login' className='text-sm text-primary hover:underline'>
            Back to Login
          </Link>
        </CardFooter>
      </Card>
      </>
  );
};

export default ResetPasswordPage;
