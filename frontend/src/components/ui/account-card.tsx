'use client';

import Link from 'next/link';
import * as React from 'react';
import { CreditCard, ArrowUp, ArrowDown, Minus, Edit, Trash } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';
import Image from 'next/image';
import { Button } from './button';
import { Account } from '@/lib/types';
import { SingleLineEllipsis } from './ellipsis-components';

interface AccountCardProps extends React.ComponentPropsWithoutRef<'a'> {
  href: string;
  account: Account;
  onEdit: (account: AccountCardProps['account']) => void;
  onDelete: (id: string) => void;
  showActions?: boolean;
}

const AccountCard: React.FC<AccountCardProps> = React.forwardRef<
  HTMLAnchorElement,
  AccountCardProps
>(({ className, href, account, onEdit, onDelete, showActions = true }, ref) => {
  const { balance, currency, analytics, owner, name, createdAt } = account;

  return (
    <Link
      ref={ref}
      href={href}
      className={cn(
        'bg-card focus:ring-primary rounded-lg border shadow-md transition-shadow duration-200 hover:shadow-lg focus:ring-2 focus:ring-offset-2 focus:outline-hidden',
        'border-border',
        className
      )}
    >
      <div
        className={cn(
          'relative p-4',
          balance > 0
            ? 'bg-success/10 text-success-foreground'
            : balance < 0
              ? 'bg-destructive/10 text-destructive-foreground'
              : 'bg-muted text-muted-foreground'
        )}
      >
        <div className='absolute top-3 right-3 opacity-50'>
          <CreditCard className='text-muted-foreground h-6 w-6' />
        </div>
        <div className='relative z-10'>
          <div className='flex min-w-0 items-start gap-3'>
            {owner.profilePic && (
              <div className='relative h-10 w-10 shrink-0'>
                <Image
                  src={owner.profilePic}
                  alt={owner.name}
                  fill
                  className='rounded-full object-cover'
                />
              </div>
            )}
            <div className='mr-4 flex min-w-0 flex-col items-start'>
              <SingleLineEllipsis
                showTooltip
                className='text-card-foreground text-base font-semibold'
              >
                {name}
              </SingleLineEllipsis>
              <p className='text-muted-foreground text-xs'>{owner.name}</p>
            </div>
          </div>

          <div className='my-3'>
            <span className='text-muted-foreground text-xs font-medium'>Balance</span>
            <span
              className={cn(
                'block text-xl font-bold',
                balance > 0
                  ? 'text-success'
                  : balance < 0
                    ? 'text-destructive'
                    : 'text-card-foreground'
              )}
            >
              {formatCurrency(balance, currency)}
            </span>
          </div>

          {analytics && (
            <div className='bg-card border-border mb-3 rounded-md border p-2 text-sm'>
              <div className='flex items-center justify-between'>
                <span className='text-muted-foreground text-xs'>Income</span>
                <div className='flex items-center'>
                  <span className='text-card-foreground text-xs font-medium'>
                    {formatCurrency(analytics.income, currency)}
                  </span>
                  <div className='ml-1 flex items-center'>
                    <span className='text-[0.6rem]'>{analytics.incomePercentageChange}%</span>
                    {analytics.incomePercentageChange > 0 && (
                      <ArrowUp className='text-success ml-1 h-2.5 w-2.5' />
                    )}
                    {analytics.incomePercentageChange < 0 && (
                      <ArrowDown className='text-destructive ml-1 h-2.5 w-2.5' />
                    )}
                    {analytics.incomePercentageChange === 0 && (
                      <Minus className='text-muted-foreground ml-1 h-2.5 w-2.5' />
                    )}
                  </div>
                </div>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-muted-foreground text-xs'>Expense</span>
                <div className='flex items-center'>
                  <span className='text-card-foreground text-xs font-medium'>
                    {formatCurrency(analytics.expense, currency)}
                  </span>
                  <div className='ml-1 flex items-center'>
                    <span className='text-[0.6rem]'>{analytics.expensesPercentageChange}%</span>
                    {analytics.expensesPercentageChange > 0 && (
                      <ArrowUp className='text-destructive ml-1 h-2.5 w-2.5' />
                    )}
                    {analytics.expensesPercentageChange < 0 && (
                      <ArrowDown className='text-success ml-1 h-2.5 w-2.5' />
                    )}
                    {analytics.expensesPercentageChange === 0 && (
                      <Minus className='text-muted-foreground ml-1 h-2.5 w-2.5' />
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className='mt-auto flex items-center justify-between gap-2 pt-3'>
            <p className='text-muted-foreground text-[0.6rem]'>
              Created on {new Date(createdAt).toLocaleDateString()}
            </p>
            {showActions && (
              <div className='flex gap-1'>
                <Button
                  size='sm'
                  variant='outline'
                  className='h-7 w-7 rounded-full p-0'
                  onClick={(e) => {
                    e.preventDefault();
                    onEdit(account);
                  }}
                  aria-label='Edit account'
                >
                  <Edit className='text-muted-foreground h-3.5 w-3.5' />
                </Button>
                <Button
                  size='sm'
                  variant='outline'
                  className='text-destructive h-7 w-7 rounded-full p-0'
                  onClick={(e) => {
                    e.preventDefault();
                    onDelete(account.id);
                  }}
                  aria-label='Delete account'
                >
                  <Trash className='h-3.5 w-3.5' />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
});

AccountCard.displayName = 'AccountCard';

export { AccountCard };
