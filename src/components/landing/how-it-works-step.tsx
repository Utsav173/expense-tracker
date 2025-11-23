'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { IconName } from '../ui/icon-map';
import { Icon } from '../ui/icon';

interface HowItWorksStepProps {
  stepNumber: string;
  icon: IconName;
  title: string;
  description: string;
  className?: string;
}

export const HowItWorksStep = ({
  stepNumber,
  icon,
  title,
  description,
  className
}: HowItWorksStepProps) => {
  return (
    <div
      className={cn(
        'group relative flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-2',
        className
      )}
    >
      <div className='relative mb-8'>
        {/* Soft Glow Background */}
        <div className='absolute inset-0 rounded-full bg-primary/20 blur-2xl transition-all duration-500 group-hover:bg-primary/30 group-hover:blur-3xl' />
        
        <div className='relative flex h-24 w-24 items-center justify-center rounded-2xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-md transition-all duration-300 group-hover:scale-105 group-hover:bg-white/10 dark:bg-white/5 dark:group-hover:bg-white/10'>
          <Icon
            name={icon}
            className='h-10 w-10 text-primary transition-transform duration-300 group-hover:scale-110'
          />
        </div>
        <div className='absolute -right-3 -top-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground shadow-lg shadow-primary/30'>
          {stepNumber}
        </div>
      </div>
      <h3 className='mb-3 text-2xl font-bold tracking-tight text-foreground'>{title}</h3>
      <p className='max-w-xs px-4 text-base font-medium text-muted-foreground'>{description}</p>
    </div>
  );
};
