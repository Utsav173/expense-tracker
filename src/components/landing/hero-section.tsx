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
      const blobs = gsap.utils.toArray<HTMLElement>('.aurora-blob');

      blobs.forEach((blob, i) => {
        // Set initial inline styles for colors (so GSAP can animate them)
        const colors = [
          { from: 'rgba(var(--primary-rgb), 0.2)', to: 'rgba(147, 51, 234, 0.25)' },
          { from: 'rgba(59, 130, 246, 0.2)', to: 'rgba(6, 182, 212, 0.25)' },
          { from: 'rgba(168, 85, 247, 0.2)', to: 'rgba(236, 72, 153, 0.25)' }
        ];

        gsap.set(blob, { backgroundColor: colors[i]?.from || colors[0].from });

        // Position and transform animation
        gsap.to(blob, {
          x: gsap.utils.random(-150, 150),
          y: gsap.utils.random(-80, 80),
          scale: gsap.utils.random(0.7, 1.3),
          rotation: gsap.utils.random(-20, 20),
          duration: gsap.utils.random(12, 18),
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: i * 1.5
        });

        // Separate color animation with different timing
        gsap.to(blob, {
          backgroundColor: colors[i]?.to || colors[0].to,
          duration: gsap.utils.random(8, 14),
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: i * 2
        });

        // Scale pulse animation (layered)
        gsap.to(blob, {
          scale: '+=0.15',
          duration: gsap.utils.random(4, 6),
          repeat: -1,
          yoyo: true,
          ease: 'power1.inOut',
          delay: i * 0.5
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
      {/* Aurora blobs - using inline styles for GSAP color animation */}
      <div className='pointer-events-none absolute inset-0 z-0 overflow-hidden'>
        <div
          className='aurora-blob absolute -top-[10%] -left-[10%] h-[60vh] w-[60vw] rounded-full mix-blend-multiply blur-[100px] dark:mix-blend-screen dark:blur-[120px]'
          style={{ backgroundColor: 'rgba(var(--primary-rgb, 34, 197, 94), 0.2)' }}
        />
        <div
          className='aurora-blob absolute top-[20%] -right-[10%] h-[50vh] w-[50vw] rounded-full mix-blend-multiply blur-[100px] dark:mix-blend-screen dark:blur-[120px]'
          style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)' }}
        />
        <div
          className='aurora-blob absolute -bottom-[20%] left-[20%] h-[60vh] w-[60vw] rounded-full mix-blend-multiply blur-[100px] dark:mix-blend-screen dark:blur-[120px]'
          style={{ backgroundColor: 'rgba(168, 85, 247, 0.2)' }}
        />
        <div className='absolute inset-0 bg-[url("https://grainy-gradients.vercel.app/noise.svg")] opacity-[0.03]' />
      </div>

      <div className='relative z-10 container mx-auto px-4 md:px-6'>
        <div className='hero-reveal select-none'>
          <h1 className='text-[7vw] leading-[0.95] font-bold tracking-[-0.03em] max-sm:text-center max-sm:text-[15vw] max-sm:leading-none'>
            <span className='text-foreground max-sm:text-[25vw]'>Master</span>
            <br />
            <span className='from-primary to-primary/50 dark:to-primary/50 dark:from-primary/90 bg-linear-to-r bg-clip-text text-transparent'>
              Your
            </span>{' '}
            <span className='text-foreground/50 font-serif italic dark:text-white'>Money</span>
          </h1>
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
                className='group bg-foreground text-background relative h-14 w-full overflow-hidden rounded-full px-8 text-lg font-semibold shadow-lg transition-all hover:shadow-xl sm:w-auto dark:bg-white dark:text-black'
              >
                <div className='absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/30 to-transparent transition-transform duration-1000 group-hover:translate-x-full' />
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
