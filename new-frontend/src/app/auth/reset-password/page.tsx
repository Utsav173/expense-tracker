'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/lib/hooks/useToast';
import { authResetPassword } from '@/lib/endpoints/auth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters long').max(255),
  resetPasswordToken: z.string()
});

type ResetPasswordSchemaType = z.infer<typeof resetPasswordSchema>;

const ResetPasswordPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const { showSuccess, showError } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue
  } = useForm<ResetPasswordSchemaType>({
    resolver: zodResolver(resetPasswordSchema)
  });

  useEffect(() => {
    if (token) {
      setValue('resetPasswordToken', token);
    } else {
      router.replace('/auth/login');
      showError('No Token Found, Try Again!');
    }
  }, [token]);

  const handleResetPassword = async (data: ResetPasswordSchemaType) => {
    try {
      setIsLoading(true);
      await authResetPassword(data, 'Password updated', 'Failed to reset  password');
      showSuccess('Password Reset Successfully');
      router.push('/login');
    } catch (e: any) {
      showError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className='w-[400px] rounded-md bg-white shadow-md md:w-[450px]'>
      <CardHeader className='pb-4'>
        <CardTitle className='text-center text-xl font-bold tracking-wide text-gray-700'>
          {' '}
          Reset Password{' '}
        </CardTitle>

        <Separator className='my-2' />
      </CardHeader>
      <CardContent className='space-y-6 pb-4'>
        <form onSubmit={handleSubmit(handleResetPassword)}>
          <div>
            <Input
              type='password'
              placeholder='Password'
              {...register('password')}
              className='w-full'
            />
            {errors.password && <p className='text-sm text-red-500'> {errors.password.message} </p>}
          </div>
          <Button
            type='submit'
            className='mb-2 mt-6 w-full'
            disabled={isLoading}
            variant={'authButton'}
          >
            {isLoading ? 'Resetting Password' : 'Reset'}{' '}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
export default ResetPasswordPage;
