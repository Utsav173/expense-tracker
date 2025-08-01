'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format.')
});

type ForgotPasswordSchemaType = z.infer<typeof forgotPasswordSchema>;

const ForgotPasswordPage = () => {
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useToast();
  const { push } = useRouter();

  const form = useForm<ForgotPasswordSchemaType>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: ''
    }
  });

  const handleForgotPassword = async (data: ForgotPasswordSchemaType) => {
    await authClient.emailOtp.sendVerificationOtp(
      {
        email: data.email,
        type: 'forget-password'
      },
      {
        onRequest: () => setLoading(true),
        onSuccess: () => {
          showSuccess('OTP sent to your email. Please check your inbox.');
          push(`/auth/verify-otp?email=${data.email}&type=forget-password`);
        },
        onError: (ctx: any) => showError(ctx.error.message),
        onSettled: () => setLoading(false)
      }
    );
  };

  return (
    <Card variant='auth'>
      <CardContent className='space-y-6 p-0 pt-4'>
        <div className='space-y-2 text-center select-none'>
          <h2 className='text-foreground text-2xl font-semibold'>Forgot Password</h2>
          <p className='text-muted-foreground text-sm'>
            Enter your email to receive a password reset link.
          </p>
        </div>

        <Form {...form}>
          <form className='space-y-4' onSubmit={form.handleSubmit(handleForgotPassword)}>
            <FormField
              control={form.control}
              name='email'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input
                      type='email'
                      placeholder='you@example.com'
                      disabled={loading}
                      variant='auth'
                      autoComplete='email'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type='submit' disabled={loading} variant='authButton' className='w-full'>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default ForgotPasswordPage;
