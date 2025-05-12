'use client';

import { useEffect, useRef, useLayoutEffect } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  CreditCard,
  Target,
  Sparkles,
  TrendingUp,
  BrainCircuit,
  PieChart as PieChartIcon,
  Send,
  Zap,
  CheckCircle,
  ChevronDown,
  Loader2,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Loader from '@/components/ui/loader';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';

import { AnimatedFinancialElement } from '@/components/landing/animated-financial-element';
import DashboardMockup from '@/components/landing/dashboard-mockup';
import AnimatedFeatureCardV2 from '@/components/landing/animated-feature-card-v2';
import ProblemSolutionSection from '@/components/landing/problem-solution-section';
import HowItWorksSection from '@/components/landing/how-it-works-section';
import TrustSecuritySection from '@/components/landing/trust-security-section';
import TestimonialsSection from '@/components/landing/testimonials-section';
import { ThemeProvider } from '@/components/providers/theme-provider';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const LandingPageContent = () => {
  const mainRef = useRef<HTMLDivElement>(null);
  const heroContentRef = useRef<HTMLDivElement>(null);
  const heroImageRef = useRef<HTMLDivElement>(null);

  const { user, userIsLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!userIsLoading && user) {
      router.replace('/dashboard');
    }
  }, [user, userIsLoading, router]);

  useLayoutEffect(() => {
    if (userIsLoading || user || !mainRef.current) return;

    const ctx = gsap.context(() => {
      if (heroContentRef.current) {
        gsap
          .timeline({ delay: 0.2 })
          .fromTo(
            heroContentRef.current.querySelector('.hero-badge-anim'),
            { opacity: 0, y: -20, scale: 0.9 },
            { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'back.out(1.7)' }
          )
          .fromTo(
            heroContentRef.current.querySelector('h1'),
            { opacity: 0, y: 30, filter: 'blur(4px)' },
            { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.9, ease: 'expo.out' },
            '-=0.3'
          )
          .fromTo(
            heroContentRef.current.querySelector('p.hero-subtext-anim'),
            { opacity: 0, y: 25 },
            { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' },
            '-=0.5'
          )
          .fromTo(
            heroContentRef.current.querySelector('.hero-buttons-anim'),
            { opacity: 0, y: 15, scale: 0.95 },
            { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'back.out(1.5)' },
            '-=0.4'
          )
          .fromTo(
            heroContentRef.current.querySelector('.hero-social-proof-mini'),
            { opacity: 0, y: 10 },
            { opacity: 1, y: 0, duration: 0.5, ease: 'power1.inOut' },
            '-=0.3'
          )
          .fromTo(
            heroContentRef.current.querySelector('.hero-scroll-indicator-anim'),
            { opacity: 0, y: 10 },
            { opacity: 1, y: 0, duration: 0.5, ease: 'power1.inOut', delay: 0.2 },
            '-=0.2'
          );
      }

      if (heroImageRef.current) {
        gsap.fromTo(
          heroImageRef.current,
          { opacity: 0, y: 50, scale: 0.95, filter: 'blur(6px)' },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            filter: 'blur(0px)',
            duration: 1.2,
            ease: 'expo.out',
            delay: 0.5
          }
        );
      }

      const heroCurrent = heroContentRef.current;
      if (heroCurrent) {
        const handleMouseMove = (e: MouseEvent) => {
          const { clientX, clientY } = e;
          const { innerWidth, innerHeight } = window;
          const xPercent = (clientX / innerWidth - 0.5) * 2;
          const yPercent = (clientY / innerHeight - 0.5) * 2;
          gsap.to('.hero-bg-gradient-dynamic', {
            duration: 1.5,
            x: xPercent * -20,
            y: yPercent * -20,
            ease: 'power1.out'
          });
          gsap.to(heroImageRef.current, {
            duration: 1.5,
            x: xPercent * 8,
            y: yPercent * 5,
            rotateX: yPercent * -1.5,
            rotateY: xPercent * 1.5,
            ease: 'power1.out'
          });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
      }
    }, mainRef);

    return () => {
      ctx.revert();
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, [userIsLoading, user]);

  const features = [
    {
      icon: <CreditCard size={28} className='text-sky-500 dark:text-sky-400' />,
      title: 'All Accounts, One View',
      description:
        'Securely link banks, cards, and investments for a complete financial overview. No more app-switching!'
    },
    {
      icon: <PieChartIcon size={28} className='text-emerald-500 dark:text-emerald-400' />,
      title: 'Insightful Analytics',
      description:
        'Understand your spending with beautiful charts, smart categorization, and trend reports.'
    },
    {
      icon: <Target size={28} className='text-amber-500 dark:text-amber-400' />,
      title: 'Goal-Oriented Savings',
      description:
        'Set, track, and achieve your financial milestones faster with clear progress visualization.'
    },
    {
      icon: <TrendingUp size={28} className='text-rose-500 dark:text-rose-400' />,
      title: 'Smart Investment Tracking',
      description:
        'Monitor your portfolio, track holdings, and see performance. Integrates with finance APIs.'
    },
    {
      icon: <FileText size={28} className='text-indigo-500 dark:text-indigo-400' />,
      title: 'Effortless Data Import',
      description:
        'Bring in transactions from XLSX or even PDF bank statements. Say goodbye to manual entry.'
    },
    {
      icon: <BrainCircuit size={28} className='text-teal-500 dark:text-teal-400' />,
      title: 'Your Personal Finance AI',
      description:
        'Ask questions, add expenses, get insights via chat. Securely use your own AI provider keys.'
    }
  ];

  if (userIsLoading || (!userIsLoading && user)) {
    return (
      <div className='flex h-screen items-center justify-center bg-[--background]'>
        <Loader />
      </div>
    );
  }

  return (
    <div
      ref={mainRef}
      className={cn(
        'min-h-screen overflow-x-hidden antialiased',
        'bg-[--background] text-[--foreground]'
      )}
    >
      <header className='glassmorphism-nav fixed top-0 left-0 z-50 w-full px-4 py-4 backdrop-blur-sm sm:px-6'>
        <div className='container mx-auto flex items-center justify-between'>
          <Link href='/' className='flex items-center gap-2 text-2xl font-bold'>
            <Image
              src='/favicon.svg'
              alt='Expense Pro Logo'
              width={32}
              height={32}
              className='transition-transform duration-300 hover:rotate-12'
            />
            <span className='bg-gradient-to-r from-sky-400 to-cyan-300 bg-clip-text text-transparent max-sm:text-sm'>
              Expense Pro
            </span>
          </Link>
          <nav className='hidden items-center gap-4 md:flex'>
            <Link
              href='#features'
              className='text-sm font-medium text-[--muted-foreground] transition-colors hover:text-sky-600 dark:hover:text-sky-400'
            >
              Features
            </Link>
            <Link
              href='#how-it-works'
              className='text-sm font-medium text-[--muted-foreground] transition-colors hover:text-sky-600 dark:hover:text-sky-400'
            >
              How It Works
            </Link>
            <Link
              href='/support/contact'
              className='text-sm font-medium text-[--muted-foreground] transition-colors hover:text-sky-600 dark:hover:text-sky-400'
            >
              Contact
            </Link>
          </nav>
          <div className='flex items-center gap-1'>
            <Link href='/auth/login'>
              <Button
                variant='ghost'
                size='sm'
                className='text-sm text-[--muted-foreground] transition-colors hover:bg-[--accent] hover:text-sky-600 dark:hover:text-sky-400'
              >
                Login
              </Button>
            </Link>
            <Link href='/auth/signup'>
              <Button
                size='sm'
                className='bg-gradient-to-r from-sky-500 to-cyan-500 text-sm text-white shadow-md transition-all hover:from-sky-600 hover:to-cyan-600 hover:shadow-sky-500/40'
              >
                Sign Up Free
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <section
        ref={heroContentRef}
        className='lp-bg-hero hero-content-wrapper relative flex min-h-screen items-center justify-center overflow-hidden pt-32 pb-24 text-center'
      >
        <div className='hero-bg-gradient-dynamic pointer-events-none absolute inset-[-150px] z-0 opacity-60 dark:opacity-40'></div>
        <div className='relative z-10 container mx-auto px-4'>
          <div className='hero-badge-anim mb-8'>
            <Badge
              variant='outline'
              className='rounded-full border-sky-500/40 bg-sky-500/10 px-4 py-1.5 text-sm text-sky-600 shadow-md backdrop-blur-sm transition-shadow hover:shadow-sky-400/20 dark:border-sky-400/30 dark:bg-sky-400/5 dark:text-sky-300'
            >
              <Sparkles className='mr-2 h-4 w-4 text-sky-500 dark:text-sky-400' /> AI-Powered
              Financial Clarity Awaits
            </Badge>
          </div>
          <h1 className='lp-text-hero-heading hero-text-glow text-5xl font-extrabold sm:text-6xl md:text-7xl lg:text-8xl'>
            Master Your Money.
            <br />
            <span className='bg-gradient-to-r from-sky-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent'>
              Effortlessly.
            </span>
          </h1>
          <p className='lp-text-hero-paragraph hero-subtext-anim mx-auto mt-8 max-w-2xl text-lg leading-relaxed md:text-xl'>
            Expense Pro is your intelligent partner for mastering personal finance. Automate
            tracking, gain deep understanding, and achieve your financial goals with unprecedented
            ease.
          </p>
          <div className='hero-buttons-anim mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row'>
            <Link href='/auth/signup'>
              <Button
                size='lg'
                className='group bg-gradient-to-r from-sky-500 to-cyan-400 px-10 py-7 text-lg font-semibold text-white shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-sky-500/60 focus:ring-4 focus:ring-sky-400/50 focus:ring-offset-2 dark:focus:ring-offset-[--background]'
              >
                Sign Up Free{' '}
                <ArrowRight className='ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1' />
              </Button>
            </Link>
          </div>
          <p className='lp-text-hero-paragraph hero-social-proof-mini mt-6 text-sm opacity-80'>
            No credit card required. Start in seconds.
          </p>
          <a
            href='#dashboard-showcase'
            className='hero-scroll-indicator-anim mt-20 inline-block'
            aria-label='Scroll to dashboard showcase'
          >
            <ChevronDown className='mx-auto h-10 w-10 animate-bounce text-[--muted-foreground] opacity-70' />
          </a>
        </div>
      </section>

      <section id='dashboard-showcase' className='lp-bg-dark-section relative px-4 py-16 md:py-24'>
        <div ref={heroImageRef} className='perspective container mx-auto'>
          <DashboardMockup />
        </div>
      </section>

      <ProblemSolutionSection />

      <section id='features' className='animated-section lp-bg-dark-section px-6 py-24'>
        <div className='container mx-auto'>
          <AnimatedFinancialElement className='section-title-anim mb-12 text-center'>
            <h2 className='lp-text-dark-section-heading text-4xl font-bold md:text-5xl'>
              Powerful Features, Simple Interface
            </h2>
          </AnimatedFinancialElement>
          <AnimatedFinancialElement className='section-subtitle-anim mb-16 text-center' delay={0.1}>
            <p className='lp-text-dark-section-paragraph mx-auto mt-6 max-w-2xl text-lg'>
              Expense Pro provides comprehensive tools in a user-friendly package to help you manage
              every aspect of your finances.
            </p>
          </AnimatedFinancialElement>
          <div className='grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3'>
            {features.map((feature, i) => (
              <AnimatedFeatureCardV2
                key={feature.title}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                delay={i * 0.08}
                className='animated-card border-[--border] bg-[--card]/70 hover:border-sky-500/60 dark:hover:border-sky-400/50'
              />
            ))}
          </div>
        </div>
      </section>

      <HowItWorksSection />

      <section className='animated-section lp-bg-dark-section px-6 py-28'>
        <div className='container mx-auto'>
          <div className='grid items-center gap-16 lg:grid-cols-2'>
            <AnimatedFinancialElement className='section-content-anim'>
              <Badge
                variant='outline'
                className='mb-6 rounded-full border-sky-500/40 bg-sky-500/10 px-4 py-2 text-base text-sky-500 shadow-md backdrop-blur-sm dark:border-sky-400/30 dark:bg-sky-400/5 dark:text-sky-300'
              >
                <Zap className='mr-2 h-5 w-5' />
                Intelligent Finance
              </Badge>
              <h2 className='lp-text-dark-section-heading text-4xl leading-tight font-bold md:text-5xl'>
                Chat Your Way to
                <br />
                Financial Clarity.
              </h2>
              <p className='lp-text-dark-section-paragraph mt-6 mb-10 text-lg leading-relaxed'>
                Our cutting-edge AI assistant understands your financial queries and commands. Add
                expenses, check budgets, or get insights, all through simple conversation. Securely
                use your own AI provider keys.
              </p>
              <div className='space-y-4 rounded-xl border border-[--border-active] bg-[--card]/40 p-6 shadow-xl backdrop-blur-md'>
                {[
                  {
                    text: "Log a ₹1200 dinner at 'The Great Eatery'",
                    icon: <CreditCard size={20} className='text-sky-400' />
                  },
                  {
                    text: "What's my remaining travel budget for July?",
                    icon: <Target size={20} className='text-sky-400' />
                  },
                  {
                    text: "Show my portfolio's performance this year.",
                    icon: <TrendingUp size={20} className='text-sky-400' />
                  }
                ].map((item, i) => (
                  <div
                    key={i}
                    className='flex items-center gap-4 rounded-lg bg-[--muted]/50 p-3 shadow-sm transition-shadow hover:shadow-md'
                  >
                    <div className='flex h-10 w-10 items-center justify-center rounded-full bg-sky-500/10 dark:bg-sky-400/10'>
                      {item.icon}
                    </div>
                    <span className='lp-text-dark-section-paragraph text-md'>{item.text}</span>
                  </div>
                ))}
              </div>
            </AnimatedFinancialElement>
            <AnimatedFinancialElement
              className='section-content-anim relative mt-12 lg:mt-0'
              delay={0.15}
            >
              <div className='relative mx-auto h-[450px] w-full max-w-md overflow-hidden rounded-2xl border border-[--border-active] bg-[--card]/80 p-4 shadow-2xl backdrop-blur-sm'>
                <div className='absolute inset-x-0 top-0 flex h-8 items-center bg-[--muted]/80 px-3'>
                  <div className='flex gap-1.5'>
                    <span className='h-2.5 w-2.5 rounded-full bg-[--border]'></span>
                    <span className='h-2.5 w-2.5 rounded-full bg-[--border]'></span>
                    <span className='h-2.5 w-2.5 rounded-full bg-[--border]'></span>
                  </div>
                </div>
                <div className='flex h-full flex-col pt-8'>
                  <div className='no-scrollbar flex-grow space-y-4 overflow-y-auto p-3'>
                    <div className='flex justify-end'>
                      <div className='max-w-[80%] rounded-xl rounded-br-sm bg-sky-600 p-3 text-sm text-white shadow-md'>
                        How much did I spend on food last month?
                      </div>
                    </div>
                    <div className='flex justify-start'>
                      <div className='max-w-[80%] rounded-xl rounded-bl-sm bg-[--muted] p-3 text-sm text-[--foreground] shadow-md'>
                        <Loader2 className='mr-2 inline-block h-4 w-4 animate-spin' /> Thinking...
                      </div>
                    </div>
                    <div className='ai-reply-anim flex justify-start opacity-0'>
                      <div className='max-w-[80%] rounded-xl rounded-bl-sm bg-[--muted] p-3 text-sm text-[--foreground] shadow-md'>
                        You spent ₹8,570 on food last month. Your top category was 'Dining Out' at
                        ₹4,200.
                      </div>
                    </div>
                  </div>
                  <div className='mt-auto flex items-center rounded-lg border border-[--border-active] bg-[--input]/80 p-2'>
                    <input
                      type='text'
                      placeholder='Ask Expense Pro AI...'
                      className='flex-1 bg-transparent text-sm text-[--input-foreground] placeholder:text-[--muted-foreground] focus:outline-none'
                      disabled
                    />
                    <Button size='icon' variant='ghost' className='text-sky-400' disabled>
                      <Send className='h-5 w-5' />
                    </Button>
                  </div>
                </div>
              </div>
              <div className='absolute -right-10 -bottom-10 -z-10 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl dark:bg-cyan-600/15'></div>
              <div className='absolute -top-10 -left-10 -z-10 h-64 w-64 rounded-full bg-sky-500/10 blur-3xl dark:bg-sky-600/15'></div>
            </AnimatedFinancialElement>
          </div>
        </div>
      </section>

      <TrustSecuritySection />
      <TestimonialsSection />

      <section id='pricing' className='animated-section lp-bg-cta-section px-6 py-28'>
        <div className='container mx-auto text-center'>
          <AnimatedFinancialElement
            className='section-content-anim mb-6 inline-block rounded-full bg-gradient-to-r from-lime-500 to-green-500 p-3 shadow-lg'
            delay={0}
          >
            <CheckCircle className='h-8 w-8 text-white' />
          </AnimatedFinancialElement>
          <AnimatedFinancialElement className='section-content-anim' delay={0.1}>
            <h2 className='lp-text-cta-heading text-4xl leading-tight font-bold md:text-5xl'>
              Your Journey to Financial Freedom Starts Now.
            </h2>
          </AnimatedFinancialElement>
          <AnimatedFinancialElement className='section-content-anim' delay={0.2} y={20}>
            <p className='lp-text-cta-paragraph mx-auto mt-6 max-w-xl text-lg'>
              Expense Pro's core features are free to use. Unlock advanced capabilities with our
              optional Pro plan (coming soon!).
            </p>
          </AnimatedFinancialElement>
          <AnimatedFinancialElement className='section-content-anim mt-12 inline-block' delay={0.3}>
            <Link href='/auth/signup'>
              <Button
                size='lg'
                className='bg-gradient-to-r from-lime-400 to-green-500 px-12 py-4 text-xl font-semibold text-white shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-lime-500/50 focus:ring-4 focus:ring-lime-400/60 focus:ring-offset-2 dark:focus:ring-offset-[--background]'
              >
                Sign Up Free & Take Control
              </Button>
            </Link>
            <p className='lp-text-cta-paragraph mt-4 text-sm opacity-80'>
              Basic tracking & budgeting are always free. No credit card needed.
            </p>
          </AnimatedFinancialElement>
        </div>
      </section>

      <footer className='lp-bg-footer px-6 py-12 text-center text-sm'>
        <div className='container mx-auto'>
          <p className='lp-text-footer'>
            © {new Date().getFullYear()} Expense Pro. All rights reserved. Built with passion &
            precision.
          </p>
          <div className='mt-4 flex justify-center gap-6'>
            <Link
              href='/legal/privacy-policy'
              className='lp-text-footer transition-colors hover:text-sky-500 dark:hover:text-sky-400'
            >
              Privacy Policy
            </Link>
            <Link
              href='/legal/terms-of-service'
              className='lp-text-footer transition-colors hover:text-sky-500 dark:hover:text-sky-400'
            >
              Terms of Service
            </Link>
            <Link
              href='/support/contact'
              className='lp-text-footer transition-colors hover:text-sky-500 dark:hover:text-sky-400'
            >
              Contact Support
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

const LandingPage = () => {
  return (
    <ThemeProvider attribute='class' defaultTheme='system' enableSystem disableTransitionOnChange>
      <LandingPageContent />
    </ThemeProvider>
  );
};

export default LandingPage;
