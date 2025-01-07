'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useToast } from '@/lib/hooks/useToast';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/lib/hooks/useAuth';
import { useIsAuthorized } from '@/lib/hooks/useIsAuthorized';
import { Card, CardContent, CardFooter } from '@/components/ui/card';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long')
});

type loginSchemaType = z.infer<typeof loginSchema>;

const LoginPage = () => {
  const { showSuccess, showError } = useToast();
  const router = useRouter();
  const { login, loginLoading: isLoading, loginIsError: isError, user } = useAuth();

  useIsAuthorized(() => {
    router.push('/');
  }, isError);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<loginSchemaType>({
    resolver: zodResolver(loginSchema)
  });

  useEffect(() => {
    if (isError && !isLoading) {
      showError('Failed to login');
    } else {
      if (user && !isLoading) {
        showSuccess('Successfully logged in');
        router.push('/');
      }
    }
  }, [isLoading, isError, router, showSuccess, showError, user]);

  const handleLogin = async (data: loginSchemaType) => {
    await login(data.email, data.password);
  };

  return (
    <Card className='w-full border-0 shadow-none'>
      <CardContent className='space-y-6 pt-4'>
        <div className='space-y-2 text-center'>
          <h2 className='text-2xl font-semibold text-gray-800'>Welcome Back</h2>
          <p className='text-sm text-gray-500'>Sign in to continue tracking your expenses</p>
        </div>

        <form className='space-y-4' onSubmit={handleSubmit(handleLogin)}>
          <div className='space-y-2'>
            <label className='text-sm font-medium text-gray-700' htmlFor='email'>
              Email
            </label>
            <Input
              id='email'
              type='email'
              placeholder='you@example.com'
              {...register('email')}
              className='w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 transition-all duration-200 focus:border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500'
            />
          </div>

          <div className='space-y-2'>
            <label className='text-sm font-medium text-gray-700' htmlFor='password'>
              Password
            </label>
            <Input
              id='password'
              type='password'
              placeholder='••••••••'
              {...register('password')}
              className='w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 transition-all duration-200 focus:border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500'
            />
          </div>

          <Button type='submit' disabled={isLoading} variant={'authButton'}>
            Sign In
          </Button>
        </form>
      </CardContent>

      <CardFooter className='flex items-center justify-between pt-4'>
        <Link
          href='/auth/signup'
          className='text-sm font-medium text-blue-600 transition-colors duration-200 hover:text-blue-500'
        >
          Create account
        </Link>
        <Link
          href='/auth/forgot-password'
          className='text-sm font-medium text-blue-600 transition-colors duration-200 hover:text-blue-500'
        >
          Forgot Password?
        </Link>
      </CardFooter>
    </Card>
  );
};

export default LoginPage;
