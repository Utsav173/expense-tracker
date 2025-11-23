'use client';

import React, { useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { gsap } from 'gsap';
import { Icon } from '../ui/icon';

const CallToActionSection = () => {
  const sectionRef = useRef(null);

  useEffect(() => {
    gsap.fromTo(
      sectionRef.current,
      { opacity: 0, y: 50 },
      {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
          toggleActions: 'play none none none'
        }
      }
    );
  }, []);

  return (
    <section ref={sectionRef} id='final-cta' className='relative overflow-hidden bg-background px-6 py-32'>
      {/* Background Glow */}
      <div className='pointer-events-none absolute top-1/2 left-1/2 -z-10 h-[60vw] w-[60vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-[120px]' />

      <div className='container mx-auto text-center'>
        <div className='section-content-anim mb-8 inline-block'>
          <div className='flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 shadow-xl shadow-primary/20 backdrop-blur-sm'>
            <Icon name='zap' className='h-10 w-10 text-primary' />
          </div>
        </div>
        <div className='section-content-anim'>
          <h2 className='text-5xl font-bold tracking-tighter text-foreground md:text-7xl'>
            Your Journey to <br />
            <span className='bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent'>
              Financial Freedom
            </span>{' '}
            Starts Now.
          </h2>
        </div>
        <div className='section-content-anim'>
          <p className='mx-auto mt-8 max-w-xl text-2xl font-medium text-muted-foreground'>
            All core features are free to use. Take the first step towards financial clarity today.
          </p>
        </div>
        <div className='section-content-anim mt-12 inline-block'>
          <Link href='/auth/signup'>
            <Button
              size='lg'
              className='relative h-16 overflow-hidden rounded-full bg-foreground px-12 text-xl font-bold text-background shadow-2xl transition-all hover:scale-105 hover:shadow-primary/25 dark:bg-white dark:text-black'
            >
              <div className='absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 transition-opacity hover:opacity-100' />
              Sign Up & Take Control
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CallToActionSection;
