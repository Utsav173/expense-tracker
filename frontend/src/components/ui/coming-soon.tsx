'use client';

import React from 'react';
import { BarChart3 } from 'lucide-react';

interface ComingSoonProps {
  message?: string;
  className?: string;
  featureName?: string;
  progress?: number;
}

const ComingSoon: React.FC<ComingSoonProps> = ({
  message = "We're working hard to bring you something amazing. This feature is currently under development.",
  className = '',
  featureName = 'Coming Soon',
  progress = 88
}) => {
  return (
    <div
      className={`flex h-full w-full flex-col items-center justify-center bg-white dark:bg-gray-900 ${className}`}
    >
      <div className='relative flex w-full max-w-lg flex-col items-center justify-center rounded-lg border border-gray-100 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900'>
        {/* Small decorative sparkles like in the screenshot */}
        <div className='absolute -right-2 -top-2 text-gray-200 dark:text-gray-700'>
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
        <div className='absolute bottom-8 right-24 text-gray-200 dark:text-gray-700'>
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
        <div className='absolute left-12 top-12 text-gray-200 dark:text-gray-700'>
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
        <div className='absolute -bottom-2 -left-2 text-gray-200 dark:text-gray-700'>
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
        <div className='mb-6 flex h-16 w-16 items-center justify-center rounded bg-blue-50 text-blue-500 dark:bg-blue-900/20 dark:text-blue-400'>
          <BarChart3 className='h-8 w-8' />
        </div>

        {/* Main content */}
        <h2 className='mb-2 text-2xl font-semibold text-gray-900 dark:text-white'>{featureName}</h2>

        <p className='mb-6 text-center text-sm text-gray-600 dark:text-gray-300'>{message}</p>

        {/* Progress bar */}
        <div className='mb-2 h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800'>
          <div
            className='h-full rounded-full bg-blue-500 transition-all duration-300 ease-out'
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className='text-xs text-gray-500 dark:text-gray-400'>{progress}% completed</p>
      </div>
    </div>
  );
};

export default ComingSoon;
