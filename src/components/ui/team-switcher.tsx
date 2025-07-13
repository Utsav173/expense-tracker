'use client';

import * as React from 'react';
import Image from 'next/image';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

export function TeamSwitcher() {
  const { isMobile, state } = useSidebar();
  const isCollapsed = !isMobile && state === 'collapsed';
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton className={cn(isCollapsed && 'p-0! group-data-[collapsible=icon]:p-0!')}>
          <div className='flex items-center gap-2'>
            <Image
              src='/favicon.svg'
              alt='Expense Pro Logo'
              width={isCollapsed ? 48 : 24}
              height={isCollapsed ? 48 : 24}
              className='p-0'
            />
            {!isCollapsed && <h1 className='text-2xl font-semibold'>Expense Pro</h1>}
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
