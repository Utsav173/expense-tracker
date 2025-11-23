'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { Button } from '@/components/ui/button';
import { Icon } from '../ui/icon';

const HeroSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const marqueeRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const blobs = gsap.utils.toArray('.aurora-blob');
      blobs.forEach((blob: any, i) => {
        gsap.to(blob, {
          x: 'random(-100, 100)',
          y: 'random(-50, 50)',
          scale: 'random(0.8, 1.2)',
          duration: 'random(10, 20)',
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: i * 2
        });
      });

      if (marqueeRef.current) {
        gsap.to(marqueeRef.current, {
          xPercent: -50,
          ease: 'none',
          duration: 20,
          repeat: -1
        });
      }

      const tl = gsap.timeline({ delay: 0.1 });
      tl.fromTo(
        '.hero-reveal',
        {
          y: 80,
          opacity: 0,
          filter: 'blur(10px)'
        },
        {
          y: 0,
          opacity: 1,
          filter: 'blur(0px)',
          duration: 1.2,
          stagger: 0.08,
          ease: 'power3.out'
        }
      );
    },
    { scope: containerRef }
  );

  const MarqueeContent = () => (
    <div className='flex shrink-0 items-center gap-8 px-4'>
      <span className='stroke-text text-7xl font-bold tracking-[-0.04em] text-transparent md:text-8xl'>
        Track • Save • Invest • Grow •
      </span>
      <span className='text-foreground/90 text-7xl font-bold tracking-[-0.04em] md:text-8xl'>
        Track • Save • Invest • Grow •
      </span>
    </div>
  );

  return (
    <section
      ref={containerRef}
      className='bg-background relative flex min-h-screen w-full flex-col justify-center overflow-hidden'
    >
      <div className='pointer-events-none absolute inset-0 z-0 overflow-hidden'>
        <div className='aurora-blob bg-primary/20 dark:bg-primary/10 absolute -top-[10%] -left-[10%] h-[60vh] w-[60vw] rounded-full mix-blend-multiply blur-[100px] dark:mix-blend-screen dark:blur-[120px]' />
        <div className='aurora-blob absolute top-[20%] -right-[10%] h-[50vh] w-[50vw] rounded-full bg-blue-500/20 mix-blend-multiply blur-[100px] dark:bg-blue-600/10 dark:mix-blend-screen dark:blur-[120px]' />
        <div className='aurora-blob absolute -bottom-[20%] left-[20%] h-[60vh] w-[60vw] rounded-full bg-purple-500/20 mix-blend-multiply blur-[100px] dark:bg-purple-500/10 dark:mix-blend-screen dark:blur-[120px]' />
        <div className='absolute inset-0 bg-[url("https://grainy-gradients.vercel.app/noise.svg")] opacity-[0.03]' />
      </div>

      <div className='relative z-10 container mx-auto px-4 md:px-6'>
        <div className='hero-reveal mb-8 flex justify-center md:justify-start'>
          <div className='border-border/50 bg-background/50 text-foreground hover:bg-muted/50 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium backdrop-blur-xl transition-colors'>
            <span className='relative flex h-2 w-2'>
              <span className='dark:bg-primary bg-income absolute inline-flex h-full w-full animate-ping rounded-full opacity-75'></span>
              <span className='dark:bg-income bg-primary relative inline-flex h-2 w-2 rounded-full'></span>
            </span>
            <span className='tracking-wide'>AI Financial Analyst</span>
          </div>
        </div>

        <div className='flex flex-col font-bold select-none'>
          <div className='hero-reveal overflow-hidden'>
            <h1 className='text-foreground text-[7vw] leading-[1] tracking-[-0.03em] max-sm:text-[14vw]'>
              Master
            </h1>
          </div>

          <div className='hero-reveal flex flex-wrap items-baseline gap-x-8 overflow-hidden leading-[1.2]'>
            <h1 className='from-primary dark:to-income to-primary/50 bg-linear-to-r bg-clip-text text-[8vw] tracking-[-0.05em] text-transparent max-sm:text-[14vw] dark:from-white'>
              Your
            </h1>
            <h1 className='text-foreground/50 font-serif text-[8vw] italic max-sm:text-[14vw]'>
              Money
            </h1>
          </div>
        </div>

        <div className='hero-reveal mt-10 grid items-end gap-8 md:grid-cols-2'>
          <p className='text-muted-foreground text-lg leading-relaxed font-medium md:text-xl'>
            Stop guessing, start knowing. Unlock predictive insights and automated budgeting to
            finally take full control of your wealth.
          </p>

          <div className='flex flex-col items-start gap-4 sm:flex-row md:justify-end'>
            <Link href='/auth/signup' className='w-full sm:w-auto'>
              <Button
                size='lg'
                className='group bg-foreground text-background relative h-14 w-full overflow-hidden rounded-full px-8 text-lg font-semibold shadow-lg transition-all hover:scale-105 hover:shadow-xl sm:w-auto dark:bg-white dark:text-black'
              >
                <div className='absolute inset-0 -translate-x-[100%] bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-1000 group-hover:translate-x-[100%]' />
                <span className='relative flex items-center gap-2'>
                  Get Started Free
                  <Icon
                    name='arrowRight'
                    className='h-5 w-5 transition-transform group-hover:translate-x-1'
                  />
                </span>
              </Button>
            </Link>

            <Link href='#how-it-works' className='w-full sm:w-auto'>
              <Button
                variant='ghost'
                size='lg'
                className='text-foreground hover:bg-muted/50 h-14 w-full rounded-full px-8 text-lg font-medium sm:w-auto'
              >
                How it works
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className='border-border/60 bg-background/20 absolute bottom-0 left-0 z-20 w-full overflow-hidden border-t backdrop-blur-sm'>
        <div className='flex w-max py-8 whitespace-nowrap' ref={marqueeRef}>
          <div className='flex'>
            <MarqueeContent />
            <MarqueeContent />
          </div>
          <div className='flex'>
            <MarqueeContent />
            <MarqueeContent />
          </div>
        </div>
      </div>

      <style jsx global>{`
        .stroke-text {
          -webkit-text-stroke: 1px var(--primary);
          color: transparent;
        }
        .dark .stroke-text {
          -webkit-text-stroke: 1px var(--income);
        }
      `}</style>
    </section>
  );
};

export default HeroSection;
