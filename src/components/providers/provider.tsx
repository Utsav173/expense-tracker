'use client';
import { queryClient } from '@/lib/react-query';
import { QueryClientProvider } from '@tanstack/react-query';
import React, { Suspense } from 'react';
import { ThemeProvider } from './theme-provider';
import { Toaster } from '../ui/sonner';
import Loader from '../ui/loader';

const ReactQueryProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={<Loader />}>
        <ThemeProvider
          attribute='class'
          defaultTheme='dark'
          enableSystem={false}
          disableTransitionOnChange
        >
          <Toaster richColors position='top-right' />
          {children}
        </ThemeProvider>
      </Suspense>
    </QueryClientProvider>
  );
};

export default ReactQueryProvider;
