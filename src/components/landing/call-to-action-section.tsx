'use client';

import React, { useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Zap } from 'lucide-react';
import { gsap } from 'gsap';

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
    <section ref={sectionRef} id='final-cta' className='bg-background px-6 py-28'>
      <div className='container mx-auto text-center'>
        <div className='section-content-anim mb-6 inline-block'>
          <div className='from-primary rounded-full bg-gradient-to-r to-blue-500 p-3 shadow-lg'>
            <Zap className='text-primary-foreground h-8 w-8' />
          </div>
        </div>
        <div className='section-content-anim'>
          <h2 className='text-foreground text-4xl leading-tight font-bold md:text-5xl'>
            Your Journey to Financial Freedom Starts Now.
          </h2>
        </div>
        <div className='section-content-anim'>
          <p className='text-muted-foreground mx-auto mt-6 max-w-xl text-lg'>
            All core features are free to use. Take the first step towards financial clarity today.
          </p>
        </div>
        <div className='section-content-anim mt-12 inline-block'>
          <Link href='/auth/signup'>
            <Button
              size='lg'
              className='hover:shadow-primary/40 focus:ring-primary/60 dark:focus:ring-offset-background px-12 py-4 text-xl font-semibold shadow-xl transition-all duration-300 hover:scale-105 focus:ring-4 focus:ring-offset-2'
            >
              Sign Up & Take Control
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CallToActionSection;
