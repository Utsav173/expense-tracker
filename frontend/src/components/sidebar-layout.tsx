import * as React from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import PageHeader from './page-header';
import Loader from './ui/loader';

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
          <header className='flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12'>
            <div className='flex items-center gap-2 px-4'>
              <SidebarTrigger className='-ml-1' />
              <Separator orientation='vertical' className='mr-2 h-4' />
              <PageHeader />
            </div>
          </header>
          <main className='scrollbar relative flex min-h-[calc(100dvh-4rem)] flex-1 flex-col gap-4 bg-muted/40 p-4 pt-4 md:pt-6 lg:p-6'>
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </React.Suspense>
  );
};

export default SidebarLayout;
