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
import { Badge } from '@/components/ui/badge';
import { Product, WebPage, WithContext } from 'schema-dts';
import Script from 'next/script';
import { motion, Variants } from 'framer-motion';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import ComingSoonModal from '@/components/modals/comming-soon-modal';
import { Icon } from '@/components/ui/icon';
import Link from 'next/link';

const jsonLd: WithContext<WebPage> = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Pricing - Expense Tracker',
  url: 'https://expense-pro.khatriutsav.com/pricing',
  mainEntity: {
    '@type': 'Product',
    name: 'Expense Tracker Pro',
    description: 'Unlock lifetime access to advanced financial management features.',
    sku: 'ET-PRO-LIFETIME',
    brand: {
      '@type': 'Brand',
      name: 'Expense Tracker'
    },
    offers: {
      '@type': 'Offer',
      price: '499.00',
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
      priceValidUntil: '2025-12-31',
      url: 'https://expense-pro.khatriutsav.com/pricing'
    },
    review: {
      '@type': 'Review',
      reviewRating: {
        '@type': 'Rating',
        ratingValue: '4.8',
        bestRating: '5'
      },
      author: {
        '@type': 'Person',
        name: 'John Doe'
      }
    }
  }
};

const PricingPage = () => {
  const [isComingSoonModalOpen, setIsComingSoonModalOpen] = useState(false);

  const freeFeatures = [
    'Unlimited Transactions',
    'Multiple Account Management',
    'Standard Budgeting & Goals',
    'Monthly Reports',
    'XLSX Data Export'
  ];

  const proFeatures = [
    'Everything in Free Plan',
    'AI Financial Assistant',
    'AI-Powered PDF Statement Imports',
    'Advanced Analytics & Forecasts',
    'Investment Portfolio Tracking',
    'Comprehensive Debt Management',
    'Account Sharing with Permissions',
    'Priority Support'
  ];

  const handlePurchaseClick = () => {
    setIsComingSoonModalOpen(true);
  };

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 50 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.2,
        duration: 0.6,
        ease: 'easeOut'
      }
    })
  };

  const faqs = [
    {
      question: 'Is the Pro plan really a one-time purchase?',
      answer:
        'Yes! You pay once and get lifetime access to all current and future Pro features. No subscriptions, no hidden fees.'
    },
    {
      question: 'What happens after I purchase?',
      answer:
        'Your account will be instantly upgraded to Pro status, unlocking all advanced features immediately. You will also receive a confirmation email.'
    },
    {
      question: 'Can I use the Free plan forever?',
      answer:
        'Absolutely. The Free plan is fully functional for essential expense tracking and is not a limited-time trial.'
    },
    {
      question: 'Do you offer refunds?',
      answer:
        'Due to the nature of the one-time purchase model providing lifetime access, we do not offer refunds. We encourage you to use the comprehensive Free plan to ensure Expense Pro is the right fit for you before upgrading.'
    }
  ];

  return (
    <>
      <Script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        id='json-ld'
      />
      <div className='bg-background min-h-screen px-4 py-16 sm:py-24'>
        <div className='container mx-auto max-w-6xl'>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className='mb-16 text-center'
          >
            <Badge variant='outline' className='border-primary/20 bg-primary/10 text-primary mb-4'>
              Simple Pricing, Lifelong Value
            </Badge>
            <h1 className='text-foreground mb-4 text-4xl font-bold tracking-tighter md:text-5xl'>
              Choose Your Path to Financial Clarity
            </h1>
            <p className='text-muted-foreground mx-auto max-w-2xl text-lg'>
              Start with powerful essentials for free, then unlock a lifetime of advanced AI tools
              with a single purchase.
            </p>
          </motion.div>

          <div className='mx-auto grid max-w-5xl items-stretch gap-8 lg:grid-cols-2'>
            <motion.div custom={0} initial='hidden' animate='visible' variants={cardVariants}>
              <Card className='flex h-full flex-col border-2 transition-shadow duration-300 hover:shadow-xl'>
                <CardHeader className='pb-8'>
                  <CardTitle className='text-foreground flex items-center gap-2 text-2xl font-bold'>
                    <Icon name='rocket' className='h-6 w-6' />
                    Start Your Journey
                  </CardTitle>
                  <CardDescription className='mt-2 text-base'>
                    All the essential tools to begin mastering your money.
                  </CardDescription>
                  <div className='mt-6'>
                    <span className='text-foreground text-5xl font-bold'>Free</span>
                    <span className='text-muted-foreground ml-2'>Forever</span>
                  </div>
                </CardHeader>
                <CardContent className='flex-grow space-y-4'>
                  {freeFeatures.map((feature, index) => (
                    <div key={index} className='flex items-start gap-3'>
                      <div className='bg-primary/10 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full'>
                        <Icon name='check' className='text-primary h-3.5 w-3.5' />
                      </div>
                      <span className='text-foreground'>{feature}</span>
                    </div>
                  ))}
                </CardContent>
                <CardFooter className='mt-8'>
                  <Link href='/auth/signup' className='w-full'>
                    <Button size='lg' variant='outline' className='w-full font-semibold'>
                      Get Started for Free
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            </motion.div>

            <motion.div custom={1} initial='hidden' animate='visible' variants={cardVariants}>
              <Card className='border-primary bg-card shadow-primary/10 relative flex h-full flex-col border-2 shadow-2xl'>
                <div className='absolute top-0 left-1/2 -z-10 h-full w-[200%] -translate-x-1/2 bg-[radial-gradient(circle_farthest-side_at_50%_0,hsl(var(--primary)/0.1),transparent)]' />
                <CardHeader className='pb-8'>
                  <Badge className='bg-primary text-primary-foreground absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 text-sm font-medium'>
                    <Icon name='star' className='mr-1 h-3 w-3' />
                    Lifetime Access
                  </Badge>
                  <CardTitle className='text-foreground flex items-center gap-2 text-2xl font-bold'>
                    <Icon name='zap' className='h-6 w-6' />
                    Unlock Pro
                  </CardTitle>
                  <CardDescription className='mt-2 text-base'>
                    Supercharge your finances with AI and advanced tools.
                  </CardDescription>
                  <div className='mt-6'>
                    <span className='text-foreground text-5xl font-bold'>₹499</span>
                    <span className='text-muted-foreground ml-2'>One-Time</span>
                  </div>
                </CardHeader>
                <CardContent className='flex-grow space-y-4'>
                  {proFeatures.map((feature, index) => (
                    <div key={index} className='flex items-start gap-3'>
                      <div className='bg-primary/10 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full'>
                        <Icon name='check' className='text-primary h-3.5 w-3.5' />
                      </div>
                      <span className='text-foreground font-medium'>{feature}</span>
                    </div>
                  ))}
                </CardContent>
                <CardFooter className='mt-8'>
                  <Button size='lg' className='w-full font-semibold' onClick={handlePurchaseClick}>
                    Get Lifetime Pro
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          </div>

          <div className='mx-auto mt-24 max-w-3xl text-center'>
            <h3 className='text-foreground mb-4 text-3xl font-bold'>Frequently Asked Questions</h3>
            <p className='text-muted-foreground mx-auto mb-8 max-w-2xl'>
              Find answers to common questions about our plans.
            </p>
            <Accordion type='single' collapsible className='w-full text-left'>
              {faqs.map((faq, i) => (
                <AccordionItem value={`item-${i}`} key={i}>
                  <AccordionTrigger className='font-semibold'>{faq.question}</AccordionTrigger>
                  <AccordionContent className='text-muted-foreground'>
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>

      <ComingSoonModal
        isOpen={isComingSoonModalOpen}
        onOpenChange={setIsComingSoonModalOpen}
        featureName='Pro Plan Purchase'
      />
    </>
  );
};

export default PricingPage;
