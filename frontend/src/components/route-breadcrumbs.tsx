'use client';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { accountGetById } from '@/lib/endpoints/accounts';

interface BreadcrumbItemType {
  href: string;
  label: string;
  isCurrentPage: boolean;
}

const RouteBreadcrumbs: React.FC = () => {
  const pathname = usePathname();
  const [accountId, setAccountIdState] = useState<string | undefined>(undefined);
  const [accountName, setAccountName] = useState<string | null>(null);

  // Handle accountId extraction from pathname
  useEffect(() => {
    if (!pathname) return;

    const accountIdState =
      pathname.startsWith('/accounts/') && pathname.split('/').length === 3
        ? pathname.split('/')[2]
        : undefined;
    setAccountIdState(accountIdState);
  }, [pathname]);

  // Handle account name fetching
  useEffect(() => {
    let mounted = true;

    const fetchAccountName = async () => {
      if (!accountId) {
        setAccountName(null);
        return;
      }

      try {
        const account = await accountGetById(accountId);
        if (mounted) {
          setAccountName(account?.name || null);
        }
      } catch (error) {
        console.error('Error fetching account:', error);
        if (mounted) {
          setAccountName(null);
        }
      }
    };

    fetchAccountName();

    return () => {
      mounted = false;
    };
  }, [accountId]);

  const buildBreadcrumbs = (): BreadcrumbItemType[] => {
    const breadcrumbs: BreadcrumbItemType[] = [
      { href: '/', label: 'Home', isCurrentPage: pathname === '/' }
    ];

    if (!pathname) return breadcrumbs;

    const segments = pathname.split('/').filter(Boolean);

    if (segments.length > 0) {
      let currentPath = '';

      segments.forEach((segment, index) => {
        currentPath += `/${segment}`;

        // Skip UUID-like segments
        if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)) {
          return;
        }

        // Handle special case for account details
        if (segment === 'accounts' && segments[index + 1]) {
          breadcrumbs.push({
            href: currentPath,
            label: 'Accounts',
            isCurrentPage: pathname === currentPath
          });

          if (accountId && accountName) {
            breadcrumbs.push({
              href: `/accounts/${accountId}`,
              label: accountName,
              isCurrentPage: pathname === `/accounts/${accountId}`
            });
          }
          return;
        }

        // Handle regular routes
        if (!/^\d+$/.test(segment)) {
          const label = segment
            .split('-')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');

          breadcrumbs.push({
            href: currentPath,
            label,
            isCurrentPage: pathname === currentPath
          });
        }
      });
    }

    return breadcrumbs;
  };

  const breadcrumbItems = buildBreadcrumbs();

  return (
    <div className='relative w-full'>
      <Breadcrumb className='min-w-0'>
        <BreadcrumbList className='scrollbar-none flex overflow-x-auto whitespace-nowrap px-2 py-1'>
          {breadcrumbItems.map((item, index) => (
            <React.Fragment key={item.href}>
              <BreadcrumbItem
                className={`${index === 0 ? 'flex shrink-0 items-center' : 'shrink-0'}`}
              >
                {index === 0 && <Home className='mr-1 h-4 w-4 flex-shrink-0' />}
                {item.isCurrentPage ? (
                  <BreadcrumbPage className='max-w-[150px] truncate'>{item.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={item.href} className='inline-block max-w-[150px] truncate'>
                      {item.label}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {index < breadcrumbItems.length - 1 && (
                <BreadcrumbSeparator className='flex-shrink-0' />
              )}
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
};

export default RouteBreadcrumbs;
