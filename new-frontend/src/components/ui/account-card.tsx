'use client';

import Link from 'next/link';
import * as React from 'react';
import { ArrowRight, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';

const AccountCard = React.forwardRef<
  HTMLAnchorElement,
  React.ComponentPropsWithoutRef<'a'> & { href: string }
>(({ className, children, href, ...props }, ref) => (
  <Link
    ref={ref}
    href={href}
    className={cn(
      'group relative block overflow-hidden rounded-xl bg-gradient-to-br from-primary/80 to-primary p-6 text-primary-foreground shadow-lg transition-all duration-300',
      'hover:translate-y-[-2px] hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
      className
    )}
    {...props}
  >
    <div className='absolute right-4 top-4 text-primary-foreground/20'>
      <CreditCard className='size-8' />
    </div>
    <div className='relative z-10'>
      {children}
      <ArrowRight className='absolute bottom-0 right-0 size-5 translate-x-4 text-primary-foreground/40 transition-transform duration-300 ease-in-out group-hover:translate-x-0' />
    </div>
    <div className='absolute inset-0 bg-gradient-to-t from-black/20 to-transparent' />
    <div className='absolute bottom-0 left-0 right-0 top-32 bg-gradient-to-t from-black/20 to-transparent' />
  </Link>
));

AccountCard.displayName = 'AccountCard';

const AccountCardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn('space-y-2', className)} {...props}>
      <div className='flex justify-between'>{children}</div>
    </div>
  )
);

AccountCardContent.displayName = 'AccountCardContent';

export { AccountCard, AccountCardContent };
