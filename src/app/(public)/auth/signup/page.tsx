'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import Script from 'next/script';
import { WithContext, WebPage } from 'schema-dts';
import { Loader2, ImagePlus, User } from 'lucide-react';
import { useToast } from '@/lib/hooks/useToast';
import { authClient } from '@/lib/auth-client';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const signUpSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters long.').max(64).trim(),
  email: z.string().email('Invalid email format.'),
  password: z.string().min(8, 'Password must be at least 8 characters long.').max(255),
  image: z.instanceof(File).optional().nullable(),
  token: z.string().optional()
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
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { push } = useRouter();
  const searchParams = useSearchParams();
  const { showError } = useToast();

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

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      form.setValue('token', token);
    }
  }, [searchParams, form]);

  // Clean up the object URL to prevent memory leaks
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleSignUp = async (data: SignUpSchemaType) => {
    await authClient.signUp.email(
      {
        email: data.email,
        password: data.password,
        name: data.name,
        ...(data.image && { image: await convertImageToBase64(data.image) }),
        ...(data.token && { token: data.token })
      },
      {
        onRequest: () => setLoading(true),
        onSuccess: () => {
          push(`/auth/verify-otp?email=${data.email}&type=email-verification`);
        },
        onError: (ctx: any) => {
          setLoading(false);
          showError(ctx.error.message);
        },
        onSettled: () => setLoading(false)
      }
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview); // Clean up previous preview
    }
    if (file) {
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
    // Reset the file input value
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
      <Card variant='auth'>
        <CardContent className='space-y-6 p-0 pt-4'>
          <div className='space-y-2 text-center select-none'>
            <h2 className='text-foreground text-2xl font-semibold'>Create an Account</h2>
            <p className='text-muted-foreground text-sm'>
              Start your expense tracking journey today.
            </p>
          </div>

          <Form {...form}>
            <form className='space-y-4' onSubmit={form.handleSubmit(handleSignUp)}>
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input
                        type='text'
                        placeholder='John Doe'
                        disabled={loading}
                        variant='auth'
                        autoComplete='name'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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

              <FormField
                control={form.control}
                name='password'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <PasswordInput
                        placeholder='••••••••'
                        disabled={loading}
                        autoComplete='new-password'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='image'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profile Picture (Optional)</FormLabel>
                    <FormControl>
                      <div className='flex items-center gap-4'>
                        <Avatar className='h-20 w-20 border'>
                          <AvatarImage src={imagePreview ?? undefined} alt='Profile preview' />
                          <AvatarFallback>
                            <User className='text-muted-foreground h-8 w-8' />
                          </AvatarFallback>
                        </Avatar>

                        {imagePreview ? (
                          <div className='flex flex-col gap-2'>
                            <Button asChild variant='outline' size='sm' disabled={loading}>
                              <label htmlFor='file-upload' className='cursor-pointer'>
                                Change
                              </label>
                            </Button>
                            <Button
                              type='button'
                              variant='destructive'
                              size='sm'
                              onClick={handleRemoveImage}
                              disabled={loading}
                            >
                              Remove
                            </Button>
                          </div>
                        ) : (
                          <Button asChild variant='outline' disabled={loading}>
                            <label htmlFor='file-upload' className='cursor-pointer'>
                              <ImagePlus className='mr-2 h-4 w-4' />
                              Upload
                            </label>
                          </Button>
                        )}
                        <input
                          id='file-upload'
                          type='file'
                          onChange={handleFileChange}
                          disabled={loading}
                          className='sr-only'
                          accept='image/png, image/jpeg, image/gif'
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type='submit' disabled={loading} variant='authButton' className='w-full'>
                {loading ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>

        <CardFooter className='flex flex-col items-center justify-between gap-2 pt-4 sm:flex-row'>
          <Link
            href='/auth/login'
            className='text-primary hover:text-primary/80 text-sm font-medium transition-colors duration-200'
          >
            Already have an account? Log in
          </Link>
        </CardFooter>
      </Card>
    </>
  );
};

export default SignupPage;

async function convertImageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
