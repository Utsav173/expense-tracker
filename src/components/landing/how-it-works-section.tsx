'use client';

import React, { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { HowItWorksStep } from './how-it-works-step';

gsap.registerPlugin(ScrollTrigger);

export const HowItWorksSection = () => {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
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
        <div className='mb-20'>
          <h2 className='text-4xl font-bold tracking-tighter text-foreground md:text-6xl'>
            How It <span className='text-primary'>Works</span>
          </h2>
          <p className='mx-auto mt-6 max-w-2xl text-xl font-medium text-muted-foreground'>
            From data to decisions, mastering your finances has never been easier.
          </p>
        </div>

        <div className='mt-20 grid grid-cols-1 gap-y-20 md:grid-cols-3 md:gap-x-8'>
          <HowItWorksStep
            stepNumber='1'
            icon={'upload'}
            title='Import & Sync'
            description='Connect accounts, upload spreadsheets, or let our AI process your PDF bank statements automatically.'
            className='how-it-works-step-anim opacity-0'
          />
          <HowItWorksStep
            stepNumber='2'
            icon={'layoutGrid'}
            title='Visualize & Understand'
            description='Watch your data come to life on the interactive dashboard. See where your money goes with beautiful charts.'
            className='how-it-works-step-anim opacity-0'
          />
          <HowItWorksStep
            stepNumber='3'
            icon={'target'}
            title='Plan & Act'
            description='Set budgets, create savings goals, and track debts. Use the AI assistant to make smarter decisions on the fly.'
            className='how-it-works-step-anim opacity-0'
          />
        </div>
      </div>
    </section>
  );
};
