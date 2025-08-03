'use client';

import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroupLabel,
  SidebarSeparator,
  useSidebar
} from '@/components/ui/sidebar';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { NavGroup } from '../app-sidebar';
import React from 'react';

export function NavMain({ groups }: { groups: NavGroup[] }) {
  const pathname = usePathname();
  const { state } = useSidebar();
  return (
    <SidebarGroup>
      {groups.map((group, index) => (
        <React.Fragment key={group.label || `group-${index}`}>
          {index > 0 && <SidebarSeparator className='my-1' />}

          {group.label && state === 'expanded' && (
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
          )}

          <SidebarMenu>
            {group.items.map((item) => {
              const isActive =
                item.url === '/dashboard' ? pathname === item.url : pathname.startsWith(item.url);

              const LinkIcon = item.icon as React.ComponentType<React.SVGProps<SVGSVGElement>>;

              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild={!item.disabled}
                    isActive={isActive}
                    disabled={item.disabled}
                    tooltip={item.disabled ? item.tooltip : item.title}
                    className={cn(item.disabled && 'cursor-not-allowed')}
                  >
                    {item.disabled ? (
                      <span className='flex w-full items-center gap-2'>
                        <LinkIcon className='h-4 w-4 shrink-0' />
                        <span className='truncate group-data-[collapsible=icon]:hidden'>
                          {item.title}
                        </span>
                      </span>
                    ) : (
                      <Link href={item.url} className='flex w-full items-center gap-2'>
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
        </React.Fragment>
      ))}
    </SidebarGroup>
  );
}
