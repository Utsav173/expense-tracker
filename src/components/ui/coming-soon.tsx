'use client';

import React from 'react';
import { Progress } from './progress';
import { cn } from '@/lib/utils';
import { Icon } from './icon';

interface ComingSoonProps {
  message?: string;
  className?: string;
  featureName?: string;
}

const ComingSoon: React.FC<ComingSoonProps> = ({
  message = "We're working hard to bring you something amazing. This feature is currently under development.",
  className = '',
  featureName = 'Coming Soon'
}) => {
  const progress = Math.floor(Math.random() * 30) + 60;
  return (
    <div
      className={cn(
        'bg-background flex h-full w-full flex-col items-center justify-center',
        className
      )}
    >
      <div className='bg-card relative flex w-full max-w-lg flex-col items-center justify-center rounded-lg border p-8 shadow-sm'>
        {/* Small decorative sparkles like in the screenshot */}
        <div className='text-muted absolute -top-2 -right-2'>
          <svg
            width='20'
            height='20'
            viewBox='0 0 24 24'
            fill='none'
            xmlns='http://www.w3.org/2000/svg'
          >
            <path
              d='M12 2L14.5 9.5H22L16 14L18.5 21.5L12 17L5.5 21.5L8 14L2 9.5H9.5L12 2Z'
              fill='currentColor'
            />
          </svg>
        </div>
        <div className='text-muted absolute right-24 bottom-8'>
          <svg
            width='16'
            height='16'
            viewBox='0 0 24 24'
            fill='none'
            xmlns='http://www.w3.org/2000/svg'
          >
            <path
              d='M12 2L14.5 9.5H22L16 14L18.5 21.5L12 17L5.5 21.5L8 14L2 9.5H9.5L12 2Z'
              fill='currentColor'
            />
          </svg>
        </div>
        <div className='text-muted absolute top-12 left-12'>
          <svg
            width='12'
            height='12'
            viewBox='0 0 24 24'
            fill='none'
            xmlns='http://www.w3.org/2000/svg'
          >
            <path
              d='M12 2L14.5 9.5H22L16 14L18.5 21.5L12 17L5.5 21.5L8 14L2 9.5H9.5L12 2Z'
              fill='currentColor'
            />
          </svg>
        </div>
        <div className='text-muted absolute -bottom-2 -left-2'>
          <svg
            width='20'
            height='20'
            viewBox='0 0 24 24'
            fill='none'
            xmlns='http://www.w3.org/2000/svg'
          >
            <path
              d='M12 2L14.5 9.5H22L16 14L18.5 21.5L12 17L5.5 21.5L8 14L2 9.5H9.5L12 2Z'
              fill='currentColor'
            />
          </svg>
        </div>

        {/* Icon from the screenshot */}
        <div className='bg-primary/10 text-primary mb-6 flex h-16 w-16 items-center justify-center rounded'>
          <Icon name='barChart3' className='h-8 w-8' />
        </div>

        {/* Main content */}
        <h2 className='text-foreground mb-2 text-2xl font-semibold'>{featureName}</h2>

        <p className='text-muted-foreground mb-6 text-center text-sm'>{message}</p>

        {/* Progress bar */}
        <Progress value={progress} className='mb-2 w-full' />

        <p className='text-muted-foreground text-xs'>{progress}% completed</p>
      </div>
    </div>
  );
};

export default ComingSoon;
