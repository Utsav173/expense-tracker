'use client';
import { queryClient } from '@/lib/react-query';
import { QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { ThemeProvider } from './theme-provider';
import { Toaster } from '../ui/sonner';

const ReactQueryProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute='class' defaultTheme='system' enableSystem disableTransitionOnChange>
        <Toaster richColors position='top-right' />
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default ReactQueryProvider;
