'use client';

import React, { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/lib/hooks/useToast';
import { submitContactForm } from '@/lib/endpoints/contact';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { WebPage, WithContext } from 'schema-dts';
import Script from 'next/script';
import { Icon } from '@/components/ui/icon';
import Link from 'next/link';

const contactFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }).max(100),
  email: z.string().email({ message: 'Please enter a valid email address.' }).max(100),
  subject: z.string().min(5, { message: 'Subject must be at least 5 characters.' }).max(150),
  message: z.string().min(10, { message: 'Message must be at least 10 characters.' }).max(2000)
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

const jsonLd: WithContext<WebPage> = {
  '@context': 'https://schema.org',
  '@type': 'ContactPage',
  name: 'Expense Tracker Support',
  description:
    'Contact page for the Expense Tracker application. Get in touch with us for support, feedback, or any other inquiries.',
  url: 'https://expense-pro.khatriutsav.com/support/contact',
  areaServed: {
    '@type': 'Country',
    name: 'India'
  },
  contactType: 'Customer Service',
  breadcrumb: {
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://expense-pro.khatriutsav.com'
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Support',
        item: 'https://expense-pro.khatriutsav.com/support'
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: 'Contact',
        item: 'https://expense-pro.khatriutsav.com/support/contact'
      }
    ]
  }
} as any;

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
    <>
      <Script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        id='json-ld'
      />
      <div className='bg-background min-h-screen px-4 py-16'>
        <div className='container mx-auto max-w-4xl'>
          <div className='mb-12 text-center'>
            <Icon
              name='messageSquare'
              className='mx-auto mb-4 h-16 w-16 text-sky-500 dark:text-sky-400'
            />
            <h1 className='text-foreground text-4xl font-bold md:text-5xl'>Contact Support</h1>
            <p className='text-muted-foreground mx-auto mt-4 max-w-2xl text-xl'>
              Have questions or need help? We're here for you.
            </p>
          </div>

          <div className='mx-auto mt-12 grid max-w-4xl grid-cols-1 gap-12 md:grid-cols-2'>
            <div className='border-border bg-card rounded-lg border p-6 shadow-lg sm:p-8'>
              <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
                <div>
                  <label htmlFor='name' className='mb-1 block text-sm font-medium'>
                    Your Name
                  </label>
                  <div className='relative'>
                    <Icon
                      name='user'
                      className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2'
                    />
                    <Input
                      id='name'
                      {...register('name')}
                      placeholder='John Doe'
                      className='pl-10'
                      disabled={isSubmitting}
                    />
                  </div>
                  {errors.name && (
                    <p className='mt-1 text-xs text-red-500 dark:text-red-400'>
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor='email' className='mb-1 block text-sm font-medium'>
                    Your Email
                  </label>
                  <div className='relative'>
                    <Icon
                      name='mail'
                      className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2'
                    />
                    <Input
                      id='email'
                      type='email'
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
                    className='cta-gradient w-full text-white'
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Icon name='loader2' className='mr-2 h-4 w-4 animate-spin' /> Sending...
                      </>
                    ) : (
                      <>
                        <Icon name='send' className='mr-2' /> Send Message
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>

            <div className='space-y-8'>
              <div className='border-border bg-card rounded-lg border p-6 shadow-lg'>
                <h3 className='text-text-heading flex items-center gap-2 text-lg font-semibold'>
                  <Icon name='lifeBuoy' className='h-5 w-5 text-sky-500' />
                  Direct Contact
                </h3>
                <p className='text-text-body mt-2'>
                  For urgent matters, you can reach us directly at:
                </p>
                <a
                  href='mailto:khatriutsav63@gmail.com'
                  className='mt-3 inline-block font-medium text-sky-600 hover:underline dark:text-sky-400'
                >
                  khatriutsav63@gmail.com
                </a>
              </div>
              <div className='border-border bg-card rounded-lg border p-6 shadow-lg'>
                <h3 className='text-text-heading flex items-center gap-2 text-lg font-semibold'>
                  <Icon name='bookUser' className='h-5 w-5 text-emerald-500' />
                  Looking for Answers?
                </h3>
                <p className='text-text-body mt-2'>
                  You might find what you&apos;re looking for in our FAQ section. We&apos;re
                  building it out with answers to common questions.
                </p>
                <Link href='/help'>
                  <Button variant='outline' className='mt-4'>
                    Browse FAQs
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ContactSupportPage;
