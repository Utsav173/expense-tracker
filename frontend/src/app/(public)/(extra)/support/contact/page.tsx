'use client';

import React, { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, MessageSquare, User, Send, Loader2, LifeBuoy, BookUser } from 'lucide-react';
import { useToast } from '@/lib/hooks/useToast';
import { submitContactForm } from '@/lib/endpoints/contact';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import InfoPageLayout from '@/components/landing/info-page-layout';
import { ContactPage, WithContext } from 'schema-dts';

const contactFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }).max(100),
  email: z.string().email({ message: 'Please enter a valid email address.' }).max(100),
  subject: z.string().min(5, { message: 'Subject must be at least 5 characters.' }).max(150),
  message: z.string().min(10, { message: 'Message must be at least 10 characters.' }).max(2000)
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

const jsonLd: WithContext<ContactPage> = {
  '@context': 'https://schema.org',
  '@type': 'ContactPage',
  name: 'Expense Tracker Support',
  description: 'Contact page for Expense Tracker application.',
  url: 'https://expense-pro.vercel.app/support/contact'
};

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
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <InfoPageLayout
        title='Contact Support'
        subtitle="Have questions or need help? We're here for you."
        icon={<MessageSquare className='mx-auto mb-4 h-16 w-16 text-sky-500 dark:text-sky-400' />}
      >
        <div className='mx-auto mt-12 grid max-w-4xl grid-cols-1 gap-12 md:grid-cols-2'>
          {/* Contact Form */}
          <div className='border-border bg-card rounded-lg border p-6 shadow-lg sm:p-8'>
            <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
              <div>
                <label htmlFor='name' className='mb-1 block text-sm font-medium'>
                  Your Name
                </label>
                <div className='relative'>
                  <User className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
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
                  <Mail className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
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
                  className='cta-gradient w-full text-white'
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

          {/* Info Block */}
          <div className='space-y-8'>
            <div className='border-border bg-card rounded-lg border p-6 shadow-lg'>
              <h3 className='text-text-heading flex items-center gap-2 text-lg font-semibold'>
                <LifeBuoy className='h-5 w-5 text-sky-500' />
                Direct Contact
              </h3>
              <p className='text-text-body mt-2'>
                For urgent matters, you can reach us directly at:
              </p>
              <a
                href='mailto:support@expensepro.app'
                className='mt-3 inline-block font-medium text-sky-600 hover:underline dark:text-sky-400'
              >
                support@expensepro.app
              </a>
            </div>
            <div className='border-border bg-card rounded-lg border p-6 shadow-lg'>
              <h3 className='text-text-heading flex items-center gap-2 text-lg font-semibold'>
                <BookUser className='h-5 w-5 text-emerald-500' />
                Looking for Answers?
              </h3>
              <p className='text-text-body mt-2'>
                You might find what you&apos;re looking for in our FAQ section. We&apos;re building
                it out with answers to common questions.
              </p>
              <Button variant='outline' className='mt-4' disabled>
                Browse FAQs (Coming Soon)
              </Button>
            </div>
          </div>
        </div>
      </InfoPageLayout>
    </>
  );
};

export default ContactSupportPage;
