'use client';
import React from 'react';
import { Star } from 'lucide-react';
import { AnimatedFinancialElement } from './animated-financial-element';
import { cn } from '@/lib/utils';

interface TestimonialsSectionProps {
  className?: string;
}

const TestimonialsSection: React.FC<TestimonialsSectionProps> = ({ className }) => {
  const testimonials = [
    {
      quote:
        'Expense Pro has revolutionized how I manage my freelance income. The AI assistant is a game-changer for quick entries and insights!',
      name: 'Aisha K.',
      role: 'Freelance Designer'
    },
    {
      quote:
        'Finally, an app that handles investments, budgets, and everyday spending all in one place. The dashboard view is fantastic.',
      name: 'Rohan S.',
      role: 'Software Engineer'
    },
    {
      quote:
        "As someone juggling multiple accounts, Expense Pro's import feature and clear analytics have saved me hours. Highly recommend!",
      name: 'Priya M.',
      role: 'Small Business Owner'
    }
  ];

  return (
    <section className={cn('animated-section lp-bg-light-contrast-section px-6 py-20', className)}>
      <div className='container mx-auto'>
        <AnimatedFinancialElement className='section-title-anim mb-12 text-center'>
          <h2 className='lp-text-light-contrast-section-heading text-3xl font-bold tracking-tight sm:text-4xl'>
            Loved by Users Like You
          </h2>
        </AnimatedFinancialElement>
        <AnimatedFinancialElement className='section-subtitle-anim mb-16 text-center' delay={0.1}>
          <p className='lp-text-light-contrast-section-paragraph mt-4 text-lg'>
            See what our community is saying about Expense Pro.
          </p>
        </AnimatedFinancialElement>

        <div className='grid gap-8 md:grid-cols-3'>
          {testimonials.map((testimonial, index) => (
            <AnimatedFinancialElement
              key={testimonial.name}
              delay={0.1 * index}
              className='animated-card flex flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-700 dark:bg-slate-800'
            >
              <div className='mb-4 flex'>
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className='h-5 w-5 fill-yellow-400 text-yellow-400' />
                ))}
              </div>
              <blockquote className='flex-grow text-slate-700 dark:text-slate-300'>
                <p className='italic'>"{testimonial.quote}"</p>
              </blockquote>
              <footer className='mt-6 flex items-center'>
                <div className='mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-200'>
                  {testimonial.name.charAt(0)}
                </div>
                <div>
                  <p className='font-semibold text-slate-800 dark:text-slate-100'>
                    {testimonial.name}
                  </p>
                  <p className='text-sm text-slate-500 dark:text-slate-400'>{testimonial.role}</p>
                </div>
              </footer>
            </AnimatedFinancialElement>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
