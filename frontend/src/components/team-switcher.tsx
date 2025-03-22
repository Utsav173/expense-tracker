'use client';

import * as React from 'react';
import Image from 'next/image';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';

export function TeamSwitcher() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton>
          <div className='flex items-center gap-2'>
            <Image src='/favicon.svg' alt='Expense Pro Logo' width={24} height={24} />
            <h1 className='text-lg font-semibold'>Expense Pro</h1>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
