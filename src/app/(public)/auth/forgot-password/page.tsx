'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useToast } from '@/lib/hooks/useToast';
import { authForgotPassword } from '@/lib/endpoints/auth';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { WebPage, WithContext } from 'schema-dts';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Script from 'next/script';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address')
});

type ForgotPasswordSchemaType = z.infer<typeof forgotPasswordSchema>;

const jsonLd: WithContext<WebPage> = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Forgot Password Page - Expense Tracker',
  description: 'Forgot password page for Expense Tracker application.',
  url: 'https://expense-pro.vercel.app/auth/forgot-password'
};

const ForgotPasswordPage = () => {
  const { showError } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<ForgotPasswordSchemaType>({
    resolver: zodResolver(forgotPasswordSchema)
  });

  const handleForgotPassword = async (data: ForgotPasswordSchemaType) => {
    setIsLoading(true);
    try {
      await authForgotPassword(data);
      router.push('/auth/forgot-password-sent');
    } catch (e: any) {
      showError(e.message);
      setIsLoading(false);
    }
  };

  return (
    <>
      <Script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        id='json-ld'
      />
      <Card variant='auth'>
        <CardHeader className='py-4'>
          <CardTitle className='text-foreground text-center text-xl font-bold tracking-wide'>
            Forgot Password
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-6 p-0 pb-4'>
          <form onSubmit={handleSubmit(handleForgotPassword)}>
            <div>
              <label htmlFor='email' className='text-foreground mb-1 block text-sm font-medium'>
                Email Address
              </label>
              <Input
                id='email'
                type='email'
                placeholder='Your Email'
                disabled={isLoading}
                {...register('email')}
                variant='auth'
              />
              {errors.email && (
                <p className='text-destructive py-1 text-xs'> {errors.email.message} </p>
              )}
            </div>
            <Button
              disabled={isLoading}
              type='submit'
              className='mt-6 mb-2 w-full'
              variant={'authButton'}
            >
              {isLoading ? 'Sending Mail...' : 'Send Reset Link'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className='flex items-center justify-end border-t p-4'>
          <Link href='/auth/login' className='text-primary text-sm hover:underline'>
            Back to Login
          </Link>
        </CardFooter>
      </Card>
    </>
  );
};
export default ForgotPasswordPage;
