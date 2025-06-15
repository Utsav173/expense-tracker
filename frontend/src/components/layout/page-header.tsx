'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ModeToggle } from '@/components/theme-toggle';
import { SidebarTrigger } from '../ui/sidebar';
import { Separator } from '../ui/separator';

const getPageTitle = (pathname: string | null): string => {
  if (!pathname) return 'Loading...';

  if (pathname === '/accounts') return 'Accounts';
  if (pathname.startsWith('/accounts/shares/')) return 'Account Shares';
  if (pathname.startsWith('/accounts/')) return 'Account Details';
  if (pathname.startsWith('/shared-accounts')) return 'Shared Accounts';
  if (pathname.startsWith('/transactions/import')) return 'Import Transactions';
  if (pathname.startsWith('/investment/')) return 'Investment Details';

  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return 'Home';

  const lastSegment = segments[segments.length - 1];

  return lastSegment
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const PageHeader: React.FC = () => {
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);
  const isHomePage = pathname === '/accounts';
  const isDashboard = pathname === '/dashboard';
  return isDashboard ? null : (
    <header className='flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12'>
      <div className='flex w-full items-center gap-2 px-4'>
        <SidebarTrigger className='-ml-1' />
        <Separator orientation='vertical' className='mr-2 h-4' />
        <div className='flex h-full w-full items-center gap-2'>
          <Link href='/accounts' aria-label='Go to Home'>
            <Button variant='ghost' size='icon' className='h-7 w-7'>
              <Home
                className={cn('h-4 w-4', isHomePage ? 'text-primary' : 'text-muted-foreground')}
              />
            </Button>
          </Link>

          <span
            className={cn(
              'ml-1 overflow-hidden text-sm font-medium text-ellipsis whitespace-nowrap',
              !isHomePage && 'text-foreground',
              isHomePage && 'text-primary'
            )}
          >
            {pageTitle}
          </span>

          <ModeToggle className='ml-auto' />
        </div>
      </div>
    </header>
  );
};

export default PageHeader;
