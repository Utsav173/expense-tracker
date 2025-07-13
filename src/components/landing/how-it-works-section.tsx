'use client';
import React from 'react';
import { UserPlus, Link2, ListChecks, BarChartBig } from 'lucide-react';
import { AnimatedFinancialElement } from './animated-financial-element';
import { cn } from '@/lib/utils';

interface HowItWorksSectionProps {
  className?: string;
}

const HowItWorksSection: React.FC<HowItWorksSectionProps> = ({ className }) => {
  const steps = [
    {
      icon: <UserPlus className='h-10 w-10 text-sky-600 dark:text-sky-400' />,
      title: 'Sign Up & Secure',
      description: 'Quick registration. Your data is encrypted and protected from day one.'
    },
    {
      icon: <Link2 className='h-10 w-10 text-emerald-600 dark:text-emerald-400' />,
      title: 'Connect or Add Manually',
      description: 'Easily import transactions (XLSX, PDF) or add accounts and entries manually.'
    },
    {
      icon: <ListChecks className='h-10 w-10 text-amber-600 dark:text-amber-400' />,
      title: 'Track & Organize',
      description: 'Expenses are auto-categorized. Set budgets, goals, and manage debts with ease.'
    },
    {
      icon: <BarChartBig className='h-10 w-10 text-purple-600 dark:text-purple-400' />,
      title: 'Analyze & Understand',
      description: 'Visualize spending, track investments, and get AI-powered insights instantly.'
    }
  ];

  return (
    <section className={cn('animated-section lp-bg-light-contrast-section px-6 py-20', className)}>
      <div className='container mx-auto'>
        <AnimatedFinancialElement className='section-title-anim mb-16 text-center'>
          <h2 className='lp-text-light-contrast-section-heading text-3xl font-bold tracking-tight sm:text-4xl'>
            Get Started in Minutes
          </h2>
        </AnimatedFinancialElement>
        <AnimatedFinancialElement className='section-subtitle-anim mb-16 text-center' delay={0.1}>
          <p className='lp-text-light-contrast-section-paragraph mt-4 text-lg'>
            Achieving financial clarity is simpler than you think.
          </p>
        </AnimatedFinancialElement>

        <div className='grid gap-10 md:grid-cols-2 lg:grid-cols-4'>
          {steps.map((step, index) => (
            <AnimatedFinancialElement
              key={step.title}
              delay={0.1 * index}
              className='animated-card flex flex-col items-center text-center'
            >
              <div className='mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800'>
                {step.icon}
              </div>
              <h3 className='lp-text-light-contrast-section-heading mb-2 text-xl font-semibold'>
                {step.title}
              </h3>
              <p className='lp-text-light-contrast-section-paragraph text-sm'>{step.description}</p>
            </AnimatedFinancialElement>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
