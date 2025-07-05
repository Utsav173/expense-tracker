'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { Button } from '@/components/ui/button';
import { ArrowRight, ChevronDown, Sparkles, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Loader from '@/components/ui/loader';
import { Badge } from '@/components/ui/badge';
import { AnimatedFinancialElement } from '@/components/landing/animated-financial-element';
import ProblemSolutionSection from '@/components/landing/problem-solution-section';
import HowItWorksSection from '@/components/landing/how-it-works-section';
import TrustSecuritySection from '@/components/landing/trust-security-section';
import LandingPageHeader from '@/components/landing/landing-page-header';
import LandingPageFooter from '@/components/landing/landing-page-footer';
import FeaturesSection from '@/components/landing/features-section';
import TestimonialsSection from '@/components/landing/testimonials-section';
import { useIsMobile } from '@/hooks/use-mobile';
import { WebSite, WithContext } from 'schema-dts';
import Image from 'next/image';
import Script from 'next/script';

gsap.registerPlugin(useGSAP, ScrollTrigger);

const jsonLd: WithContext<WebSite> = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Expense Tracker',
  url: 'https://expense-pro.vercel.app/',
  description:
    'Expense Pro is your intelligent partner for mastering personal finance. Automate tracking, gain deep understanding, and achieve your financial goals with unprecedented ease.',
  potentialAction: {
    '@type': 'SearchAction',
    target: 'https://expense-pro.vercel.app/search?q={search_term_string}'
  }
};

const LandingPageContent = () => {
  const mainRef = useRef<HTMLDivElement>(null);
  const heroImageRef = useRef(null);
  const isMobile = useIsMobile();

  const { user, userIsLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!userIsLoading && user) {
      router.replace('/dashboard');
    }
  }, [user, userIsLoading, router]);

  const { contextSafe } = useGSAP({ scope: mainRef });

  useGSAP(
    () => {
      if (userIsLoading || user) return;

      gsap
        .timeline({ delay: 0.2 })
        .fromTo(
          '.hero-badge-anim',
          { opacity: 0, y: -20, scale: 0.9 },
          { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'back.out(1.7)' }
        )
        .fromTo(
          '.hero-headline-word',
          { opacity: 0, y: 40, filter: 'blur(5px)' },
          {
            opacity: 1,
            y: 0,
            filter: 'blur(0px)',
            duration: 1,
            ease: 'expo.out',
            stagger: 0.15
          },
          '-=0.3'
        )
        .fromTo(
          'p.hero-subtext-anim',
          { opacity: 0, y: 25 },
          { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' },
          '-=0.7'
        )
        .fromTo(
          '.hero-buttons-anim',
          { opacity: 0, y: 15, scale: 0.95 },
          { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: 'back.out(1.5)' },
          '-=0.5'
        )
        .fromTo(
          '.hero-social-proof-mini',
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.6, ease: 'power1.inOut' },
          '-=0.4'
        )
        .fromTo(
          '.hero-scroll-indicator-anim',
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.6, ease: 'power1.inOut', delay: 0.2 },
          '-=0.2'
        );

      gsap.fromTo(
        heroImageRef.current,
        { opacity: 0, y: 60, scale: 0.9, filter: 'blur(8px)' },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          filter: 'blur(0px)',
          duration: 1.4,
          ease: 'expo.out',
          delay: 0.7
        }
      );
    },
    { scope: mainRef, dependencies: [userIsLoading, user, isMobile] }
  );

  if (userIsLoading || (!userIsLoading && user)) {
    return (
      <div className='bg-background flex h-screen items-center justify-center'>
        <Loader />
      </div>
    );
  }

  return (
    <>
      <Script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        id='json-ld'
      />
      <div
        ref={mainRef}
        className={cn('min-h-screen overflow-x-hidden antialiased', 'bg-background')}
      >
        <LandingPageHeader />

        <section className='hero-content-wrapper hero-gradient relative flex min-h-screen items-center justify-center overflow-hidden pt-32 pb-24 text-center'>
          <div className='relative z-10 container mx-auto px-4'>
            <div className='hero-badge-anim mb-8'>
              <Badge
                variant='outline'
                className='border-primary/20 bg-primary/10 text-primary hover:shadow-primary/20 rounded-full px-4 py-1.5 text-sm shadow-md backdrop-blur-sm transition-shadow'
              >
                <Sparkles className='text-primary mr-2 h-4 w-4' />
                AI-Powered Financial Clarity Awaits
              </Badge>
            </div>
            <h1 className='text-foreground text-5xl font-extrabold sm:text-6xl md:text-7xl lg:text-8xl'>
              <span className='hero-headline-word hero-text-glow inline-block'>Master Your</span>{' '}
              <span className='hero-headline-word hero-text-glow inline-block'>Money.</span>
              <br />
              <span className='hero-headline-word from-primary inline-block bg-gradient-to-r via-blue-500 to-sky-500 bg-clip-text text-transparent'>
                Effortlessly.
              </span>
            </h1>
            <p className='hero-subtext-anim text-muted-foreground mx-auto mt-8 max-w-2xl text-lg leading-relaxed md:text-xl'>
              Expense Pro is your intelligent partner for mastering personal finance. Automate
              tracking, gain deep understanding, and achieve your financial goals with unprecedented
              ease.
            </p>
            <div className='hero-buttons-anim mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row'>
              <Link href='/auth/signup'>
                <Button
                  size='lg'
                  variant='cta'
                  className='group hover:shadow-primary/30 focus:ring-primary/50 dark:focus:ring-offset-background px-10 py-7 text-lg font-semibold shadow-xl transition-all duration-300 hover:scale-105 focus:ring-4 focus:ring-offset-2'
                >
                  Sign Up Free{' '}
                  <ArrowRight className='ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1' />
                </Button>
              </Link>
            </div>
            <p className='hero-social-proof-mini text-muted-foreground/80 mt-6 text-sm'>
              No credit card required. Start in seconds.
            </p>
            <a
              href='#dashboard-showcase'
              className='hero-scroll-indicator-anim mt-20 inline-block'
              aria-label='Scroll to dashboard showcase'
            >
              <ChevronDown className='text-muted-foreground mx-auto h-10 w-10 animate-bounce opacity-70' />
            </a>
          </div>
        </section>

        <section id='dashboard-showcase' className='relative mb-16 h-[75dvh] bg-slate-900'>
          <Image
            src='/og-image-dashboard-desktop.png'
            alt='Expense Pro Dashboard Mockup'
            fill
            className='rounded-lg border-2 border-white/10 shadow-2xl shadow-black/40'
            priority
            ref={heroImageRef}
          />
        </section>

        <ProblemSolutionSection />
        <FeaturesSection />
        <HowItWorksSection />
        <TrustSecuritySection />
        <TestimonialsSection />

        <section id='final-cta' className='bg-background px-6 py-28'>
          <div className='container mx-auto text-center'>
            <AnimatedFinancialElement className='section-content-anim mb-6 inline-block' delay={0}>
              <div className='from-primary rounded-full bg-gradient-to-r to-blue-500 p-3 shadow-lg'>
                <Zap className='text-primary-foreground h-8 w-8' />
              </div>
            </AnimatedFinancialElement>
            <AnimatedFinancialElement className='section-content-anim' delay={0.1}>
              <h2 className='text-foreground text-4xl leading-tight font-bold md:text-5xl'>
                Your Journey to Financial Freedom Starts Now.
              </h2>
            </AnimatedFinancialElement>
            <AnimatedFinancialElement className='section-content-anim' delay={0.2} y={20}>
              <p className='text-muted-foreground mx-auto mt-6 max-w-xl text-lg'>
                All core features are free to use. Take the first step towards financial clarity
                today.
              </p>
            </AnimatedFinancialElement>
            <AnimatedFinancialElement
              className='section-content-anim mt-12 inline-block'
              delay={0.3}
            >
              <Link href='/auth/signup'>
                <Button
                  variant='cta'
                  size='lg'
                  className='hover:shadow-primary/40 focus:ring-primary/60 dark:focus:ring-offset-background px-12 py-4 text-xl font-semibold shadow-xl transition-all duration-300 hover:scale-105 focus:ring-4 focus:ring-offset-2'
                >
                  Sign Up & Take Control
                </Button>
              </Link>
            </AnimatedFinancialElement>
          </div>
        </section>

        <LandingPageFooter />
      </div>
    </>
  );
};

const LandingPage = () => {
  return <LandingPageContent />;
};

export default LandingPage;
