'use client';

import * as React from 'react';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';

export function TeamSwitcher() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton>Expense Pro</SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
