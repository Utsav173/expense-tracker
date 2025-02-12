import * as React from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import RouteBreadcrumbs from './route-breadcrumbs'; // Import the new component

const SidebarLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className='flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12'>
          <div className='flex items-center gap-2 px-4'>
            <SidebarTrigger className='-ml-1' />
            <Separator orientation='vertical' className='mr-2 h-4' />
            <RouteBreadcrumbs />
          </div>
        </header>
        <div className='relative flex min-h-[calc(100dvh-4rem)] w-full flex-1 flex-col gap-4 p-4 pt-0'>
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default SidebarLayout;
