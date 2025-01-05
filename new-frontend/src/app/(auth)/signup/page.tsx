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
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';

const signUpSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters long').max(64).trim(),
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters long').max(255),
  profilePic: z.any().optional(),
});

type SignUpSchemaType = z.infer<typeof signUpSchema>;

const SignupPage = () => {
  const [loading, setLoading] = useState(false);
  const { push } = useRouter();
  const { showSuccess, showError } = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<SignUpSchemaType>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      profilePic: null,
    },
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

      await authSignup(formData, 'Registration successfull!', 'Registration failed');
      push('/login');
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
    <Card className='w-full border-0 shadow-none'>
      <CardContent className='space-y-6 pt-4'>
        <div className='space-y-2 text-center'>
          <h2 className='text-2xl font-semibold text-gray-800'>Create Account</h2>
          <p className='text-sm text-gray-500'>Start your expense tracking journey today</p>
        </div>

        <form className='space-y-4' onSubmit={handleSubmit(handleSignUp)}>
          <div className='space-y-2'>
            <label className='text-sm font-medium text-gray-700' htmlFor='name'>
              Full Name
            </label>
            <Input
              id='name'
              type='text'
              placeholder='John Doe'
              {...register('name')}
              className='w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 transition-all duration-200 focus:border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500'
            />
          </div>

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

          <div className='space-y-2'>
            <label className='text-sm font-medium text-gray-700'>Profile Picture</label>
            <div className='mt-1 flex justify-center rounded-lg border-2 border-dashed border-gray-200 px-6 pb-6 pt-5 transition-colors duration-200 hover:border-blue-400'>
              <div className='space-y-1 text-center'>
                <svg
                  className='mx-auto h-12 w-12 text-gray-400'
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
                <div className='flex text-sm text-gray-600'>
                  <label className='relative cursor-pointer rounded-md bg-white font-medium text-blue-600 focus-within:outline-none hover:text-blue-500'>
                    <span>Upload a file</span>
                    <input
                      id='file-upload'
                      name='file-upload'
                      onChange={handleFileChange}
                      type='file'
                      className='sr-only'
                    />
                  </label>
                  <p className='pl-1'>or drag and drop</p>
                </div>
                <p className='text-xs text-gray-500'>PNG, JPG, GIF up to 10MB</p>
              </div>
            </div>
          </div>

          <Button
            type='submit'
            disabled={loading}
            className='w-full rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 font-medium text-white transition-all duration-200 hover:from-blue-700 hover:to-indigo-700'
          >
            Create Account
          </Button>
        </form>

        <div className='relative'>
          <div className='absolute inset-0 flex items-center'>
            <div className='w-full border-t border-gray-200'></div>
          </div>
          <div className='relative flex justify-center text-sm'>
            <span className='bg-white px-2 text-gray-500'>Or continue with</span>
          </div>
        </div>

        <div className='grid grid-cols-2 gap-3'>
          <button className='flex items-center justify-center rounded-lg border border-gray-200 px-4 py-2 transition-colors duration-200 hover:bg-gray-50'>
            <svg className='h-5 w-5' viewBox='0 0 24 24'>
              <path
                d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
                fill='#4285F4'
              />
              <path
                d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
                fill='#34A853'
              />
              <path
                d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
                fill='#FBBC05'
              />
              <path
                d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
                fill='#EA4335'
              />
            </svg>
          </button>
          <button className='flex items-center justify-center rounded-lg border border-gray-200 px-4 py-2 transition-colors duration-200 hover:bg-gray-50'>
            <svg className='h-5 w-5 text-[#1DA1F2]' fill='currentColor' viewBox='0 0 24 24'>
              <path d='M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z' />
            </svg>
          </button>
        </div>
      </CardContent>

      <CardFooter className='flex items-center justify-end border-t pt-4'>
        <Link
          href='/login'
          className='text-sm font-medium text-blue-600 transition-colors duration-200 hover:text-blue-500'
        >
          Already have an account?
        </Link>
      </CardFooter>
    </Card>
  );
};

export default SignupPage;
