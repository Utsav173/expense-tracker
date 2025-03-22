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

        // Handle special case for account details
        if (
          segment === 'accounts' &&
          segments[index + 1] &&
          !segments[index + 1].startsWith('shares')
        ) {
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
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbItems.map((item, index) => (
          <React.Fragment key={item.href}>
            <BreadcrumbItem className={index === 0 ? 'flex items-center' : ''}>
              {index === 0 && <Home className='mr-1 h-4 w-4' />}
              {item.isCurrentPage ? (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={item.href}>{item.label}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {index < breadcrumbItems.length - 1 && <BreadcrumbSeparator />}
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
};

export default RouteBreadcrumbs;
