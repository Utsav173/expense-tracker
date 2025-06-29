'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { CheckCircle, CircleDashed, Mail } from 'lucide-react';
import { useToast } from '@/lib/hooks/useToast';
import { AnimatedFinancialElement } from '@/components/landing/animated-financial-element';
import { Badge } from '@/components/ui/badge';
import { Product, WithContext } from 'schema-dts';

const jsonLd: WithContext<Product> = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: 'Expense Tracker Pro',
  description: 'Advanced features for power users to manage their finances effectively.',
  offers: {
    '@type': 'Offer',
    price: '9.00',
    priceCurrency: 'USD',
    availability: 'https://schema.org/PreOrder'
  }
};

const PricingPage = () => {
  const { showSuccess, showError } = useToast();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const freeFeatures = [
    'Unlimited Accounts',
    'Transaction Tracking',
    'Standard Budgeting',
    'Savings Goals',
    'Standard Analytics Dashboard'
  ];

  const proFeatures = [
    'Everything in Free, plus:',
    'Advanced AI Insights & Automation',
    'Custom Report Builder',
    'Multi-user Account Sharing',
    'Unlimited API Integrations'
  ];

  const handleNotifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      showError('Please enter a valid email address.');
      return;
    }
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      showSuccess("You're on the list! We'll notify you when Pro is available.");
      setEmail('');
      setIsSubmitting(false);
    }, 1000);
  };

  return (
    <>
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className='bg-bg-default text-text-body min-h-screen px-4 py-24'>
        <div className='container mx-auto max-w-4xl text-center'>
          <AnimatedFinancialElement>
            <h1 className='text-text-heading text-4xl font-extrabold sm:text-5xl'>
              Choose Your Plan
            </h1>
            <p className='text-text-body mt-4 text-lg'>
              Start for free and unlock powerful features as you grow.
            </p>
          </AnimatedFinancialElement>

          <div className='mt-16 grid grid-cols-1 gap-8 md:grid-cols-2'>
            <AnimatedFinancialElement delay={0.1}>
              <Card className='flex h-full flex-col border-2 border-sky-500 shadow-2xl shadow-sky-500/10'>
                <CardHeader>
                  <CardTitle className='text-2xl font-bold text-sky-500'>Free</CardTitle>
                  <CardDescription>
                    For individuals starting to track their finances.
                  </CardDescription>
                </CardHeader>
                <CardContent className='flex-grow space-y-4'>
                  <p className='text-text-heading text-4xl font-bold'>
                    $0<span className='text-text-body text-base font-normal'>/month</span>
                  </p>
                  <ul className='space-y-3 text-left'>
                    {freeFeatures.map((feature) => (
                      <li key={feature} className='flex items-start'>
                        <CheckCircle className='mr-3 h-5 w-5 flex-shrink-0 text-green-500' />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button size='lg' className='cta-gradient w-full text-base font-semibold'>
                    Get Started for Free
                  </Button>
                </CardFooter>
              </Card>
            </AnimatedFinancialElement>

            <AnimatedFinancialElement delay={0.2}>
              <Card className='border-border/50 flex h-full flex-col bg-slate-100 dark:bg-slate-900'>
                <CardHeader>
                  <CardTitle className='text-text-heading flex items-center justify-center gap-2 text-2xl font-bold'>
                    Pro
                    <Badge variant='outline' className='border-amber-500 text-amber-500'>
                      Coming Soon
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    For power users who want advanced insights and automation.
                  </CardDescription>
                </CardHeader>
                <CardContent className='flex-grow space-y-4'>
                  <p className='text-text-heading text-4xl font-bold'>$9/month</p>
                  <ul className='space-y-3 text-left'>
                    {proFeatures.map((feature) => (
                      <li key={feature} className='text-text-body/80 flex items-start'>
                        <CircleDashed className='mr-3 h-5 w-5 flex-shrink-0' />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <form onSubmit={handleNotifySubmit} className='w-full space-y-3'>
                    <div className='relative'>
                      <Mail className='text-text-body/50 absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
                      <Input
                        type='email'
                        placeholder='Enter your email'
                        className='pl-10'
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                    <Button
                      type='submit'
                      variant='secondary'
                      className='w-full'
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Submitting...' : 'Notify Me'}
                    </Button>
                  </form>
                </CardFooter>
              </Card>
            </AnimatedFinancialElement>
          </div>
        </div>
      </div>
    </>
  );
};

export default PricingPage;
