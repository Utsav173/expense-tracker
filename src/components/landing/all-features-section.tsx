'use client';

import React from 'react';
import { featuresList } from '@/lib/data/features-list';
import { Icon } from '../ui/icon';
import { BentoGrid, BentoGridItem } from '../ui/bento-grid';
import { MockDashboard, MockChat, MockImport } from './feature-mocks';

export const AllFeaturesSection = () => {
  return (
    <section id='features' className='relative z-10 bg-background py-24'>
      {/* Fluid Background Orb for Features */}
      <div className='pointer-events-none absolute top-1/2 left-1/2 -z-10 h-[50vw] w-[50vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-[100px]' />

      <div className='container mx-auto px-4'>
        <div className='mb-20 text-center'>
          <h2 className='text-4xl font-bold tracking-tighter text-foreground md:text-6xl'>
            Everything You Need to <br />
            <span className='bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent'>
              Dominate Your Finances
            </span>
          </h2>
          <p className='mx-auto mt-6 max-w-2xl text-xl font-medium text-muted-foreground'>
            Powerful tools wrapped in a beautiful, intuitive interface.
          </p>
        </div>

        <BentoGrid className='mx-auto max-w-7xl auto-rows-[minmax(200px,auto)]'>
          {/* 1. AI Assistant - Large Item */}
          <BentoGridItem
            className='col-span-12 md:col-span-8 lg:col-span-8'
            title='AI Financial Assistant'
            description='Chat with your finances. Ask questions, get insights, and manage your money with natural language.'
            header={<MockChat />}
            icon={<Icon name='bot' className='h-4 w-4 text-neutral-500' />}
          />

          {/* 2. Interactive Dashboard - Large Item */}
          <BentoGridItem
            className='col-span-12 md:col-span-4 lg:col-span-4'
            title='Interactive Dashboard'
            description='Visualize your net worth, spending trends, and financial health at a glance.'
            header={<MockDashboard />}
            icon={<Icon name='layoutGrid' className='h-4 w-4 text-neutral-500' />}
          />

          {/* 3. Smart Import - Medium Item (Adjusted for 4-item row) */}
          <BentoGridItem
            className='col-span-12 md:col-span-3 lg:col-span-3'
            title='Smart Import'
            description='Drag & drop your bank statements.'
            header={<MockImport />}
            icon={<Icon name='uploadCloud' className='h-4 w-4 text-neutral-500' />}
          />

          {/* Remaining Features from List (3 items to fill the row) */}
          {featuresList.slice(0, 3).map((feature, i) => (
            <BentoGridItem
              key={i}
              className='col-span-12 md:col-span-3 lg:col-span-3'
              title={feature.title}
              description={feature.description}
              header={
                <div className='flex h-full min-h-[6rem] w-full flex-1 items-center justify-center rounded-xl bg-gradient-to-br from-neutral-200 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800'>
                  <Icon name={feature.icon} className='h-12 w-12 text-neutral-400' />
                </div>
              }
              icon={<Icon name={feature.icon} className='h-4 w-4 text-neutral-500' />}
            />
          ))}
        </BentoGrid>
      </div>
    </section>
  );
};
