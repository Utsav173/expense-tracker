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
        <SidebarInset>
          <PageHeader />
          <main className='scrollbar bg-muted/40 relative flex min-h-[calc(100dvh-4rem)] flex-1 flex-col gap-4 p-4 pt-4 max-sm:w-[100dvw] md:pt-6 lg:p-6'>
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </React.Suspense>
  );
};

export default SidebarLayout;
