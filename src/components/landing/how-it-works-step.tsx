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
        'group relative flex flex-col items-center text-center transition-transform duration-300 hover:-translate-y-2',
        className
      )}
    >
      <div className='relative mb-6'>
        <div className='bg-primary/10 group-hover:bg-primary/20 absolute inset-0 rounded-full blur-lg transition-all duration-300 group-hover:blur-xl' />
        <div className='border-border/50 bg-background flex h-24 w-24 items-center justify-center rounded-full border shadow-lg'>
          <Icon
            name={icon}
            className='text-primary h-10 w-10 transition-transform duration-300 group-hover:scale-110'
          />
        </div>
        <div className='border-background bg-primary text-primary-foreground absolute -top-2 -right-2 flex h-9 w-9 items-center justify-center rounded-full border-4 text-base font-bold'>
          {stepNumber}
        </div>
      </div>
      <h3 className='mb-2 text-2xl font-bold'>{title}</h3>
      <p className='text-muted-foreground max-w-xs px-4 text-base'>{description}</p>
    </div>
  );
};
