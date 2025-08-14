'use client';

import React, { Suspense, useRef } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Icon } from '../ui/icon';

// const FinancialOrb = dynamic(
//   () => import('@/components/landing/3d/financial-orb').then((mod) => mod.FinancialOrb),
//   { ssr: false }
// );

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
        'dark:bg-gray-950 dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(34,197,94,0.15),rgba(255,255,255,0))]',
        'bg-gray-50 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(34,197,94,0.1),rgba(255,255,255,0))]'
      )}
    >
      <div className='relative z-10 container mx-auto flex flex-col items-center justify-center px-4 pt-20 text-center max-sm:mb-40 sm:pt-24 lg:pt-0'>
        <div className='hero-anim'>
          <Badge variant='outline' className='border-primary/20 bg-primary/10 text-primary'>
            <Icon name='sparkles' className='mr-2 h-3 w-3' />
            Your Personal AI Financial Analyst
          </Badge>
        </div>

        <h1
          className={cn(
            'hero-anim hero-text-glow mt-6 text-5xl font-extrabold tracking-tighter md:text-7xl lg:text-8xl',
            'text-gray-900 dark:text-slate-50'
          )}
        >
          Master Your Money.
          <br />
          <span className='from-primary bg-gradient-to-r to-emerald-500 bg-clip-text text-transparent'>
            Effortlessly.
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
            <Button size='lg' className='group h-12 px-8 text-base font-bold'>
              Get Started for Free
              <Icon
                name='arrowRight'
                className='ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1'
              />
            </Button>
          </Link>
        </div>
      </div>

      <div
        className={cn(
          'absolute right-0 -bottom-20 left-0 z-0 h-[70vh] w-full max-sm:h-[55vh]',
          'dark:[mask-image:linear-gradient(to_top,rgba(0,0,0,1)_20%,transparent)]',
          '[mask-image:linear-gradient(to_top,rgba(249,250,251,1)_20%,transparent)]'
        )}
      >
        <Suspense fallback={null}>{/* <FinancialOrb /> */}</Suspense>
      </div>
    </section>
  );
};

export default HeroSection;
