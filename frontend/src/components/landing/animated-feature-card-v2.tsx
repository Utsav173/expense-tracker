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

      const handleMouseMove = (e: MouseEvent) => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        el.style.setProperty('--mouse-x', `${x}px`);
        el.style.setProperty('--mouse-y', `${y}px`);
      };

      el.addEventListener('mousemove', handleMouseMove);

      return () => {
        el.removeEventListener('mousemove', handleMouseMove);
      };
    }
  }, [delay]);

  return (
    <div
      ref={cardRef}
      className={cn(
        'feature-card group relative overflow-hidden rounded-xl p-6 shadow-lg transition-all duration-300 ease-out',
        'border-slate-700/50 bg-slate-800/60 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-800/60',
        'hover:-translate-y-2 hover:shadow-2xl',
        'before:pointer-events-none before:absolute before:-inset-px before:rounded-xl before:opacity-0 before:transition-opacity before:duration-300 before:content-[""] before:[background:radial-gradient(400px_circle_at_var(--mouse-x)_var(--mouse-y),_rgba(34,211,238,0.3),_transparent_40%)] group-hover:before:opacity-100',
        className
      )}
    >
      <div className='relative z-10'>
        <div className='mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-cyan-400 text-white shadow-md transition-all duration-300 group-hover:scale-110 group-hover:shadow-sky-400/50 dark:from-sky-400 dark:to-cyan-300'>
          {icon}
        </div>
        <h3 className='mb-3 text-xl font-bold text-white'>{title}</h3>
        <p className='text-sm leading-relaxed text-slate-300'>{description}</p>
      </div>
    </div>
  );
};

export default AnimatedFeatureCardV2;
