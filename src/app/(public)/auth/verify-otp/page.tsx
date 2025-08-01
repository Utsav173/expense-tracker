'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useToast } from '@/lib/hooks/useToast';
import { authClient } from '@/lib/auth-client';
import { Loader2 } from 'lucide-react';

const otpSchema = z.object({
  otp: z.string().min(6, 'OTP must be 6 digits.')
});

type OtpSchemaType = z.infer<typeof otpSchema>;

const RESEND_COOLDOWN_SECONDS = 60;

const VerifyOtpPage = () => {
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  const { showSuccess, showError, showInfo } = useToast();
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

  // Cooldown timer effect
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleResendOtp = useCallback(async () => {
    if (!email || !type || isResending || resendCooldown > 0) return;

    setIsResending(true);
    try {
      await authClient.emailOtp.sendVerificationOtp({
        email,
        type: type as 'email-verification' | 'forget-password'
      });
      showInfo('A new OTP has been sent to your email.');
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (error: any) {
      showError(error.message || 'Failed to resend OTP.');
    } finally {
      setIsResending(false);
    }
  }, [email, type, isResending, resendCooldown, showInfo, showError]);

  const handleVerifyOtp = async (data: OtpSchemaType) => {
    if (!email || !type) return;

    setLoading(true);
    try {
      if (type === 'email-verification') {
        await authClient.emailOtp.verifyEmail({
          email,
          otp: data.otp
        });
        showSuccess('Email verified successfully! You can now log in.');
        router.push('/auth/login');
      } else if (type === 'forget-password') {
        await authClient.emailOtp.verifyEmail({
          email,
          otp: data.otp
        });
        router.push(`/auth/reset-password?email=${email}&otp=${data.otp}`);
      }
    } catch (error: any) {
      showError(error.message || 'An error occurred during verification.');
      form.reset({ otp: '' }); // Clear input on error
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card variant='auth'>
      <CardContent className='space-y-6 p-0 pt-4'>
        <div className='space-y-2 text-center select-none'>
          <h2 className='text-foreground text-2xl font-semibold'>Verify Your Identity</h2>
          <p className='text-muted-foreground text-sm'>
            An OTP has been sent to <strong>{email}</strong>. Please enter it below.
          </p>
        </div>

        <Form {...form}>
          <form className='space-y-6' onSubmit={form.handleSubmit(handleVerifyOtp)}>
            <FormField
              control={form.control}
              name='otp'
              render={({ field }) => (
                <FormItem className='flex flex-col items-center'>
                  <FormLabel className='sr-only'>One-Time Password</FormLabel>
                  <FormControl>
                    <InputOTP maxLength={6} {...field}>
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type='submit'
              disabled={loading || isResending}
              variant='authButton'
              className='w-full'
            >
              {loading ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Verifying...
                </>
              ) : (
                'Verify OTP'
              )}
            </Button>
          </form>
        </Form>
        <div className='text-center text-sm'>
          Didn't receive the code?{' '}
          <Button
            variant='link'
            className='h-auto p-0'
            onClick={handleResendOtp}
            disabled={isResending || resendCooldown > 0}
          >
            {isResending
              ? 'Sending...'
              : resendCooldown > 0
                ? `Resend in ${resendCooldown}s`
                : 'Resend OTP'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default VerifyOtpPage;
