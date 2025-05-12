'use client';
import React from 'react';
import { ShieldCheck, Lock, DatabaseZap, KeyRound } from 'lucide-react';
import { AnimatedFinancialElement } from './animated-financial-element';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface TrustSecuritySectionProps {
  className?: string;
}

const TrustSecuritySection: React.FC<TrustSecuritySectionProps> = ({ className }) => {
  const features = [
    {
      icon: <ShieldCheck className='h-8 w-8 text-green-500 dark:text-green-400' />,
      title: 'Bank-Level Security',
      description: 'We employ robust security measures to protect your financial data at all times.'
    },
    {
      icon: <Lock className='h-8 w-8 text-sky-500 dark:text-sky-400' />,
      title: 'Data Encryption',
      description:
        'Sensitive information, like your AI API keys, is stored with strong AES-GCM encryption.'
    },
    {
      icon: <DatabaseZap className='h-8 w-8 text-purple-500 dark:text-purple-400' />,
      title: 'You Control Your Data',
      description:
        'Easily manage your information, export your data, and control sharing permissions.'
    },
    {
      icon: <KeyRound className='h-8 w-8 text-amber-500 dark:text-amber-400' />,
      title: 'Privacy First',
      description: 'We are committed to your privacy. We do not sell your personal data. Ever.'
    }
  ];

  return (
    <section className={cn('animated-section lp-bg-dark-section px-6 py-20', className)}>
      <div className='container mx-auto'>
        <AnimatedFinancialElement className='section-title-anim mb-12 text-center'>
          <h2 className='lp-text-dark-section-heading text-3xl font-bold tracking-tight sm:text-4xl'>
            Your Trust, Our Priority
          </h2>
        </AnimatedFinancialElement>
        <AnimatedFinancialElement className='section-subtitle-anim mb-16 text-center' delay={0.1}>
          <p className='lp-text-dark-section-paragraph mt-4 text-lg'>
            We understand the sensitivity of financial data. Here’s how we protect yours.
          </p>
        </AnimatedFinancialElement>

        <div className='grid gap-8 md:grid-cols-2'>
          {features.map((feature, index) => (
            <AnimatedFinancialElement
              key={feature.title}
              delay={0.1 * index}
              className='animated-card dark:bg-slate-850/70 flex items-start gap-4 rounded-xl border border-slate-700/50 bg-slate-800/60 p-6 shadow-lg backdrop-blur-sm dark:border-slate-600/50'
            >
              <div className='mt-1 flex-shrink-0'>{feature.icon}</div>
              <div>
                <h3 className='lp-text-dark-section-heading mb-1 text-lg font-semibold'>
                  {feature.title}
                </h3>
                <p className='lp-text-dark-section-paragraph text-sm'>{feature.description}</p>
              </div>
            </AnimatedFinancialElement>
          ))}
        </div>
        <AnimatedFinancialElement delay={0.3} className='section-content-anim mt-12 text-center'>
          <p className='lp-text-dark-section-paragraph text-sm'>
            For more details, please review our{' '}
            <Link
              href='/legal/privacy-policy'
              className='text-sky-500 underline hover:text-sky-600 dark:text-sky-400 dark:hover:text-sky-300'
            >
              Privacy Policy
            </Link>
            .
          </p>
        </AnimatedFinancialElement>
      </div>
    </section>
  );
};

export default TrustSecuritySection;
