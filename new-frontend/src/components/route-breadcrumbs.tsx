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
import React from 'react'; // Import React

interface BreadcrumbItemType {
  href: string;
  label: string;
  isCurrentPage: boolean;
}

const RouteBreadcrumbs = () => {
  const pathname = usePathname();

  // Build breadcrumb items based on the path
  const buildBreadcrumbs = (): BreadcrumbItemType[] => {
    const pathSegments = pathname.split('/').filter((segment) => segment !== '');
    const breadcrumbs: BreadcrumbItemType[] = [
      { href: '/', label: 'Home', isCurrentPage: false } // Always include Home
    ];

    let currentPath = '';
    for (let i = 0; i < pathSegments.length; i++) {
      const segment = pathSegments[i];
      currentPath += `/${segment}`;
      const label = segment.charAt(0).toUpperCase() + segment.slice(1); // Capitalize
      const isCurrentPage = i === pathSegments.length - 1;

      breadcrumbs.push({
        href: currentPath,
        label: label.replace(/-/g, ' '), // Replace hyphens with spaces
        isCurrentPage
      });
    }
    return breadcrumbs;
  };

  const breadcrumbItems = buildBreadcrumbs();

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbItems.map((item, index) => (
          // Use a React Fragment to group the item and separator
          <React.Fragment key={item.href}>
            <BreadcrumbItem className={index === 0 ? 'flex items-center' : ''}>
              {index === 0 && <Home className='mr-1 h-4 w-4' />}
              {/* Use Link for internal navigation */}
              {item.isCurrentPage ? (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={item.href}>{item.label}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {/* Conditionally render the separator */}
            {index < breadcrumbItems.length - 1 && <BreadcrumbSeparator />}
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
};

export default RouteBreadcrumbs;
