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
import { Loader2 } from 'lucide-react';
import { authClient } from '@/lib/auth-client';

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
  const { showSuccess, showError } = useToast();
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
        onRequest: (ctx) => {
          setLoading(true);
        },
        onResponse: (ctx) => {
          showSuccess('Successfully logged in');
          router.replace('/accounts');
        },
        onError: (ctx) => {
          showError(ctx.error.message || 'Failed to login');
          setLoading(false);
        }
      }
    );
  };

  const handleSocialLogin = async (provider: 'google' | 'github') => {
    await authClient.signIn.social(
      { provider },
      {
        onRequest: (ctx) => {
          setLoading(true);
        },
        onResponse: (ctx) => {
          showSuccess('Successfully logged in');
          setLoading(false);
        },
        onError: (ctx) => {
          showError(ctx.error.message || 'Failed to login');
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
                variant='auth'
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

            <Button type='submit' disabled={loading} variant={'authButton'}>
              {loading ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
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

          <Button
            variant='outline'
            className='w-full'
            onClick={() => handleSocialLogin('github')}
            disabled={loading}
          >
            <svg role='img' viewBox='0 0 24 24' className='mr-2 h-4 w-4'>
              <path
                fill='currentColor'
                d='M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.542-1.37-1.32-1.735-1.32-1.735-1.08-.744.08-.73.08-.73 1.19.08 1.82 1.22 1.82 1.22 1.06 1.81 2.809 1.289 3.495.98.108-.76.417-1.285.76-1.577-2.665-.295-5.464-1.334-5.464-5.93 0-1.31.465-2.38 1.235-3.22-.12-.3-.54-1.52.115-3.175 0 0 1-.32 3.3-.12.965-.26 1.98-.39 3-.39 1.02.0 2.035.13 3 .39 2.295-.2 3.295.12 3.295.12.655 1.65.235 2.875.115 3.175.77.84 1.235 1.91 1.235 3.22 0 4.61-2.8 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.6-.01 2.89-.01 3.285 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12'
              />
            </svg>
            Sign in with GitHub
          </Button>
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
