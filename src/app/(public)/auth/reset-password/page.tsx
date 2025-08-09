'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { PasswordInput } from '@/components/ui/password-input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { useToast } from '@/lib/hooks/useToast';
import { authClient } from '@/lib/auth-client';
import { useSearchParams, useRouter } from 'next/navigation';

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters long.'),
    confirmPassword: z.string()
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  });

type ResetPasswordSchemaType = z.infer<typeof resetPasswordSchema>;

const ResetPasswordPage = () => {
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get('email');
  const otp = searchParams.get('otp');

  const form = useForm<ResetPasswordSchemaType>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: ''
    }
  });

  useEffect(() => {
    if (!email || !otp) {
      showError('Missing email or OTP.');
      router.push('/auth/login');
    }
  }, [email, otp, showError, router]);

  const handleResetPassword = async (data: ResetPasswordSchemaType) => {
    if (!email || !otp) return;

    await authClient.emailOtp.resetPassword(
      {
        email,
        otp,
        password: data.password
      },
      {
        onRequest: () => setLoading(true),
        onSuccess: () => {
          showSuccess('Password has been reset successfully.');
          router.push('/auth/login');
        },
        onError: (ctx: any) => {
          setLoading(false);
          showError(ctx.error.message);
        },
        onSettled: () => setLoading(false)
      }
    );
  };

  return (
    <Card variant='auth'>
      <CardContent className='space-y-6 p-0 pt-4'>
        <div className='space-y-2 text-center select-none'>
          <h2 className='text-foreground text-2xl font-semibold'>Reset Password</h2>
          <p className='text-muted-foreground text-sm'>Enter your new password below.</p>
        </div>

        <Form {...form}>
          <form className='space-y-4' onSubmit={form.handleSubmit(handleResetPassword)}>
            <FormField
              control={form.control}
              name='password'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <PasswordInput placeholder='••••••••' disabled={loading} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='confirmPassword'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm New Password</FormLabel>
                  <FormControl>
                    <PasswordInput placeholder='••••••••' disabled={loading} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type='submit' disabled={loading} variant='authButton' className='w-full'>
              {loading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default ResetPasswordPage;
