'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { authClient } from '@/lib/auth-client';

const otpSchema = z.object({
  otp: z.string().min(6, 'OTP must be 6 digits.').max(6, 'OTP must be 6 digits.')
});

type OtpSchemaType = z.infer<typeof otpSchema>;

const VerifyOtpPage = () => {
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();

  const email = searchParams.get('email');
  const type = searchParams.get('type');
  const form = useForm<OtpSchemaType>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: ''
    }
  });

  useEffect(() => {
    if (!email || !type) {
      showError('Missing email or verification type.');
      router.push('/auth/login');
    }
  }, [email, type, showError, router]);

  const handleVerifyOtp = async (data: OtpSchemaType) => {
    if (!email || !type) return;

    try {
      setLoading(true);
      if (type === 'email-verification') {
        await authClient.emailOtp.verifyEmail({
          email,
          otp: data.otp
        });
        showSuccess('Email verified successfully!');
        router.push('/auth/login');
      } else if (type === 'forget-password') {
        router.push(`/auth/reset-password?email=${email}&otp=${data.otp}`);
      }
    } catch (error: any) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card variant='auth'>
      <CardContent className='space-y-6 p-0 pt-4'>
        <div className='space-y-2 text-center select-none'>
          <h2 className='text-foreground text-2xl font-semibold'>Verify OTP</h2>
          <p className='text-muted-foreground text-sm'>
            An OTP has been sent to {email}. Please enter it below.
          </p>
        </div>

        <Form {...form}>
          <form className='space-y-4' onSubmit={form.handleSubmit(handleVerifyOtp)}>
            <FormField
              control={form.control}
              name='otp'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>OTP</FormLabel>
                  <FormControl>
                    <Input type='text' placeholder='123456' disabled={loading} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type='submit' disabled={loading} variant='authButton' className='w-full'>
              {loading ? 'Verifying...' : 'Verify OTP'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default VerifyOtpPage;
