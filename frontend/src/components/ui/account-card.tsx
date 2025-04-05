'use client';

import Link from 'next/link';
import * as React from 'react';
import { CreditCard, ArrowUp, ArrowDown, Minus, Edit, Trash } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';
import Image from 'next/image';
import { Button } from './button';
import { Account } from '@/lib/types';
import ShareAccountModal from '../modals/share-account-modal';
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
        'rounded-lg border border-gray-200 bg-white shadow-md transition-shadow duration-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2', // Removed h-[350px]
        className
      )}
    >
      <div
        className={cn(
          'relative p-4', // Reduced padding from p-6 to p-4
          balance > 0
            ? 'bg-green-50 text-green-900' // Added subtle background colors
            : balance < 0
              ? 'bg-red-50 text-red-900'
              : 'bg-gray-50 text-gray-900'
        )}
      >
        <div className='absolute right-3 top-3 opacity-50'>
          <CreditCard className='h-6 w-6' /> {/* Reduced icon size */}
        </div>
        <div className='relative z-10'>
          <div className='flex items-start gap-3'>
            {' '}
            {/* Reduced gap */}
            {owner.profilePic && (
              <div className='relative h-10 w-10 flex-shrink-0'>
                {' '}
                {/* Reduced image size */}
                <Image
                  src={owner.profilePic}
                  alt={owner.name}
                  fill
                  className='rounded-full object-cover'
                />
              </div>
            )}
            <div className='mr-4 flex w-full flex-col items-start'>
              <SingleLineEllipsis className='text-base font-semibold'>{name}</SingleLineEllipsis>
              <p className='text-xs text-gray-500'>{owner.name}</p>
            </div>
          </div>

          <div className='my-3'>
            {' '}
            {/* Reduced margin */}
            <span className='text-xs font-medium text-gray-600'>Balance</span>
            <span
              className={cn(
                'block text-xl font-bold', // Reduced text size
                balance > 0 ? 'text-green-800' : balance < 0 ? 'text-red-800' : 'text-gray-800'
              )}
            >
              {formatCurrency(balance, currency)}
            </span>
          </div>

          {analytics && (
            <div className='mb-3 rounded-md bg-white p-2 text-sm'>
              {' '}
              {/* Reduced padding and changed background */}
              <div className='flex items-center justify-between'>
                <span className='text-xs text-gray-700'>Income</span> {/* Reduced text size */}
                <div className='flex items-center'>
                  <span className='text-xs font-medium text-gray-900'>
                    {' '}
                    {/* Reduced text size */}
                    {formatCurrency(analytics.income, currency)}
                  </span>
                  <div className='ml-1 flex items-center'>
                    <span className='text-[0.6rem]'>
                      {' '}
                      {/* Very small text size */}
                      {analytics.incomePercentageChange}%
                    </span>
                    {analytics.incomePercentageChange > 0 && (
                      <ArrowUp className='ml-1 h-2.5 w-2.5 text-green-500' /> /* Reduced icon size */
                    )}
                    {analytics.incomePercentageChange < 0 && (
                      <ArrowDown className='ml-1 h-2.5 w-2.5 text-red-500' /> /* Reduced icon size */
                    )}
                    {analytics.incomePercentageChange === 0 && (
                      <Minus className='ml-1 h-2.5 w-2.5 text-gray-500' /> /* Reduced icon size */
                    )}
                  </div>
                </div>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-xs text-gray-700'>Expense</span> {/* Reduced text size */}
                <div className='flex items-center'>
                  <span className='text-xs font-medium text-gray-900'>
                    {' '}
                    {/* Reduced text size */}
                    {formatCurrency(analytics.expense, currency)}
                  </span>
                  <div className='ml-1 flex items-center'>
                    <span className='text-[0.6rem]'>
                      {' '}
                      {/* Very small text size */}
                      {analytics.expensesPercentageChange}%
                    </span>
                    {analytics.expensesPercentageChange > 0 && (
                      <ArrowUp className='ml-1 h-2.5 w-2.5 text-red-500' /> /* Reduced icon size */
                    )}
                    {analytics.expensesPercentageChange < 0 && (
                      <ArrowDown className='ml-1 h-2.5 w-2.5 text-green-500' /> /* Reduced icon size */
                    )}
                    {analytics.expensesPercentageChange === 0 && (
                      <Minus className='ml-1 h-2.5 w-2.5 text-gray-500' /> /* Reduced icon size */
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className='mt-auto flex items-center justify-between gap-2 pt-3'>
            {' '}
            {/* Reduced padding */}
            <p className='text-[0.6rem] text-gray-500'>
              Created on {new Date(createdAt).toLocaleDateString()}
            </p>
            {showActions && (
              <div className='flex gap-1'>
                {/* Reduced gap */}
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
                  <Edit className='h-3.5 w-3.5' />
                </Button>
                <Button
                  size='sm'
                  variant='outline'
                  className='h-7 w-7 rounded-full p-0 text-red-500'
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
