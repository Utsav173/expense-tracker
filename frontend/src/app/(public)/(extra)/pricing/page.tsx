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
import { CheckCircle, Clock, Mail, Star } from 'lucide-react';
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
    'Unlimited expense tracking',
    'Basic budget creation',
    'Monthly spending reports',
    'Simple savings goals',
    'Mobile & web access'
  ];

  const proFeatures = [
    'Everything in Free',
    'AI-powered spending insights',
    'Advanced budget analytics',
    'Custom expense categories',
    'Multi-account management',
    'Export to Excel/PDF',
    'Priority email support'
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
      showSuccess("You're on the list! We'll notify you when Pro launches.");
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
      <div className='bg-background min-h-screen px-4 py-16'>
        <div className='container mx-auto max-w-6xl'>
          {/* Header Section */}
          <AnimatedFinancialElement>
            <div className='mb-16 text-center'>
              <h1 className='text-foreground mb-4 text-4xl font-bold md:text-5xl'>
                Simple, Transparent Pricing
              </h1>
              <p className='text-muted-foreground mx-auto max-w-2xl text-xl'>
                Start free and upgrade when you need more powerful features. No hidden fees, cancel
                anytime.
              </p>
            </div>
          </AnimatedFinancialElement>

          {/* Pricing Cards */}
          <div className='mx-auto grid max-w-4xl gap-8 lg:grid-cols-2'>
            {/* Free Plan */}
            <AnimatedFinancialElement delay={0.1}>
              <Card className='relative border-2 transition-shadow duration-300 hover:shadow-lg'>
                <CardHeader className='pb-8 text-center'>
                  <CardTitle className='text-foreground text-2xl font-bold'>Free Forever</CardTitle>
                  <CardDescription className='mt-2 text-base'>
                    Perfect for getting started with expense tracking
                  </CardDescription>
                  <div className='mt-6'>
                    <span className='text-foreground text-5xl font-bold'>$0</span>
                    <span className='text-muted-foreground ml-2'>/month</span>
                  </div>
                </CardHeader>

                <CardContent className='space-y-6'>
                  <div className='space-y-4'>
                    {freeFeatures.map((feature, index) => (
                      <div key={index} className='flex items-start gap-3'>
                        <CheckCircle className='text-primary mt-0.5 h-5 w-5 flex-shrink-0' />
                        <span className='text-foreground'>{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>

                <CardFooter className='pt-6'>
                  <Button
                    size='lg'
                    className='bg-primary hover:bg-primary/90 text-primary-foreground w-full font-semibold'
                  >
                    Start Free Today
                  </Button>
                </CardFooter>
              </Card>
            </AnimatedFinancialElement>

            {/* Pro Plan */}
            <AnimatedFinancialElement delay={0.2}>
              <Card className='border-primary bg-card relative border-2 transition-shadow duration-300 hover:shadow-lg'>
                {/* Popular Badge */}
                <div className='absolute -top-4 left-1/2 -translate-x-1/2 transform'>
                  <Badge className='bg-primary text-primary-foreground px-4 py-1 text-sm font-medium'>
                    <Star className='mr-1 h-3 w-3' />
                    Most Popular
                  </Badge>
                </div>

                <CardHeader className='pt-8 pb-8 text-center'>
                  <CardTitle className='text-foreground flex items-center justify-center gap-2 text-2xl font-bold'>
                    Pro
                    <Badge variant='secondary' className='text-xs'>
                      <Clock className='mr-1 h-3 w-3' />
                      Coming Soon
                    </Badge>
                  </CardTitle>
                  <CardDescription className='mt-2 text-base'>
                    Advanced features for serious financial management
                  </CardDescription>
                  <div className='mt-6'>
                    <span className='text-foreground text-5xl font-bold'>$9</span>
                    <span className='text-muted-foreground ml-2'>/month</span>
                  </div>
                  <p className='text-muted-foreground mt-2 text-sm'>
                    Billed monthly • Cancel anytime
                  </p>
                </CardHeader>

                <CardContent className='space-y-6'>
                  <div className='space-y-4'>
                    {proFeatures.map((feature, index) => (
                      <div key={index} className='flex items-start gap-3'>
                        <CheckCircle className='text-primary mt-0.5 h-5 w-5 flex-shrink-0' />
                        <span className='text-foreground font-medium'>{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>

                <CardFooter className='pt-6'>
                  <div className='w-full space-y-4'>
                    <form onSubmit={handleNotifySubmit} className='space-y-3'>
                      <div className='relative'>
                        <Mail className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform' />
                        <Input
                          type='email'
                          placeholder='Enter your email for early access'
                          className='h-12 pl-10'
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          disabled={isSubmitting}
                        />
                      </div>
                      <Button
                        type='submit'
                        size='lg'
                        variant='outline'
                        className='border-primary text-primary hover:bg-primary hover:text-primary-foreground h-12 w-full font-semibold'
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Adding you to the list...' : 'Get Notified When Available'}
                      </Button>
                    </form>
                    <p className='text-muted-foreground text-center text-xs'>
                      Be the first to know when Pro features launch
                    </p>
                  </div>
                </CardFooter>
              </Card>
            </AnimatedFinancialElement>
          </div>

          {/* Bottom CTA Section */}
          <AnimatedFinancialElement delay={0.3}>
            <div className='bg-muted/50 mt-16 rounded-lg p-8 text-center'>
              <h3 className='text-foreground mb-4 text-2xl font-bold'>
                Questions about our pricing?
              </h3>
              <p className='text-muted-foreground mx-auto mb-6 max-w-2xl'>
                Our Free plan includes everything you need to start tracking expenses. Upgrade to
                Pro when you're ready for advanced analytics and automation.
              </p>
              <Button variant='outline' size='lg'>
                Contact Support
              </Button>
            </div>
          </AnimatedFinancialElement>
        </div>
      </div>
    </>
  );
};

export default PricingPage;
