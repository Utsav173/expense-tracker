'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import Script from 'next/script';
import { WithContext, WebSite, Action } from 'schema-dts';
import { useToast } from '@/lib/hooks/useToast';
import { authClient } from '@/lib/auth-client';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { processProfileImage } from '@/lib/image-utils';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/utils';

const signUpSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters long.').max(64).trim(),
  email: z.string().email('Invalid email format.'),
  password: z.string().min(8, 'Password must be at least 8 characters long.').max(255),
  image: z.instanceof(File).optional().nullable(),
  token: z.string().optional()
});

type SignUpSchemaType = z.infer<typeof signUpSchema>;

const jsonLd: WithContext<WebSite> = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  url: 'https://expense-pro.khatriutsav.com/auth/signup',
  potentialAction: {
    '@type': 'RegisterAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: 'https://expense-pro.khatriutsav.com/auth/signup'
    }
  } as Action
};

const SignupPage = () => {
  const [loading, setLoading] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { push } = useRouter();
  const searchParams = useSearchParams();
  const { showError, showSuccess } = useToast();

  const form = useForm<SignUpSchemaType>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      image: null,
      token: searchParams.get('token') || undefined
    },
    mode: 'onChange'
  });

  const isAnyLoading = loading || githubLoading || googleLoading;

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      form.setValue('token', token);
    }
  }, [searchParams, form]);

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleSignUp = async (data: SignUpSchemaType) => {
    setLoading(true);
    try {
      let processedImage: string | undefined = undefined;
      if (data.image) {
        try {
          processedImage = await processProfileImage(data.image);
        } catch (error) {
          console.error('Image processing failed:', error);
          showError('There was an error processing your image. Please try another one.');
          setLoading(false);
          return;
        }
      }

      await authClient.signUp.email(
        {
          email: data.email,
          password: data.password,
          name: data.name,
          ...(processedImage && { image: processedImage }),
          ...(data.token && { token: data.token })
        },
        {
          onSuccess: () => {
            showSuccess('Account created successfully! Please verify your email.');
            push(`/auth/verify-otp?email=${data.email}&type=email-verification`);
          },
          onError: (ctx: any) => {
            showError(ctx.error.message);
          }
        }
      );
    } catch (error: any) {
      showError(error.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleGithubSignup = async () => {
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
            console.error('GitHub signup error:', error);
            showError('GitHub signup failed. Please try again.');
            setGithubLoading(false);
          },
          onSettled: () => {
            setGithubLoading(false);
          }
        }
      );
    } catch (error) {
      console.error('Unexpected GitHub signup error:', error);
      showError('An unexpected error occurred. Please try again.');
      setGithubLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
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
            console.error('Google signup error:', ctx.error);
            showError('Google signup failed. Please try again.');
            setGoogleLoading(false);
          },
          onSettled: () => {
            setGoogleLoading(false);
          }
        }
      );
    } catch (error) {
      console.error('Unexpected Google signup error:', error);
      showError('An unexpected error occurred. Please try again.');
      setGoogleLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showError('Profile picture must be less than 5MB');
        form.setValue('image', null);
        return;
      }
      form.setValue('image', file, { shouldValidate: true });
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
    form.setValue('image', null, { shouldValidate: true });
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  return (
    <>
      <Script
        id='json-ld'
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Card variant='auth' className='w-full'>
        <CardContent className='space-y-3 px-2'>
          <div className='space-y-2 text-center'>
            <h1 className='text-foreground text-2xl font-bold tracking-tight sm:text-3xl'>
              Create an account
            </h1>
            <p className='text-muted-foreground text-sm'>Get started with ExpensePro today</p>
          </div>

          <div className='space-y-2'>
            <button
              type='button'
              className={cn(
                'group relative flex h-11 w-full items-center justify-center gap-2',
                'rounded-lg border shadow-sm transition-all duration-200',
                // Light mode: Standard White
                'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50',
                // Dark mode: Standard Dark (Google Gray)
                'dark:border-gray-700 dark:bg-[#131314] dark:text-white dark:hover:border-gray-600 dark:hover:bg-[#1a1a1c]',
                'focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
                'disabled:cursor-not-allowed disabled:opacity-50'
              )}
              onClick={handleGoogleSignup}
              disabled={isAnyLoading}
            >
              {googleLoading ? (
                <>
                  <Icon name='loader2' className='h-4 w-4 animate-spin' />
                  <span className='text-sm font-medium'>Connecting...</span>
                </>
              ) : (
                <>
                  <svg className='h-5 w-5' viewBox='0 0 24 24'>
                    <path
                      fill='#4285F4'
                      d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
                    />
                    <path
                      fill='#34A853'
                      d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
                    />
                    <path
                      fill='#FBBC05'
                      d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
                    />
                    <path
                      fill='#EA4335'
                      d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
                    />
                  </svg>
                  <span className='text-sm font-medium'>Continue with Google</span>
                </>
              )}
            </button>

            <button
              type='button'
              className={cn(
                'group relative flex h-11 w-full items-center justify-center gap-2',
                'rounded-lg border shadow-sm transition-all duration-200',
                // Light mode: Standard GitHub Dark
                'border-transparent bg-[#24292e] text-white hover:bg-[#2f363d]',
                // Dark mode: High Contrast White
                'dark:border-transparent dark:bg-white dark:text-[#24292e] dark:hover:bg-gray-100',
                'focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
                'disabled:cursor-not-allowed disabled:opacity-50'
              )}
              onClick={handleGithubSignup}
              disabled={isAnyLoading}
            >
              {githubLoading ? (
                <>
                  <Icon name='loader2' className='h-4 w-4 animate-spin' />
                  <span className='text-sm font-medium'>Connecting...</span>
                </>
              ) : (
                <>
                  <Icon name='github' className='h-5 w-5' />
                  <span className='text-sm font-medium'>Continue with GitHub</span>
                </>
              )}
            </button>
          </div>

          <div className='relative'>
            <div className='absolute inset-0 flex items-center'>
              <div className='w-full border-t border-gray-200 dark:border-gray-700' />
            </div>
            <div className='relative flex justify-center text-xs'>
              <span className='bg-background text-muted-foreground px-4'>
                OR SIGN UP WITH EMAIL
              </span>
            </div>
          </div>

          <Form {...form}>
            <form
              className={cn('space-y-3', {
                'cursor-not-allowed opacity-50': isAnyLoading,
                'pointer-events-none': isAnyLoading
              })}
              onSubmit={form.handleSubmit(handleSignUp)}
            >
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-sm font-medium'>Full Name</FormLabel>
                    <FormControl>
                      <Input
                        type='text'
                        placeholder='John Doe'
                        disabled={isAnyLoading}
                        autoComplete='name'
                        className='h-11'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='text-xs' />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='email'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-sm font-medium'>Email Address</FormLabel>
                    <FormControl>
                      <Input
                        type='email'
                        placeholder='name@example.com'
                        disabled={isAnyLoading}
                        autoComplete='email'
                        className='h-11'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='text-xs' />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='password'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-sm font-medium'>Password</FormLabel>
                    <FormControl>
                      <PasswordInput
                        placeholder='Create a strong password'
                        disabled={isAnyLoading}
                        autoComplete='new-password'
                        className='h-11'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='text-xs' />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='image'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-sm font-medium'>
                      Profile Picture
                      <span className='text-muted-foreground ml-1 text-xs font-normal'>
                        (Optional)
                      </span>
                    </FormLabel>
                    <FormControl>
                      <div className='flex items-center gap-4'>
                        {imagePreview ? (
                          <Avatar className='h-11 w-11 border-2 border-gray-200 dark:border-gray-700'>
                            <AvatarImage src={imagePreview ?? undefined} alt='Profile preview' />
                            <AvatarFallback className='bg-gray-50 dark:bg-gray-900'>
                              <Icon name='user' className='text-muted-foreground h-6 w-6' />
                            </AvatarFallback>
                          </Avatar>
                        ) : null}

                        <div className='flex flex-1 gap-2'>
                          {imagePreview ? (
                            <>
                              <Button
                                asChild
                                variant='outline'
                                size='sm'
                                disabled={isAnyLoading}
                                className='flex-1'
                              >
                                <label htmlFor='file-upload' className='cursor-pointer'>
                                  Change Photo
                                </label>
                              </Button>
                              <Button
                                type='button'
                                variant='ghost'
                                size='sm'
                                onClick={handleRemoveImage}
                                disabled={isAnyLoading}
                                className='text-destructive hover:text-destructive'
                              >
                                Remove
                              </Button>
                            </>
                          ) : (
                            <Button
                              asChild
                              variant='outline'
                              size='sm'
                              disabled={isAnyLoading}
                              className='flex-1'
                            >
                              <label htmlFor='file-upload' className='cursor-pointer'>
                                <Icon name='camera' className='mr-2 h-4 w-4' />
                                Upload Photo
                              </label>
                            </Button>
                          )}
                        </div>
                        <input
                          id='file-upload'
                          type='file'
                          onChange={handleFileChange}
                          disabled={isAnyLoading}
                          className='sr-only'
                          accept='image/png, image/jpeg, image/gif'
                        />
                      </div>
                    </FormControl>
                    <FormMessage className='text-xs' />
                  </FormItem>
                )}
              />

              <Button
                type='submit'
                disabled={isAnyLoading}
                className='mt-3 h-11 w-full font-medium'
                size='lg'
              >
                {loading ? (
                  <>
                    <Icon name='loader2' className='mr-2 h-4 w-4 animate-spin' />
                    Creating account...
                  </>
                ) : (
                  'Create account'
                )}
              </Button>

              <p className='text-muted-foreground text-center text-xs'>
                By creating an account, you agree to our{' '}
                <Link href='/legal/terms-of-service' className='text-primary hover:text-primary/80'>
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href='/legal/privacy-policy' className='text-primary hover:text-primary/80'>
                  Privacy Policy
                </Link>
              </p>
            </form>
          </Form>

          <div className='text-center text-sm'>
            <span className='text-muted-foreground'>Already have an account? </span>
            <Link
              href='/auth/login'
              className={cn(
                'text-primary hover:text-primary/80 font-medium transition-colors',
                isAnyLoading && 'pointer-events-none opacity-50'
              )}
            >
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default SignupPage;
