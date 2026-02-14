'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { Button } from '@/components/ui/button';
import { Icon } from '../ui/icon';

const CHART_BARS = [35, 55, 42, 68, 48, 72, 58, 85, 62, 78, 90, 70];

const STATS = [
  { value: '12K+', label: 'Active Users' },
  { value: '$50M+', label: 'Tracked' },
  { value: '4.9★', label: 'User Rating' }
] as const;

const HeroSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const tl = gsap.timeline({ delay: 0.25 });

        tl.fromTo(
          '.hero-badge',
          { y: -20, opacity: 0, scale: 0.95 },
          { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.7)' }
        );

        tl.fromTo(
          '.hero-word',
          { yPercent: 120 },
          { yPercent: 0, duration: 1, stagger: 0.1, ease: 'power4.out' },
          '-=0.15'
        );

        tl.fromTo(
          '.hero-sub',
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out' },
          '-=0.5'
        );

        tl.fromTo(
          '.hero-cta',
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, stagger: 0.08, ease: 'power3.out' },
          '-=0.3'
        );

        tl.fromTo(
          '.hero-preview',
          { y: 60, opacity: 0 },
          { y: 0, opacity: 1, duration: 1, ease: 'power3.out' },
          '-=0.4'
        );

        tl.fromTo(
          '.hero-stat',
          { y: 15, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.4, stagger: 0.06, ease: 'power2.out' },
          '-=0.3'
        );
      });
    },
    { scope: containerRef }
  );

  return (
    <section
      ref={containerRef}
      className='bg-background relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-32'
      style={{ touchAction: 'manipulation' }}
    >
      {/* ── Background Layers ── */}
      <div className='pointer-events-none absolute inset-0 z-0'>
        <div className='bg-brand/[0.07] absolute top-[30%] left-1/2 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px]' />
        <div className='bg-primary/[0.05] absolute right-[10%] bottom-[10%] h-[300px] w-[400px] rounded-full blur-[100px]' />
        <div
          className='absolute inset-0 opacity-[0.3]'
          style={{
            backgroundImage: 'radial-gradient(circle, var(--border) 1px, transparent 1px)',
            backgroundSize: '32px 32px'
          }}
        />
        <div className='absolute inset-0 bg-[url("https://grainy-gradients.vercel.app/noise.svg")] opacity-[0.025]' />
      </div>

      {/* ── Content ── */}
      <div className='relative z-10 mx-auto w-full max-w-5xl text-center'>
        {/* Badge */}

        {/* Headline */}
        <h1 className='mx-auto mt-6 mb-8 max-w-4xl text-balance max-sm:mt-10'>
          <span className='block overflow-hidden'>
            <span className='hero-word text-foreground block text-6xl font-black tracking-tighter sm:text-8xl lg:text-9xl'>
              Master your
            </span>
          </span>
          <span className='block overflow-hidden pb-4'>
            <span className='hero-word from-brand via-primary to-accent-foreground font-display block bg-linear-to-r bg-clip-text pr-4 text-6xl leading-tight text-transparent italic sm:text-7xl md:text-8xl lg:text-9xl'>
              money.
            </span>
          </span>
        </h1>

        {/* Subtitle */}
        <p className='hero-sub text-muted-foreground mx-auto mb-12 max-w-lg text-lg leading-relaxed font-medium text-pretty md:text-xl'>
          Stop guessing where your money goes. Track spending, automate budgets, and grow your
          wealth&nbsp;— all powered by AI.
        </p>

        {/* CTAs */}
        <div className='mb-20 flex flex-col items-center justify-center gap-4 sm:flex-row'>
          <Link href='/auth/signup' className='hero-cta w-full sm:w-auto'>
            <Button
              size='lg'
              className='bg-foreground text-background hover:bg-foreground/90 h-14 w-full rounded-full px-10 text-lg font-semibold shadow-xl transition-all hover:shadow-2xl sm:w-auto'
            >
              Start for Free
              <Icon name='arrowRight' className='ml-2 h-5 w-5' />
            </Button>
          </Link>
          <Link href='#how-it-works' className='hero-cta w-full sm:w-auto'>
            <Button
              variant='outline'
              size='lg'
              className='hover:bg-muted/50 h-14 w-full rounded-full border-2 px-10 text-lg font-medium sm:w-auto'
            >
              See How It Works
            </Button>
          </Link>
        </div>

        {/* Dashboard Preview */}
        <div
          className='hero-preview relative mx-auto max-w-2xl'
          aria-hidden='true'
          style={{ perspective: '1200px' }}
        >
          <div className='border-border/30 bg-card/80 rounded-2xl border p-6 shadow-2xl backdrop-blur-xl md:p-8'>
            {/* Window chrome */}
            <div className='mb-6 flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <div className='bg-destructive/40 h-2.5 w-2.5 rounded-full' />
                <div className='bg-warning/40 h-2.5 w-2.5 rounded-full' />
                <div className='bg-success/40 h-2.5 w-2.5 rounded-full' />
              </div>
              <span className='text-muted-foreground text-xs font-medium'>expense-pro.app</span>
            </div>

            {/* Balance */}
            <div className='mb-8 text-center'>
              <p className='text-muted-foreground mb-1 text-sm font-medium'>Total Balance</p>
              <p className='text-foreground text-4xl font-bold tabular-nums md:text-5xl'>
                $24,847.32
              </p>
              <div className='bg-success/10 text-success mt-2 inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium'>
                <Icon name='trendingUp' className='h-3.5 w-3.5' />
                +12.4% this month
              </div>
            </div>

            {/* Mini chart */}
            <div className='flex items-end justify-center gap-1.5' style={{ height: '80px' }}>
              {CHART_BARS.map((h, i) => (
                <div
                  key={i}
                  className='bg-primary/20 hover:bg-primary/40 w-5 rounded-t-sm transition-all md:w-6'
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>

          {/* Glow under card */}
          <div className='bg-primary/[0.08] absolute -bottom-6 left-1/2 h-12 w-3/4 -translate-x-1/2 rounded-full blur-[30px]' />
        </div>

        {/* Stats */}
        <div className='mt-16 flex flex-wrap items-center justify-center gap-10 md:gap-14'>
          {STATS.map((stat, i) => (
            <div key={i} className='hero-stat flex items-center gap-10'>
              <div className='text-center'>
                <div className='text-foreground text-2xl font-bold tabular-nums md:text-3xl'>
                  {stat.value}
                </div>
                <div className='text-muted-foreground mt-0.5 text-sm'>{stat.label}</div>
              </div>
              {i < STATS.length - 1 && <div className='bg-border/50 hidden h-8 w-px md:block' />}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
