'use client';

import React from 'react';
import Link from 'next/link';
import { useToast } from '@/lib/hooks/useToast';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { PasswordInput } from '@/components/ui/password-input';
import { WebPage, WithContext } from 'schema-dts';
import Script from 'next/script';
import { authClient } from '@/lib/auth-client';
import { Icon } from '@/components/ui/icon';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long')
});

type loginSchemaType = z.infer<typeof loginSchema>;

const jsonLd: WithContext<WebPage> = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Login Page - Expense Tracker',
  description: 'Login page for Expense Tracker application.',
  url: 'https://expense-pro.vercel.app/auth/login'
};

const LoginPage = () => {
  const { showSuccess, showError, showInfo } = useToast();
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<loginSchemaType>({
    resolver: zodResolver(loginSchema),
    mode: 'onSubmit'
  });

  const handleLogin = async (data: loginSchemaType) => {
    await authClient.signIn.email(
      {
        email: data.email,
        password: data.password
      },
      {
        onRequest: () => {
          setLoading(true);
        },
        onSuccess: () => {
          showSuccess('Successfully logged in');
          router.replace('/accounts');
        },
        onError: (ctx: any) => {
          setLoading(false);
          if (ctx.error.status === 403 && ctx.error.code === 'EMAIL_NOT_VERIFIED') {
            showInfo('Your email is not verified. Please check your inbox for an OTP.');
            router.push(`/auth/verify-otp?email=${data.email}&type=email-verification`);
          } else {
            showError(ctx.error.message || 'Failed to login');
          }
        },
        onSettled: () => {
          setLoading(false);
        }
      }
    );
  };

  return (
    <>
      <Script
        id='json-ld'
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Card variant='auth'>
        <CardContent className='space-y-6 p-0 pt-4'>
          <div className='space-y-2 text-center select-none'>
            <h2 className='text-foreground text-2xl font-semibold'>Welcome Back</h2>
            <p className='text-muted-foreground text-sm'>
              Sign in to continue tracking your expenses
            </p>
          </div>

          <form className='space-y-4' onSubmit={handleSubmit(handleLogin)}>
            <div className='space-y-2'>
              <label className='text-foreground text-sm font-medium' htmlFor='email'>
                Email
              </label>
              <Input
                id='email'
                type='email'
                placeholder='you@example.com'
                {...register('email')}
                disabled={loading}
              />
              {errors.email && (
                <p className='text-destructive py-1 text-xs'> {errors.email.message}</p>
              )}
            </div>

            <div className='space-y-2'>
              <label className='text-foreground text-sm font-medium' htmlFor='password'>
                Password
              </label>
              <PasswordInput
                id='password'
                placeholder='••••••••'
                {...register('password')}
                disabled={loading}
              />
              {errors.password && (
                <p className='text-destructive py-1 text-xs'> {errors.password.message}</p>
              )}
            </div>

            <Button type='submit' disabled={loading} className='w-full'>
              {loading ? (
                <>
                  <Icon name='loader2' className='mr-2 h-4 w-4 animate-spin' />
                  Signing In ..
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <div className='relative'>
            <div className='absolute inset-0 flex items-center'>
              <span className='w-full border-t' />
            </div>
            <div className='relative flex justify-center text-xs uppercase'>
              <span className='bg-background text-muted-foreground px-2'>Or continue with</span>
            </div>
          </div>
        </CardContent>

        <CardFooter className='flex items-center justify-between gap-2 pt-4 max-sm:mt-2 max-sm:flex-col max-sm:justify-center'>
          <Link
            href='/auth/signup'
            className='text-primary hover:text-primary/80 text-sm font-medium transition-colors duration-200'
          >
            Create account
          </Link>
          <Link
            href='/auth/forgot-password'
            className='text-primary hover:text-primary/80 text-sm font-medium transition-colors duration-200'
          >
            Forgot Password?
          </Link>
        </CardFooter>
      </Card>
    </>
  );
};

export default LoginPage;
