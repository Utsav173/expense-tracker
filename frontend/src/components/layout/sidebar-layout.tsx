import * as React from 'react';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import PageHeader from '@/components/layout/page-header';
import Loader from '@/components/ui/loader';

const SidebarLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <React.Suspense
      fallback={
        <div className='flex h-screen items-center justify-center'>
          <Loader />
        </div>
      }
    >
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className='scrollbar bg-muted/40 relative flex min-h-[calc(100dvh-4rem)] w-[100dvw] flex-1 flex-col gap-4'>
          <PageHeader />
          {children}
        </SidebarInset>
      </SidebarProvider>
    </React.Suspense>
  );
};

export default SidebarLayout;
