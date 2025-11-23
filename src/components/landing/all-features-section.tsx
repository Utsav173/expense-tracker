'use client';

import { BentoGrid, BentoGridItem } from '../ui/bento-grid';
import {
  MockDashboard,
  MockChat,
  MockImport,
  MockAuth,
  MockSharing,
  MockCRUD
} from './feature-mocks';

export const AllFeaturesSection = () => {
  return (
    <section id='features' className='bg-background relative z-10 py-24'>
      {/* Fluid Background Orb for Features */}
      <div className='bg-primary/5 pointer-events-none absolute top-1/2 left-1/2 -z-10 h-[50vw] w-[50vw] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[100px]' />

      <div className='container mx-auto px-4'>
        <div className='mb-20 text-center'>
          <h2 className='text-foreground text-4xl font-bold tracking-tighter md:text-6xl'>
            Everything You Need to <br />
            <span className='from-primary bg-gradient-to-r to-blue-500 bg-clip-text text-transparent'>
              Dominate Your Finances
            </span>
          </h2>
          <p className='text-muted-foreground mx-auto mt-6 max-w-2xl text-xl font-medium'>
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
            // icon={<Icon name='bot' className='h-4 w-4 text-neutral-500' />}
          />

          {/* 2. Interactive Dashboard - Large Item */}
          <BentoGridItem
            className='col-span-12 md:col-span-4 lg:col-span-4'
            title='Interactive Dashboard'
            description='Visualize your net worth, spending trends, and financial health at a glance.'
            header={<MockDashboard />}
            // icon={<Icon name='layoutGrid' className='h-4 w-4 text-neutral-500' />}
          />

          {/* 3. Smart Import - Medium Item (Adjusted for 4-item row) */}
          <BentoGridItem
            className='col-span-12 md:col-span-6 lg:col-span-6'
            title='Smart Import'
            description='Drag & drop your bank statements.'
            header={<MockImport />}
            // icon={<Icon name='uploadCloud' className='h-4 w-4 text-neutral-500' />}
          />

          {/* 4. Secure Authentication */}
          <BentoGridItem
            className='col-span-12 md:col-span-6 lg:col-span-6'
            title='Secure Authentication'
            description='JWT-based login and password reset.'
            header={<MockAuth />}
            // icon={<Icon name='lock' className='h-4 w-4 text-neutral-500' />}
          />

          {/* 5. Account Sharing */}
          <BentoGridItem
            className='col-span-12 md:col-span-6 lg:col-span-4'
            title='Account Sharing'
            description='Share accounts with permissions.'
            header={<MockSharing />}
            // icon={<Icon name='users' className='h-4 w-4 text-neutral-500' />}
          />

          {/* 6. Full CRUD Operations */}
          <BentoGridItem
            className='col-span-12 md:col-span-6 lg:col-span-8'
            title='Full CRUD Operations'
            description='Create, edit, and delete with ease.'
            header={<MockCRUD />}
            // icon={<Icon name='code' className='h-4 w-4 text-neutral-500' />}
          />
        </BentoGrid>
      </div>
    </section>
  );
};
