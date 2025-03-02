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
  const [accountId, setAccountIdState] = useState<string | undefined>('');
  const [accountName, setAccountName] = useState<string | null>(null);

  useEffect(() => {
    const accountIdState =
      pathname.startsWith('/accounts/') && pathname.split('/').length === 3
        ? pathname.split('/')[2]
        : undefined;
    setAccountIdState(accountIdState);
  }, []);

  useEffect(() => {
    const fetchAccountName = async () => {
      if (accountId) {
        try {
          const account = await accountGetById(accountId);
          setAccountName(account?.name || null);
        } catch (error) {
          console.error('Error fetching account:', error);
          setAccountName(null);
        }
      } else {
        setAccountName(null);
      }
    };

    fetchAccountName();
  }, [pathname, accountId]);

  const buildBreadcrumbs = (): BreadcrumbItemType[] => {
    const breadcrumbs: BreadcrumbItemType[] = [
      { href: '/', label: 'Home', isCurrentPage: false },
      { href: '/accounts', label: 'Accounts', isCurrentPage: pathname === '/accounts' }
    ];

    if (pathname.startsWith('/accounts/shares/')) {
      breadcrumbs.push({
        href: `/accounts/${accountId}`,
        label: accountName || 'Account Details',
        isCurrentPage: false
      });
      breadcrumbs.push({
        href: `/accounts/account-sharing/${accountId}`,
        label: 'Account Sharing',
        isCurrentPage: true
      });
    } else if (pathname.startsWith('/accounts/') && accountId) {
      breadcrumbs.push({
        href: `/accounts/${accountId}`,
        label: accountName || 'Account Details',
        isCurrentPage: true
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
