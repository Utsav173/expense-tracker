'use client';

import * as React from 'react';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import PageHeader from '@/components/layout/page-header';
import Loader from '@/components/ui/loader';
import { AnimatePresence, motion } from 'framer-motion';
import { usePathname } from 'next/navigation';

const SidebarLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();

  return (
    <React.Suspense
      fallback={
        <div className='flex min-h-screen items-center justify-center'>
          <Loader />
        </div>
      }
    >
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className='scrollbar bg-muted/40 relative flex min-h-[calc(100dvh-4rem)] w-[100dvw] flex-1 flex-col gap-4 pb-2'>
          <PageHeader />
          <AnimatePresence mode='wait'>
            <motion.main
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className='flex-1'
            >
              {children}
            </motion.main>
          </AnimatePresence>
        </SidebarInset>
      </SidebarProvider>
    </React.Suspense>
  );
};

export default SidebarLayout;
