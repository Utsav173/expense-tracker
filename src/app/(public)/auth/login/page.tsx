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
import { Card, CardContent } from '@/components/ui/card';
import { PasswordInput } from '@/components/ui/password-input';
import { WebSite, Action, WithContext } from 'schema-dts';
import Script from 'next/script';
import { authClient } from '@/lib/auth-client';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/utils';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long')
});

type loginSchemaType = z.infer<typeof loginSchema>;

const jsonLd: WithContext<WebSite> = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  url: 'https://expense-pro.khatriutsav.com/auth/login',
  potentialAction: {
    '@type': 'SignInAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: 'https://expense-pro.khatriutsav.com/auth/login'
    }
  } as unknown as Action
};

const LoginPage = () => {
  const { showSuccess, showError, showInfo } = useToast();
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [githubLoading, setGithubLoading] = React.useState(false);
  const [googleLoading, setGoogleLoading] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<loginSchemaType>({
    resolver: zodResolver(loginSchema),
    mode: 'onSubmit'
  });

  const isAnyLoading = loading || githubLoading || googleLoading;

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

  const handleGithubLogin = async () => {
    if (isAnyLoading) return;

    try {
      setGithubLoading(true);

      await authClient.signIn.social(
        {
          provider: 'github',
          callbackURL: 'https://expense-pro.khatriutsav.com/accounts'
        },
        {
          onError: ({ error }) => {
            console.error('GitHub login error:', error);
            showError('GitHub login failed. Please try again.');
            setGithubLoading(false);
          },
          onSettled: () => {
            setGithubLoading(false);
          }
        }
      );
    } catch (error) {
      console.error('Unexpected GitHub login error:', error);
      showError('An unexpected error occurred. Please try again.');
      setGithubLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (isAnyLoading) return;

    try {
      setGoogleLoading(true);

      await authClient.signIn.social(
        {
          provider: 'google',
          callbackURL: 'https://expense-pro.khatriutsav.com/accounts'
        },
        {
          onError: (ctx) => {
            console.error('Google login error:', ctx.error);
            showError('Google login failed. Please try again.');
            setGoogleLoading(false);
          },
          onSettled: () => {
            setGoogleLoading(false);
          }
        }
      );
    } catch (error) {
      console.error('Unexpected Google login error:', error);
      showError('An unexpected error occurred. Please try again.');
      setGoogleLoading(false);
    }
  };

  return (
    <>
      <Script
        id='json-ld'
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Card variant='auth' className='w-full max-w-md'>
        <CardContent className='space-y-6 px-2'>
          <div className='space-y-2 text-center'>
            <h1 className='text-foreground text-2xl font-bold tracking-tight sm:text-3xl'>
              Welcome back
            </h1>
            <p className='text-muted-foreground text-sm'>Sign in to continue to ExpensePro</p>
          </div>

          <div className='space-y-3'>
            {/* Google Button */}
            <button
              type='button'
              className={cn(
                'group relative flex h-12 w-full items-center justify-center gap-3',
                'bg-background rounded-lg border transition-all duration-200',
                // Light mode
                'border-gray-300 hover:bg-gray-50',
                // Dark mode
                'dark:border-transparent dark:hover:bg-gray-900/50',
                'focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
                'disabled:cursor-not-allowed disabled:opacity-50'
              )}
              onClick={handleGoogleLogin}
              disabled={isAnyLoading}
            >
              {googleLoading ? (
                <>
                  <Icon name='loader2' className='h-5 w-5 animate-spin' />
                  <span className='text-sm font-medium'>Connecting...</span>
                </>
              ) : (
                <>
                  <svg className='h-5 w-5' viewBox='0 0 24 24'>
                    <path
                      fill='#4285F4'
                      d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
                    />
                    <path
                      fill='#34A853'
                      d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
                    />
                    <path
                      fill='#FBBC05'
                      d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
                    />
                    <path
                      fill='#EA4335'
                      d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
                    />
                  </svg>
                  <span className='text-foreground text-sm font-medium'>Continue with Google</span>
                </>
              )}
            </button>

            {/* GitHub Button */}
            <button
              type='button'
              className={cn(
                'group relative flex h-12 w-full items-center justify-center gap-3',
                'rounded-lg border transition-all duration-200',
                // Light mode
                'border-gray-300 bg-gray-900 text-white hover:bg-gray-800',
                // Dark mode
                'dark:border-gray-900 dark:bg-gray-800 dark:hover:bg-gray-700',
                'focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
                'disabled:cursor-not-allowed disabled:opacity-50'
              )}
              onClick={handleGithubLogin}
              disabled={isAnyLoading}
            >
              {githubLoading ? (
                <>
                  <Icon name='loader2' className='h-5 w-5 animate-spin' />
                  <span className='text-sm font-medium'>Connecting...</span>
                </>
              ) : (
                <>
                  <Icon name='github' className='h-5 w-5' />
                  <span className='text-sm font-medium'>Continue with GitHub</span>
                </>
              )}
            </button>
          </div>

          <div className='relative'>
            <div className='absolute inset-0 flex items-center'>
              <div className='w-full border-t border-gray-200 dark:border-gray-700' />
            </div>
            <div className='relative flex justify-center text-xs'>
              <span className='bg-background text-muted-foreground px-4'>
                OR CONTINUE WITH EMAIL
              </span>
            </div>
          </div>

          <form
            className={cn('space-y-4', {
              'cursor-not-allowed opacity-50': isAnyLoading,
              'pointer-events-none': isAnyLoading
            })}
            onSubmit={handleSubmit(handleLogin)}
          >
            <div className='space-y-4'>
              <div className='space-y-2'>
                <label className='text-foreground text-sm font-medium' htmlFor='email'>
                  Email address
                </label>
                <Input
                  id='email'
                  type='email'
                  placeholder='name@example.com'
                  className='h-11'
                  {...register('email')}
                  disabled={isAnyLoading}
                />
                {errors.email && <p className='text-destructive text-xs'>{errors.email.message}</p>}
              </div>

              <div className='space-y-2'>
                <div className='flex items-center justify-between'>
                  <label className='text-foreground text-sm font-medium' htmlFor='password'>
                    Password
                  </label>
                  <Link
                    href='/auth/forgot-password'
                    className={cn(
                      'text-primary hover:text-primary/80 text-xs font-medium transition-colors',
                      isAnyLoading && 'pointer-events-none opacity-50'
                    )}
                  >
                    Forgot password?
                  </Link>
                </div>
                <PasswordInput
                  id='password'
                  placeholder='Enter your password'
                  className='h-11'
                  {...register('password')}
                  disabled={isAnyLoading}
                />
                {errors.password && (
                  <p className='text-destructive text-xs'>{errors.password.message}</p>
                )}
              </div>
            </div>

            <Button
              type='submit'
              disabled={isAnyLoading}
              className='h-11 w-full font-medium'
              size='lg'
            >
              {loading ? (
                <>
                  <Icon name='loader2' className='mr-2 h-4 w-4 animate-spin' />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>

          <div className='text-center text-sm'>
            <span className='text-muted-foreground'>Don't have an account? </span>
            <Link
              href='/auth/signup'
              className={cn(
                'text-primary hover:text-primary/80 font-medium transition-colors',
                isAnyLoading && 'pointer-events-none opacity-50'
              )}
            >
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default LoginPage;
