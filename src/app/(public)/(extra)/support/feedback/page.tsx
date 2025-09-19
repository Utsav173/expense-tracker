'use client';

import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/lib/hooks/useToast';
import { submitContactForm } from '@/lib/endpoints/contact';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Icon } from '@/components/ui/icon';
import { WebPage, WithContext } from 'schema-dts';
import Script from 'next/script';

const feedbackFormSchema = z.object({
  experience: z.string().min(1, { message: 'Please select your experience.' }),
  suggestion: z.string().min(10, { message: 'Feedback must be at least 10 characters.' }).max(2000),
  email: z
    .string()
    .email({ message: 'Please enter a valid email address.' })
    .optional()
    .or(z.literal(''))
});

type FeedbackFormValues = z.infer<typeof feedbackFormSchema>;

const jsonLd: WithContext<WebPage> = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Feedback Page',
  url: 'https://expense-pro.khatriutsav.com/support/feedback',
  description: 'Page to submit feedback and suggestions for Expense Tracker.'
};

const FeedbackPage = () => {
  const { showSuccess, showError } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackFormSchema),
    defaultValues: {
      experience: '',
      suggestion: '',
      email: ''
    }
  });

  const onSubmit = async (data: FeedbackFormValues) => {
    setIsSubmitting(true);
    try {
      const payload = {
        name: data.email || 'Anonymous Feedback',
        email: data.email || 'no-reply@expensepro.app',
        subject: `Feedback: ${data.experience}`,
        message: `User Experience: ${data.experience}\n\nSuggestion:\n${data.suggestion}\n\nUser Email: ${data.email || 'Not Provided'}`
      };

      await submitContactForm(payload);
      showSuccess('Thank you for your feedback! We appreciate you helping us improve.');
      form.reset();
    } catch (error: any) {
      showError(error.message || 'Failed to send your feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Script
        id='json-ld'
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className='bg-background min-h-screen px-4 py-16'>
        <div className='container mx-auto max-w-2xl'>
          <div className='mb-12 text-center'>
            <Icon
              name='messageSquare'
              className='mx-auto mb-4 h-16 w-16 text-sky-500 dark:text-sky-400'
            />
            <h1 className='text-foreground text-4xl font-bold md:text-5xl'>Share Your Feedback</h1>
            <p className='text-muted-foreground mx-auto mt-4 max-w-2xl text-xl'>
              We're constantly working to improve Expense Pro. Your thoughts and suggestions are
              invaluable to us.
            </p>
          </div>

          <div className='border-border bg-card rounded-lg border p-6 shadow-lg sm:p-8'>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
              <Controller
                control={form.control}
                name='experience'
                render={({ field, fieldState }) => (
                  <div className='space-y-3'>
                    <Label>How would you rate your overall experience?</Label>
                    <ToggleGroup
                      type='single'
                      variant='outline'
                      className='grid w-full grid-cols-2 sm:grid-cols-4'
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isSubmitting}
                    >
                      <ToggleGroupItem value='Excellent' aria-label='Excellent' className='gap-2'>
                        <Icon name='thumbsUp' className='h-4 w-4' /> Excellent
                      </ToggleGroupItem>
                      <ToggleGroupItem value='Good' aria-label='Good'>
                        Good
                      </ToggleGroupItem>
                      <ToggleGroupItem value='Okay' aria-label='Okay'>
                        Okay
                      </ToggleGroupItem>
                      <ToggleGroupItem
                        value='Needs Improvement'
                        aria-label='Needs Improvement'
                        className='gap-2'
                      >
                        <Icon name='thumbsDown' className='h-4 w-4' /> Improvement
                      </ToggleGroupItem>
                    </ToggleGroup>
                    {fieldState.error && (
                      <p className='text-xs text-red-500 dark:text-red-400'>
                        {fieldState.error.message}
                      </p>
                    )}
                  </div>
                )}
              />

              <Controller
                control={form.control}
                name='suggestion'
                render={({ field, fieldState }) => (
                  <div className='space-y-3'>
                    <Label htmlFor='suggestion'>What could we do to improve your experience?</Label>
                    <Textarea
                      id='suggestion'
                      placeholder="I'd love to see a feature that... or it would be great if..."
                      rows={6}
                      disabled={isSubmitting}
                      {...field}
                    />
                    {fieldState.error && (
                      <p className='text-xs text-red-500 dark:text-red-400'>
                        {fieldState.error.message}
                      </p>
                    )}
                  </div>
                )}
              />

              <Controller
                control={form.control}
                name='email'
                render={({ field, fieldState }) => (
                  <div className='space-y-3'>
                    <Label htmlFor='email'>Your Email (Optional)</Label>
                    <Input
                      id='email'
                      type='email'
                      placeholder='So we can follow up if needed'
                      disabled={isSubmitting}
                      {...field}
                    />
                    {fieldState.error && (
                      <p className='text-xs text-red-500 dark:text-red-400'>
                        {fieldState.error.message}
                      </p>
                    )}
                  </div>
                )}
              />

              <div>
                <Button
                  type='submit'
                  className='cta-gradient w-full text-white'
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Icon name='loader2' className='mr-2 h-4 w-4 animate-spin' /> Sending
                      Feedback...
                    </>
                  ) : (
                    <>
                      <Icon name='send' className='mr-2' /> Submit Feedback
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default FeedbackPage;
