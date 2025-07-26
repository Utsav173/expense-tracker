'use client';

import React from 'react';

interface HowItWorksStepProps {
  stepNumber: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}

export const HowItWorksStep = ({ stepNumber, icon, title, description }: HowItWorksStepProps) => {
  return (
    <div className='bg-background relative z-10 p-4 text-center'>
      <div className='bg-primary text-primary-foreground mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold shadow-lg'>
        <div className='border-background absolute -top-3 -left-3 flex h-8 w-8 items-center justify-center rounded-full border-4 bg-white text-sm font-bold text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-white'>
          {stepNumber}
        </div>
        {icon}
      </div>
      <h3 className='mb-2 text-xl font-semibold'>{title}</h3>
      <p className='text-muted-foreground text-base'>{description}</p>
    </div>
  );
};
