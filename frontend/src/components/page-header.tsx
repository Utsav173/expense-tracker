'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const getPageTitle = (pathname: string | null): string => {
  if (!pathname) return 'Loading...';

  if (pathname === '/') return 'Accounts';
  if (pathname.startsWith('/accounts/shares/')) return 'Account Shares';
  if (pathname.startsWith('/accounts/')) return 'Account Details';
  if (pathname.startsWith('/shared-accounts')) return 'Shared Accounts';
  if (pathname.startsWith('/transactions/import')) return 'Import Transactions';
  if (pathname.startsWith('/investment/')) return 'Investment Details';

  // Fallback logic for other top-level routes
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
  const router = useRouter();
  const pageTitle = getPageTitle(pathname);
  const isHomePage = pathname === '/';

  return (
    <div className='flex h-full w-full items-center gap-2'>
      <Link href='/' aria-label='Go to Home'>
        <Button variant='ghost' size='icon' className='h-7 w-7'>
          <Home className={cn('h-4 w-4', isHomePage ? 'text-primary' : 'text-muted-foreground')} />
        </Button>
      </Link>

      <span
        className={cn(
          'ml-1 overflow-hidden text-ellipsis whitespace-nowrap text-sm font-medium',
          !isHomePage && 'text-foreground',
          isHomePage && 'text-primary'
        )}
      >
        {pageTitle}
      </span>
    </div>
  );
};

export default PageHeader;
