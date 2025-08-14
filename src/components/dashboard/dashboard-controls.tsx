'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '../theme-toggle';
import { useRouter } from 'next/navigation';
import { Icon } from '../ui/icon';

export const DashboardControls: React.FC = () => {
  const router = useRouter();

  return (
    <div className='sticky top-4 z-20 mx-auto w-full max-w-7xl'>
      <div className='relative rounded-2xl border border-white/20 bg-white/10 shadow-lg backdrop-blur-md backdrop-saturate-150 dark:border-white/10 dark:bg-black/20 dark:shadow-black/30'>
        <div className='pointer-events-none absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/5 dark:from-white/5 dark:via-transparent dark:to-white/5' />

        <div className='relative flex items-center gap-4 p-4'>
          <div className='sm:hidden'>
            <Button
              variant='ghost'
              size='icon'
              onClick={() => router.back()}
              className='h-9 w-9 rounded-full'
            >
              <Icon name='arrowLeft' className='h-4 w-4' />
            </Button>
          </div>

          <div className='w-full text-center sm:flex-1 sm:text-left'>
            <h1 className='bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-2xl font-bold tracking-tight text-transparent sm:text-3xl dark:from-white dark:to-gray-300'>
              Dashboard
            </h1>
          </div>

          <div className='flex items-center justify-center sm:justify-end'>
            <ModeToggle />
          </div>
        </div>
      </div>
    </div>
  );
};
