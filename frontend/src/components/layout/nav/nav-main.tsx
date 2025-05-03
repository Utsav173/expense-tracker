'use client';

import { SidebarGroup, SidebarMenu, SidebarMenuItem } from '@/components/ui/sidebar';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import React from 'react';
import { NavItem } from '../app-sidebar';

export function NavMain({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) => {
          const isActive = pathname === item.url;
          const LinkIcon = item.icon;

          const linkContent = (
            <div
              className={cn(
                'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-sidebar-ring active:bg-sidebar-accent active:text-sidebar-accent-foreground flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm transition-[width,height,padding] outline-none focus-visible:ring-2',
                isActive && 'bg-sidebar-accent text-sidebar-accent-foreground font-medium',
                item.disabled && 'text-muted-foreground pointer-events-none opacity-50',
                'group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:p-2' // Icon-only styles
              )}
            >
              {LinkIcon && <LinkIcon className='h-4 w-4 shrink-0' />}
              <span className='truncate group-data-[collapsible=icon]:hidden'>{item.title}</span>
            </div>
          );

          const linkWrapper = item.disabled ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className='w-full cursor-not-allowed' aria-disabled='true'>
                  {linkContent}
                </span>
              </TooltipTrigger>
              <TooltipContent side='right' align='center'>
                <p>{item.tooltip || 'This feature is currently unavailable.'}</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <Link href={item.url} className='w-full'>
              {linkContent}
            </Link>
          );

          return (
            <SidebarMenuItem key={item.title} className={cn(isActive && 'bg-transparent')}>
              {linkWrapper}
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
