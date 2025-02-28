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
  profilePic: z.any().optional()
});

type SignUpSchemaType = z.infer<typeof signUpSchema>;

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

      await authSignup(formData, 'Registration successfull!', 'Registration failed');
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

          <Button type='submit' disabled={loading} variant={'authButton'}>
            Create Account
          </Button>
        </form>
      </CardContent>

      <CardFooter className='flex items-center justify-end pt-4'>
        <Link
          href='/auth/login'
          className='text-sm font-medium text-blue-600 transition-colors duration-200 hover:text-blue-500'
        >
          Already have an account?
        </Link>
      </CardFooter>
    </Card>
  );
};

export default SignupPage;
