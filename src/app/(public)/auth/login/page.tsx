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

  // Check if any loading state is active
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
      <Card variant='auth'>
        <CardContent className='space-y-6 p-0 pt-4'>
          <div className='space-y-2 text-center select-none'>
            <h2 className='text-foreground text-2xl font-semibold'>Sign In to Your Account</h2>
            <p className='text-muted-foreground text-sm'>
              Sign in to continue tracking your expenses
            </p>
          </div>

          <form
            className={cn('space-y-4', {
              'cursor-not-allowed opacity-50': isAnyLoading,
              'pointer-events-none': isAnyLoading
            })}
            onSubmit={handleSubmit(handleLogin)}
          >
            <div className='space-y-2'>
              <label className='text-foreground text-sm font-medium' htmlFor='email'>
                Email
              </label>
              <Input
                id='email'
                type='email'
                placeholder='you@example.com'
                {...register('email')}
                disabled={isAnyLoading}
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
                disabled={isAnyLoading}
              />
              {errors.password && (
                <p className='text-destructive py-1 text-xs'> {errors.password.message}</p>
              )}
            </div>

            <Button type='submit' disabled={isAnyLoading} className='w-full'>
              {loading ? (
                <>
                  <Icon name='loader2' className='mr-2 h-4 w-4 animate-spin' />
                  Signing In...
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

          <div className='space-y-3'>
            {/* GitHub Button */}
            <button
              type='button'
              className={cn(
                'relative h-11 w-full transition-all duration-200',
                'rounded-md border border-[#24292e] bg-[#24292e] text-white',
                'hover:border-[#1b1f23] hover:bg-[#1b1f23]',
                'dark:border-[#30363d] dark:bg-[#21262d] dark:text-white',
                'dark:hover:border-[#30363d] dark:hover:bg-[#30363d]',
                'focus-visible:ring-2 focus-visible:ring-[#24292e] focus-visible:ring-offset-2',
                'disabled:cursor-not-allowed disabled:opacity-50',
                'flex items-center justify-center text-sm font-medium'
              )}
              onClick={handleGithubLogin}
              disabled={isAnyLoading}
            >
              {githubLoading ? (
                <>
                  <Icon name='loader2' className='mr-2 h-4 w-4 animate-spin' aria-hidden='true' />
                  Connecting to GitHub...
                </>
              ) : (
                <>
                  <Icon name='github' className='mr-2 h-4 w-4' aria-hidden='true' />
                  Continue with GitHub
                </>
              )}
            </button>

            {/* Google Button - Following Official Guidelines */}
            <button
              type='button'
              className={cn(
                'relative h-11 w-full transition-all duration-200',
                // Light theme: Fill: #FFFFFF, Stroke: #747775, Font: #1F1F1F
                'rounded-md border border-[#747775] bg-white text-[#1F1F1F]',
                'hover:border-[#5f6368] hover:bg-gray-50',
                // Dark theme: Fill: #131314, Stroke: #8E918F, Font: #E3E3E3
                'dark:border-[#8e918f] dark:bg-[#131314] dark:text-[#e3e3e3]',
                'dark:hover:border-[#9aa0a6] dark:hover:bg-[#1e1e1f]',
                'focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
                'disabled:cursor-not-allowed disabled:opacity-50',
                'flex items-center justify-center text-sm font-medium'
              )}
              onClick={handleGoogleLogin}
              disabled={isAnyLoading}
            >
              {googleLoading ? (
                <>
                  <Icon name='loader2' className='mr-2 h-4 w-4 animate-spin' aria-hidden='true' />
                  Connecting to Google...
                </>
              ) : (
                <>
                  <Icon name='google' className='mr-2 h-4 w-4' aria-hidden='true' />
                  Continue with Google
                </>
              )}
            </button>
          </div>
        </CardContent>

        <CardFooter className='flex items-center justify-between gap-2 pt-4 max-sm:mt-2 max-sm:flex-col max-sm:justify-center'>
          <Link
            href='/auth/signup'
            className={cn(
              'text-primary hover:text-primary/80 text-sm font-medium transition-colors duration-200',
              isAnyLoading && 'pointer-events-none opacity-50'
            )}
          >
            Create account
          </Link>
          <Link
            href='/auth/forgot-password'
            className={cn(
              'text-primary hover:text-primary/80 text-sm font-medium transition-colors duration-200',
              isAnyLoading && 'pointer-events-none opacity-50'
            )}
          >
            Forgot Password?
          </Link>
        </CardFooter>
      </Card>
    </>
  );
};

export default LoginPage;
