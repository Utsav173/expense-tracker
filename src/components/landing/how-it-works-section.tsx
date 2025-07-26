'use client';

import { Upload, LayoutGrid, Target } from 'lucide-react';
import { HowItWorksStep } from './how-it-works-step';

export const HowItWorksSection = () => {
  return (
    <section id='how-it-works' className='bg-background py-24'>
      <div className='container mx-auto text-center'>
        <h2 className='text-4xl font-bold'>Get Started in 3 Simple Steps</h2>
        <p className='text-muted-foreground mx-auto mt-4 max-w-2xl text-lg'>
          From data to decisions, mastering your finances has never been easier.
        </p>
        <div className='relative mt-16 grid grid-cols-1 gap-8 md:grid-cols-3'>
          <div className='absolute top-1/2 left-0 hidden h-px w-full -translate-y-1/2 bg-gray-200 md:block dark:bg-gray-800'></div>
          <div className='absolute top-0 left-1/2 h-full w-px -translate-x-1/2 bg-gray-200 md:hidden dark:bg-gray-800'></div>
          <HowItWorksStep
            stepNumber='1'
            icon={<Upload />}
            title='Import & Sync'
            description='Connect accounts, upload spreadsheets, or let our AI process your PDF bank statements automatically.'
          />
          <HowItWorksStep
            stepNumber='2'
            icon={<LayoutGrid />}
            title='Visualize & Understand'
            description='Watch your data come to life on the interactive dashboard. See where your money goes with beautiful charts.'
          />
          <HowItWorksStep
            stepNumber='3'
            icon={<Target />}
            title='Plan & Act'
            description='Set budgets, create savings goals, and track debts. Use the AI assistant to make smarter decisions on the fly.'
          />
        </div>
      </div>
    </section>
  );
};
