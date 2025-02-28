'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useToast } from '@/lib/hooks/useToast';
import { authForgotPassword } from '@/lib/endpoints/auth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address')
});

type ForgotPasswordSchemaType = z.infer<typeof forgotPasswordSchema>;

const ForgotPasswordPage = () => {
  const { showError, showSuccess } = useToast();
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
    try {
      setIsLoading(true);
      await authForgotPassword(
        data,
        'Password Reset Link has sent',
        'Could Not Sent password link please try again'
      );
      showSuccess('Password reset link is sent on you email!');
      router.push('/auth/login');
    } catch (e: any) {
      showError(e.message);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <Card className='w-[400px] rounded-md border-none bg-white shadow-none md:w-[450px]'>
      <CardHeader className='pb-4'>
        <CardTitle className='text-center text-xl font-bold tracking-wide text-gray-700'>
          Forgot Password
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-6 pb-4'>
        <form onSubmit={handleSubmit(handleForgotPassword)}>
          <div>
            <Input
              type='email'
              placeholder='Your Email'
              {...register('email')}
              className='w-full'
            />
            {errors.email && <p className='text-sm text-red-500'> {errors.email.message} </p>}
          </div>
          <Button
            disabled={isLoading}
            type='submit'
            className='mb-2 mt-6 w-full'
            variant={'authButton'}
          >
            {isLoading ? 'Sending Mail...' : 'Send Mail'}{' '}
          </Button>
        </form>
      </CardContent>
      <CardFooter className='flex items-center justify-end border-border p-2'>
        <Link href='/auth/login' className='text-blue-500 hover:underline'>
          Back to Login?
        </Link>
      </CardFooter>
    </Card>
  );
};
export default ForgotPasswordPage;
