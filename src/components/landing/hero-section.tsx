'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Mockup, MockupFrame } from '../ui/mockup';
import Image from 'next/image';
import { Glow } from '../ui/glow';
import { useTheme } from 'next-themes';

const HeroSection = () => {
  const mainRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  useGSAP(
    () => {
      gsap
        .timeline({ delay: 0.2 })
        .fromTo(
          '.hero-badge-anim',
          { opacity: 0, y: -20, scale: 0.9 },
          { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: 'power3.out' }
        )
        .fromTo(
          '.hero-headline-word',
          { opacity: 0, y: 40, filter: 'blur(5px)' },
          {
            opacity: 1,
            y: 0,
            filter: 'blur(0px)',
            duration: 1.2,
            ease: 'expo.out',
            stagger: 0.1
          },
          '-=0.4'
        )
        .fromTo(
          'p.hero-subtext-anim',
          { opacity: 0, y: 25 },
          { opacity: 1, y: 0, duration: 1, ease: 'power3.out' },
          '-=0.6'
        )
        .fromTo(
          '.hero-buttons-anim',
          { opacity: 0, y: 15, scale: 0.95 },
          { opacity: 1, y: 0, scale: 1, duration: 0.9, ease: 'back.out(1.2)' },
          '-=0.5'
        )
        .fromTo(
          '.hero-social-proof-mini',
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.8, ease: 'power1.inOut' },
          '-=0.4'
        );
    },
    { scope: mainRef }
  );

  return (
    <section
      ref={mainRef}
      // CHANGE IS ON THIS LINE: added 'flex-col' and adjusted padding
      className={cn(
        'hero-content-wrapper hero-gradient relative flex min-h-screen flex-col items-center justify-center overflow-hidden pt-24 pb-16 text-center sm:pt-32',
        'bg-background'
      )}
    >
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
          Expense Pro is your intelligent partner for mastering personal finance. Automate tracking,
          gain deep understanding, and achieve your financial goals with unprecedented ease.
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
      </div>
      {/* The mockup now correctly appears below the content above */}
      <div className='relative pt-16'>
        <MockupFrame className='animate-appear opacity-0 delay-700' size='small'>
          <Mockup type='responsive'>
            <Image
              src={
                theme === 'dark'
                  ? '/og-image-dashboard-desktop-dark.png'
                  : '/og-image-dashboard-desktop-light.png'
              }
              alt={'expense-pro-dashboard'}
              width={1248}
              height={765}
              priority
            />
          </Mockup>
        </MockupFrame>
        <Glow variant='top' className='animate-appear-zoom opacity-0 delay-1000' />
      </div>
    </section>
  );
};

export default HeroSection;
