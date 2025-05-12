'use client';

import React, { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { cn } from '@/lib/utils';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface AnimatedFeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  className?: string;
  delay?: number;
}

const AnimatedFeatureCardV2: React.FC<AnimatedFeatureCardProps> = ({
  icon,
  title,
  description,
  className,
  delay = 0
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = cardRef.current;
    if (el) {
      gsap.fromTo(
        el,
        { opacity: 0, y: 70, filter: 'blur(8px)' },
        {
          opacity: 1,
          y: 0,
          filter: 'blur(0px)',
          duration: 0.9,
          delay: delay,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 90%',
            toggleActions: 'play none none none'
          }
        }
      );
    }
  }, [delay]);

  return (
    <div
      ref={cardRef}
      className={cn(
        'feature-card group relative overflow-hidden rounded-xl border p-6 shadow-lg transition-all duration-300 ease-out',

        'dark:bg-slate-850/70 border-slate-700/50 bg-slate-800/60 backdrop-blur-sm dark:border-slate-700',
        'hover:bg-slate-750/70 hover:-translate-y-2 hover:border-sky-500/60 hover:shadow-2xl hover:shadow-sky-500/20 dark:hover:border-sky-400/50 dark:hover:bg-slate-800/80 dark:hover:shadow-sky-400/15',
        className
      )}
    >
      <div className='relative z-10'>
        <div className='mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-cyan-400 text-white shadow-md transition-all duration-300 group-hover:scale-110 group-hover:shadow-sky-400/50 dark:from-sky-400 dark:to-cyan-300'>
          {icon}
        </div>
        {/* Use specific text color class for headings inside these dark cards */}
        <h3 className='lp-text-dark-section-heading mb-3 text-xl font-bold'>{title}</h3>
        {/* Use specific text color class for paragraphs inside these dark cards */}
        <p className='lp-text-dark-section-paragraph text-sm leading-relaxed'>{description}</p>
      </div>
    </div>
  );
};

export default AnimatedFeatureCardV2;
