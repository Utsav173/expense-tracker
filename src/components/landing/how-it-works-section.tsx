'use client';

import React, { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { HowItWorksStep } from './how-it-works-step';

gsap.registerPlugin(ScrollTrigger);

export const HowItWorksSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const pathRef = useRef<SVGPathElement>(null);

  useGSAP(
    () => {
      if (!pathRef.current) return;

      const pathLength = pathRef.current.getTotalLength();
      pathRef.current.style.strokeDasharray = `${pathLength}`;
      pathRef.current.style.strokeDashoffset = `${pathLength}`;

      gsap
        .timeline({
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top center',
            end: 'bottom center',
            scrub: 1
          }
        })
        .to(pathRef.current, {
          strokeDashoffset: 0,
          ease: 'power1.inOut'
        });

      gsap.fromTo(
        '.how-it-works-step-anim',
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'power3.out',
          stagger: 0.3,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 60%'
          }
        }
      );
    },
    { scope: sectionRef }
  );

  return (
    <section id='how-it-works' ref={sectionRef} className='bg-muted px-3 py-24'>
      <div className='container mx-auto text-center'>
        <h2 className='text-4xl font-bold max-sm:text-2xl'>Get Started in 3 Simple Steps</h2>
        <p className='text-muted-foreground mx-auto mt-4 max-w-2xl text-lg'>
          From data to decisions, mastering your finances has never been easier.
        </p>

        <div className='relative mt-20 grid grid-cols-1 gap-y-20 md:grid-cols-3 md:gap-x-8 lg:hidden'>
          <HowItWorksStep
            stepNumber='1'
            icon={'upload'}
            title='Import & Sync'
            description='Connect accounts, upload spreadsheets, or let our AI process your PDF bank statements automatically.'
          />
          <HowItWorksStep
            stepNumber='2'
            icon={'layoutGrid'}
            title='Visualize & Understand'
            description='Watch your data come to life on the interactive dashboard. See where your money goes with beautiful charts.'
          />
          <HowItWorksStep
            stepNumber='3'
            icon={'target'}
            title='Plan & Act'
            description='Set budgets, create savings goals, and track debts. Use the AI assistant to make smarter decisions on the fly.'
          />
        </div>

        <div className='relative mt-16 hidden h-[350px] w-full items-start justify-between lg:flex'>
          <svg
            className='absolute top-10 left-0 h-full w-full'
            width='100%'
            height='100'
            viewBox='0 0 1000 100'
            preserveAspectRatio='none'
          >
            <path
              ref={pathRef}
              d='M 100 50 C 250 50, 250 0, 500 0 S 750 50, 900 50'
              stroke='var(--border)'
              strokeWidth='2'
              strokeLinecap='round'
              fill='none'
            />
          </svg>

          <HowItWorksStep
            stepNumber='1'
            icon={'upload'}
            title='Import & Sync'
            description='Connect accounts, upload spreadsheets, or let our AI process your PDF bank statements automatically.'
            className='w-1/3'
          />
          <HowItWorksStep
            stepNumber='2'
            icon={'layoutGrid'}
            title='Visualize & Understand'
            description='Watch your data come to life on the interactive dashboard. See where your money goes with beautiful charts.'
            className='w-1/3 self-start' // Aligns to the top
          />
          <HowItWorksStep
            stepNumber='3'
            icon={'target'}
            title='Plan & Act'
            description='Set budgets, create savings goals, and track debts. Use the AI assistant to make smarter decisions on the fly.'
            className='w-1/3'
          />
        </div>
      </div>
    </section>
  );
};
