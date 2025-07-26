'use client';
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton
} from '@/components/ui/sidebar';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';

import { NavItem } from '../app-sidebar';
import TooltipElement from '@/components/ui/tooltip-element';
import React from 'react';

export function NavMain({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) => {
          const isActive = pathname === item.url;
          const LinkIcon = item.icon as React.ComponentType<React.SVGProps<SVGSVGElement>>;

          return (
            <SidebarMenuItem key={item.title} className={cn(isActive && 'bg-transparent')}>
              {/* Pass tooltip content directly to SidebarMenuButton */}
              <SidebarMenuButton
                asChild={!item.disabled}
                isActive={isActive}
                disabled={item.disabled}
                aria-disabled={item.disabled}
                tooltip={item.disabled ? item.tooltip : item.title}
              >
                {item.disabled ? (
                  <TooltipElement tooltipContent={item.tooltip}>
                    <span className='flex w-full cursor-not-allowed items-center gap-2'>
                      <LinkIcon className='h-4 w-4 shrink-0' />
                      <span className='truncate group-data-[collapsible=icon]:hidden'>
                        {item.title}
                      </span>
                    </span>
                  </TooltipElement>
                ) : (
                  <Link href={item.url} className='w-full'>
                    <LinkIcon className='h-4 w-4 shrink-0' />
                    <span className='truncate group-data-[collapsible=icon]:hidden'>
                      {item.title}
                    </span>
                  </Link>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
