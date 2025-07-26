'use client';

import React, { Suspense, useRef } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const FinancialOrb = dynamic(
  () => import('@/components/landing/3d/financial-orb').then((mod) => mod.FinancialOrb),
  { ssr: false }
);

const HeroSection = () => {
  const mainRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // Your GSAP animations for the text content
      gsap.timeline({ delay: 0.2 }).fromTo(
        '.hero-content > *', // Target all direct children of the content div
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power3.out',
          stagger: 0.2 // Animate elements one after another
        }
      );
    },
    { scope: mainRef }
  );

  return (
    <section
      ref={mainRef}
      className={cn(
        'hero-gradient relative flex min-h-screen w-full items-center overflow-hidden',
        'bg-background'
      )}
    >
      {/* 3D Canvas positioned responsively */}
      <div
        className={cn(
          'absolute z-0',
          'hidden lg:top-[15%] lg:left-[20%] lg:block lg:h-[100%]',
          'md:right-0 md:bottom-0 md:block md:h-[40%] md:w-full',
          'sm:bottom-[-5%] sm:h-[30%]'
        )}
      >
        <Suspense fallback={null}>
          <FinancialOrb />
        </Suspense>
      </div>

      <div className='relative z-10 container mx-auto px-4 max-sm:mb-[120px] lg:px-8'>
        <div className='grid grid-cols-1 items-center lg:grid-cols-2'>
          {/* Column 1: Text Content */}
          <div className='hero-content text-center lg:pr-8 lg:text-left'>
            <div className='hero-badge-anim mb-6 lg:mb-8'>
              <Badge
                variant='outline'
                className='border-primary/20 bg-primary/10 text-primary hover:shadow-primary/20 rounded-full px-4 py-1.5 text-sm shadow-md backdrop-blur-sm transition-shadow'
              >
                <Sparkles className='text-primary mr-2 h-4 w-4' />
                Your Personal AI Financial Analyst
              </Badge>
            </div>

            <h1 className='text-foreground text-8xl font-extrabold max-sm:text-5xl'>
              <span className='hero-headline-word hero-text-glow inline-block'>Stop Guessing.</span>
              <br />
              <span className='hero-headline-word from-primary inline-block bg-gradient-to-r via-blue-500 to-sky-500 bg-clip-text leading-tight text-transparent'>
                Start Knowing.
              </span>
            </h1>

            <p className='hero-subtext-anim text-muted-foreground mx-auto mt-6 max-w-xl text-base leading-relaxed sm:text-lg lg:mx-0 lg:mt-8'>
              Go beyond simple tracking. Get predictive insights, automated budgeting from PDF
              statements, and actionable advice to finally take control of your money.
            </p>

            <div className='hero-buttons-anim mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row lg:mt-12 lg:justify-start'>
              <Link href='/auth/signup'>
                <Button
                  size='lg'
                  variant='cta'
                  className='group hover:shadow-primary/30 focus:ring-primary/50 dark:focus:ring-offset-background px-8 py-6 text-base font-semibold shadow-xl transition-all duration-300 hover:scale-105 focus:ring-4 focus:ring-offset-2 sm:px-10 sm:py-7 sm:text-lg'
                >
                  Get Started Free{' '}
                  <ArrowRight className='ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1' />
                </Button>
              </Link>
            </div>
          </div>

          {/* Column 2: Reserved for 3D content on desktop */}
          <div className='hidden lg:block'></div>
        </div>
      </div>

      {/* Mobile 3D Canvas - positioned at bottom */}
      <div
        className={cn(
          'absolute right-0 bottom-0 left-0 z-0',
          'block lg:hidden',
          'h-[35vh] sm:h-[40vh] md:h-[45vh]'
        )}
      >
        <Suspense fallback={null}>
          <FinancialOrb />
        </Suspense>
      </div>
    </section>
  );
};

export default HeroSection;
