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
        'how-it-works-step-anim relative flex flex-col items-center text-center opacity-0',
        className
      )}
    >
      <div className='relative mb-6'>
        <div className='bg-primary/20 absolute inset-0.5 -z-10 rounded-full blur-lg transition-all duration-300 group-hover:blur-xl' />
        <div className='bg-balance text-primary-foreground group ring-background flex h-20 w-20 items-center justify-center rounded-full shadow-lg ring-8'>
          <Icon
            name={icon}
            className='h-8 w-8 transition-transform duration-300 group-hover:scale-110'
          />
        </div>
        <div className='border-background bg-foreground text-background absolute -top-2 -left-2 flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-bold'>
          {stepNumber}
        </div>
      </div>
      <h3 className='mb-2 text-2xl font-bold'>{title}</h3>
      <p className='text-muted-foreground max-w-xs text-base'>{description}</p>
    </div>
  );
};
