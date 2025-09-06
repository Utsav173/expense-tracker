'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb';
import { SidebarTrigger } from '../ui/sidebar';
import { ModeToggle } from '../theme-toggle';
import { useAppStore } from '@/stores/app-store';
import { Icon } from '../ui/icon';

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const PageHeader: React.FC = () => {
  const pathname = usePathname();
  const { currentAccountName, currentInvestmentAccountName } = useAppStore();

  const breadcrumbs = React.useMemo(() => {
    const pathSegments = pathname.split('/').filter(Boolean);
    if (pathSegments.length === 0 || pathSegments[0] === 'dashboard') {
      return null;
    }

    let href = '';
    return pathSegments.map((segment, index) => {
      href += `/${segment}`;
      const isLast = index === pathSegments.length - 1;

      let title = capitalize(segment.replace(/-/g, ' '));
      const isUUID = /^[0-9a-fA-F-]{36}$/.test(segment);

      if (isLast && isUUID) {
        if (pathSegments[0] === 'accounts' && currentAccountName) {
          title = currentAccountName;
        } else if (pathSegments[0] === 'investment' && currentInvestmentAccountName) {
          title = currentInvestmentAccountName;
        }
      } else if (segment === 'shares') {
        title = 'Sharing';
      }

      return { href, title, isLast };
    });
  }, [pathname, currentAccountName, currentInvestmentAccountName]);

  return (
    <header className='bg-sidebar/50 sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b backdrop-blur-sm'>
      <div className='flex w-full items-center gap-2 px-4'>
        <SidebarTrigger />
        <div className='border-accent ml-1 flex h-full flex-1 items-center gap-2 overflow-x-auto border-l pl-2'>
          {breadcrumbs ? (
            <Breadcrumb>
              <BreadcrumbList className='whitespace-nowrap'>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href='/dashboard' aria-label='Go to Dashboard'>
                      <Icon name='home' className='hover:text-accent-foreground h-4 w-4' />
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                {breadcrumbs.map((crumb) => (
                  <BreadcrumbItem key={crumb.href}>
                    {crumb.isLast ? (
                      <BreadcrumbPage className='hover:text-accent-foreground truncate font-semibold'>
                        {crumb.title}
                      </BreadcrumbPage>
                    ) : (
                      <>
                        <BreadcrumbLink asChild>
                          <Link href={crumb.href} className='hover:text-accent-foreground truncate'>
                            {crumb.title}
                          </Link>
                        </BreadcrumbLink>
                        <BreadcrumbSeparator />
                      </>
                    )}
                  </BreadcrumbItem>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          ) : (
            <div className='font-semibold'>Dashboard</div>
          )}
        </div>

        <ModeToggle />
      </div>
    </header>
  );
};

export default PageHeader;
