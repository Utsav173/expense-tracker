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
    if (file) {
      setValue('profilePic', file);
    }
  };

  return (
    <div className='space-y-4'>
      <h2 className='text-center text-xl font-semibold text-gray-700'>Sign Up</h2>
      <form onSubmit={handleSubmit(handleSignUp)} className='space-y-4'>
        <div>
          <Input type='text' placeholder='Full Name' {...register('name')} className='w-full' />
          {errors.name && <p className='text-sm text-red-500'>{errors.name.message}</p>}
        </div>
        <div>
          <Input type='email' placeholder='Email' {...register('email')} className='w-full' />
          {errors.email && <p className='text-sm text-red-500'>{errors.email.message}</p>}
        </div>
        <div>
          <Input
            type='password'
            placeholder='Password'
            {...register('password')}
            className='w-full'
          />
          {errors.password && <p className='text-sm text-red-500'>{errors.password.message}</p>}
        </div>
        <div>
          <Input type='file' accept='image/*' onChange={handleFileChange} className='w-full' />
        </div>
        <Button type='submit' className='w-full' disabled={loading}>
          {loading ? 'Signing Up...' : 'Sign Up'}
        </Button>
      </form>
      <div className='text-center'>
        <Link href='/login' className='text-blue-500 hover:underline'>
          Already have an account?
        </Link>
      </div>
    </div>
  );
};

export default SignupPage;
