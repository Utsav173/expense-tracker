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
      const tl = gsap.timeline({ delay: 0.3 });
      tl.fromTo(
        '.hero-anim',
        { opacity: 0, y: 25 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power3.out',
          stagger: 0.2
        }
      );
    },
    { scope: mainRef }
  );

  return (
    <section
      ref={mainRef}
      className={cn(
        'relative flex min-h-screen w-full items-center justify-center overflow-hidden',
        'dark:bg-gray-950 dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(34,197,94,0.3),rgba(255,255,255,0))]',
        'bg-gray-50 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(34,197,94,0.2),rgba(255,255,255,0))]'
      )}
    >
      <div className='relative z-10 container mx-auto flex flex-col items-center justify-center px-4 pt-20 text-center max-sm:mb-40 sm:pt-24 lg:pt-0'>
        <div className='hero-anim'>
          <Badge
            variant='outline'
            className={cn(
              'group relative border-2 px-6 py-2 font-semibold backdrop-blur-sm transition-all duration-300 hover:scale-105',
              'dark:border-green-400/40 dark:bg-green-900/30 dark:text-green-300 dark:hover:border-green-400/60 dark:hover:bg-green-900/50',
              'border-green-500/40 bg-green-100/60 text-green-800 hover:border-green-500/60 hover:bg-green-100/80',
              'shadow-lg shadow-green-500/20 hover:shadow-xl hover:shadow-green-500/30 dark:shadow-green-400/20 dark:hover:shadow-green-400/30'
            )}
          >
            <Sparkles className='mr-2 h-4 w-4 text-green-600 dark:text-green-400' />
            Your Personal AI Financial Analyst
          </Badge>
        </div>

        <h1
          className={cn(
            'hero-anim mt-6 text-5xl font-extrabold tracking-tighter md:text-7xl lg:text-8xl',
            'text-gray-900 dark:text-slate-50'
          )}
        >
          Stop Guessing.
          <br />
          <span className='bg-gradient-to-r from-green-500 to-teal-500 bg-clip-text text-transparent'>
            Start Knowing.
          </span>
        </h1>

        <p
          className={cn(
            'hero-anim mx-auto mt-6 max-w-xl text-base leading-relaxed sm:text-lg',
            'text-gray-600 dark:text-slate-400'
          )}
        >
          Go beyond simple tracking. Get predictive insights, automated budgeting from PDF
          statements, and actionable advice to finally take control of your money.
        </p>

        <div className='hero-anim mt-10'>
          <Link href='/auth/signup'>
            <Button
              size='lg'
              className={cn(
                'group relative h-14 w-full px-8 text-lg font-bold transition-all duration-300 sm:w-auto',
                'overflow-hidden rounded-full',
                'bg-gradient-to-r from-green-500 to-emerald-500 text-white',
                'shadow-xl shadow-green-500/30 hover:shadow-2xl hover:shadow-green-500/40',
                'hover:scale-105 hover:from-green-400 hover:to-emerald-400',
                'before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent',
                'before:translate-x-[-200%] before:transition-transform before:duration-700 hover:before:translate-x-[200%]'
              )}
            >
              <span className='relative z-10 flex items-center'>
                Get Started Free
                <ArrowRight className='ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1' />
              </span>
            </Button>
          </Link>
        </div>
      </div>

      <div
        className={cn(
          'absolute right-0 -bottom-20 left-0 z-0 h-[70vh] w-full max-sm:h-[55vh]',
          'dark:[mask-image:linear-gradient(to_top,white,transparent)]',
          '[mask-image:linear-gradient(to_top,rgba(255,255,255,0.95),transparent)]'
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
