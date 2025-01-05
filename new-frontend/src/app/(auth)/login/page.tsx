'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import z from 'zod';
import { useToast } from '@/lib/hooks/useToast';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { authLogin } from '@/lib/endpoints/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { storeAuthToken } from '../actions';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
});
type LoginSchemaType = z.infer<typeof loginSchema>;

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const { push } = useRouter();
  const { showError } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginSchemaType>({
    resolver: zodResolver(loginSchema),
  });

  const handleLogin = async (data: LoginSchemaType) => {
    setLoading(true);
    try {
      const response: any = await authLogin(data, 'Login Successful!');
      localStorage.setItem('token', response.data.token);
      await storeAuthToken(response.data.token);
      push('/');
    } catch (e: any) {
      showError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='space-y-4'>
      <h2 className='text-center text-xl font-semibold text-gray-700'>Login</h2>
      <form onSubmit={handleSubmit(handleLogin)} className='space-y-4'>
        <div>
          <Input type='email' placeholder='Email' {...register('email')} className='w-full' />
          {errors.email && <p className='text-sm text-red-500'>{errors.email.message}</p>}
        </div>
        <div>
          <Input
            type='password'
            placeholder='Password'
            {...register('password')}
            className='w-full'
          />
          {errors.password && <p className='text-sm text-red-500'>{errors.password.message}</p>}
        </div>
        <Button type='submit' className='w-full' disabled={loading}>
          {loading ? 'Logging In...' : 'Log In'}
        </Button>
      </form>
      <div className='text-center'>
        <Link href='/signup' className='text-blue-500 hover:underline'>
          Create new account?
        </Link>
        <Link href='/forgot-password' className='ml-4 text-blue-500 hover:underline'>
          Forgot password?
        </Link>
      </div>
    </div>
  );
};

export default LoginPage;
