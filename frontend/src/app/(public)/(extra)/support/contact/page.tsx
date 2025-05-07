'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, MessageSquare, User, ArrowLeft, Send, Loader2 } from 'lucide-react';
import { useToast } from '@/lib/hooks/useToast';
import { submitContactForm } from '@/lib/endpoints/contact';

const contactFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }).max(100),
  email: z.string().email({ message: 'Please enter a valid email address.' }).max(100),
  subject: z.string().min(5, { message: 'Subject must be at least 5 characters.' }).max(150),
  message: z.string().min(10, { message: 'Message must be at least 10 characters.' }).max(2000)
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

const ContactSupportPage = () => {
  const { showSuccess, showError } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema)
  });

  const onSubmit: SubmitHandler<ContactFormValues> = async (data) => {
    setIsSubmitting(true);
    try {
      const response = await submitContactForm(data);
      showSuccess(response?.message || "Your message has been sent! We'll get back to you soon.");
      reset();
    } catch (error: any) {
      showError(error.message || 'Failed to send your message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='min-h-screen bg-slate-50 px-4 py-12 text-slate-900 sm:px-6 lg:px-8 dark:bg-slate-900 dark:text-slate-100'>
      <div className='mx-auto max-w-xl'>
        <div className='mb-8'>
          <Link href='/'>
            <Button
              variant='ghost'
              className='text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            >
              <ArrowLeft size={18} className='mr-2' />
              Back to Home
            </Button>
          </Link>
        </div>

        <header className='mb-10 text-center'>
          <MessageSquare className='mx-auto mb-4 h-16 w-16 text-sky-500 dark:text-sky-400' />
          <h1 className='text-4xl font-extrabold tracking-tight sm:text-5xl'>Contact Support</h1>
          <p className='mt-3 text-lg text-slate-500 dark:text-slate-400'>
            Have questions or need help? We're here for you.
          </p>
        </header>

        <div className='rounded-lg border border-slate-200 bg-white p-6 shadow-xl sm:p-8 dark:border-slate-700/50 dark:bg-slate-800/50'>
          <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
            <div>
              <label htmlFor='name' className='mb-1 block text-sm font-medium'>
                Your Name
              </label>
              <div className='relative'>
                <User className='absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500' />
                <Input
                  id='name'
                  {...register('name')}
                  placeholder='John Doe'
                  className='pl-10'
                  disabled={isSubmitting}
                />
              </div>
              {errors.name && (
                <p className='mt-1 text-xs text-red-500 dark:text-red-400'>{errors.name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor='email' className='mb-1 block text-sm font-medium'>
                Your Email
              </label>
              <div className='relative'>
                <Mail className='absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500' />
                <Input
                  id='email'
                  type='email'
                  {...register('email')}
                  placeholder='you@example.com'
                  className='pl-10'
                  disabled={isSubmitting}
                />
              </div>
              {errors.email && (
                <p className='mt-1 text-xs text-red-500 dark:text-red-400'>
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor='subject' className='mb-1 block text-sm font-medium'>
                Subject
              </label>
              <Input
                id='subject'
                {...register('subject')}
                placeholder='e.g., Issue with AI Assistant'
                disabled={isSubmitting}
              />
              {errors.subject && (
                <p className='mt-1 text-xs text-red-500 dark:text-red-400'>
                  {errors.subject.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor='message' className='mb-1 block text-sm font-medium'>
                Message
              </label>
              <Textarea
                id='message'
                {...register('message')}
                placeholder='Describe your issue or question...'
                rows={5}
                disabled={isSubmitting}
              />
              {errors.message && (
                <p className='mt-1 text-xs text-red-500 dark:text-red-400'>
                  {errors.message.message}
                </p>
              )}
            </div>

            <div>
              <Button
                type='submit'
                className='w-full bg-sky-500 text-white hover:bg-sky-600 dark:bg-sky-600 dark:hover:bg-sky-700'
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' /> Sending...
                  </>
                ) : (
                  <>
                    <Send size={16} className='mr-2' /> Send Message
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
        <p className='mt-8 text-center text-sm text-slate-500 dark:text-slate-400'>
          You can also find answers in our{' '}
          <Link href='#' className='text-sky-600 hover:underline dark:text-sky-400'>
            FAQ section
          </Link>{' '}
          (coming soon!).
        </p>
      </div>
    </div>
  );
};

export default ContactSupportPage;
