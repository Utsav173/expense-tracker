'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useToast } from '@/lib/hooks/useToast';
import { authSignup } from '@/lib/endpoints/auth';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { WebPage, WithContext } from 'schema-dts';

const signUpSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters long').max(64).trim(),
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters long').max(255),
  profilePic: z.any().optional()
});

type SignUpSchemaType = z.infer<typeof signUpSchema>;

const jsonLd: WithContext<WebPage> = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Sign Up Page - Expense Tracker',
  description: 'Sign up page for Expense Tracker application.',
  url: 'https://expense-pro.vercel.app/auth/signup'
};

const SignupPage = () => {
  const [loading, setLoading] = useState(false);
  const { push } = useRouter();
  const { showError } = useToast();
  const { register, handleSubmit, formState, setValue, watch } = useForm<SignUpSchemaType>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      profilePic: null
    }
  });

  const profilePic = watch('profilePic');

  const handleSignUp = async (data: SignUpSchemaType) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('email', data.email);
      formData.append('password', data.password);
      if (data.profilePic) {
        formData.append('profilePic', data.profilePic);
      }

      await authSignup(formData);
      push('/auth/login');
    } catch (e: any) {
      showError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setValue('profilePic', file);
  };

  return (
    <>
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Card className='w-full border-0 shadow-none'>
        <CardContent className='space-y-6 p-0 pt-4'>
          <div className='space-y-2 text-center select-none'>
            <h2 className='text-foreground text-2xl font-semibold'>Create Account</h2>
            <p className='text-muted-foreground text-sm'>
              Start your expense tracking journey today
            </p>
          </div>

          <form className='space-y-4' onSubmit={handleSubmit(handleSignUp)}>
            <div className='space-y-2'>
              <label className='text-foreground text-sm font-medium' htmlFor='name'>
                Full Name
              </label>
              <Input
                id='name'
                type='text'
                placeholder='John Doe'
                {...register('name')}
                disabled={loading}
                className='border-border bg-background focus:bg-card focus:ring-primary w-full rounded-lg border px-4 py-2 transition-all duration-200 focus:border-transparent focus:ring-2'
              />
              {formState.errors.name && (
                <p className='text-destructive py-1 text-xs'> {formState.errors.name.message}</p>
              )}
            </div>

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
                className='border-border bg-background focus:bg-card focus:ring-primary w-full rounded-lg border px-4 py-2 transition-all duration-200 focus:border-transparent focus:ring-2'
              />
              {formState.errors.email && (
                <p className='text-destructive py-1 text-xs'> {formState.errors.email.message}</p>
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
                className='border-border bg-background focus:bg-card focus:ring-primary w-full rounded-lg border px-4 py-2 transition-all duration-200 focus:border-transparent focus:ring-2'
              />
              {formState.errors.password && (
                <p className='text-destructive py-1 text-xs'>
                  {' '}
                  {formState.errors.password.message}
                </p>
              )}
            </div>

            <div className='space-y-2'>
              <label className='text-foreground text-sm font-medium'>Profile Picture</label>
              <div className='border-border bg-background hover:border-primary mt-1 flex justify-center rounded-lg border-2 border-dashed px-2 pt-5 pb-6 transition-colors duration-200'>
                <div className='w-full max-w-xs space-y-1 text-center'>
                  <svg
                    className='text-muted-foreground mx-auto h-12 w-12'
                    stroke='currentColor'
                    fill='none'
                    viewBox='0 0 48 48'
                    aria-hidden='true'
                  >
                    <path
                      d='M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02'
                      strokeWidth='2'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                    />
                  </svg>
                  <div className='text-muted-foreground flex flex-col items-center justify-center gap-1 text-sm sm:flex-row'>
                    <label className='text-primary hover:text-primary/80 relative cursor-pointer rounded-md font-medium focus-within:outline-hidden'>
                      <span>Upload a file</span>
                      <input
                        id='file-upload'
                        name='file-upload'
                        onChange={handleFileChange}
                        type='file'
                        disabled={loading}
                        className='sr-only'
                        accept='image/png, image/jpeg, image/gif'
                      />
                    </label>
                    <span className='hidden px-1 sm:inline'>or</span>
                    <span className='block sm:inline'>drag and drop</span>
                  </div>
                  <p className='text-muted-foreground text-xs'>PNG, JPG, GIF up to 2MB</p>{' '}
                </div>
              </div>
              {profilePic && profilePic instanceof File && (
                <p className='text-muted-foreground mt-1 text-xs break-all'>
                  Selected: {profilePic.name}
                </p>
              )}
            </div>

            <Button type='submit' disabled={loading} variant={'authButton'} className='w-full'>
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>
        </CardContent>

        <CardFooter className='flex flex-col items-center justify-between gap-2 pt-4 sm:flex-row'>
          <Link
            href='/auth/login'
            className='text-primary hover:text-primary/80 text-sm font-medium transition-colors duration-200'
          >
            Already have an account?
          </Link>
        </CardFooter>
      </Card>
    </>
  );
};

export default SignupPage;
