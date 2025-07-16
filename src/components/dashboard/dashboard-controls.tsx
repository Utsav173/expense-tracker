'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { ModeToggle } from '../theme-toggle';
import { useRouter } from 'next/navigation';

export const DashboardControls: React.FC = () => {
  const router = useRouter();
  return (
    <div className='sticky top-4 z-20 mx-auto w-full max-w-7xl'>
      <div className='relative overflow-hidden rounded-2xl border border-white/20 bg-white/10 shadow-2xl shadow-black/10 backdrop-blur-sm backdrop-saturate-150 dark:border-white/10 dark:bg-black/20 dark:shadow-black/20'>
        <div className='absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/5 dark:from-white/5 dark:via-transparent dark:to-white/5' />

        <div className='relative flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-6'>
          <div className='absolute top-4.5 left-2 sm:hidden'>
            <Button
              variant='ghost'
              size='icon'
              onClick={() => router.back()}
              className='h-8 w-8 rounded-full'
            >
              <ArrowLeft className='h-4 w-4' />
            </Button>
          </div>

          <div className='flex-1 text-center sm:text-left'>
            <h1 className='bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-2xl font-bold tracking-tight text-transparent sm:text-3xl dark:from-white dark:to-gray-300'>
              Dashboard
            </h1>
          </div>

          <div className='flex items-center justify-center gap-2 sm:justify-end'>
            <ModeToggle />
          </div>
        </div>
      </div>
    </div>
  );
};
