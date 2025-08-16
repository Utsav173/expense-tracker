'use client';

import Link from 'next/link';
import * as React from 'react';
import { cn, formatCurrency } from '@/lib/utils';
import { Button } from './button';
import type { AccountAPI } from '@/lib/api/api-types';
import { SingleLineEllipsis } from './ellipsis-components';
import { motion, Variants } from 'framer-motion';
import { Badge } from './badge';
import { Icon } from '@/components/ui/icon';

interface AccountCardProps {
  href: string;
  account: AccountAPI.Account;
  onEdit: (account: AccountAPI.Account) => void;
  onDelete: (id: string) => void;
  showActions?: boolean;
  className?: string;
  variants?: Variants;
}

const ChangePill: React.FC<{ change: number; isExpense?: boolean }> = ({
  change,
  isExpense = false
}) => {
  if (change === 0) return null;
  const isPositive = isExpense ? change < 0 : change > 0;
  const displayChange = Math.abs(change);
  return (
    <Badge
      className={cn(
        'flex items-center gap-1 px-1.5 py-0.5 text-xs font-semibold',
        isPositive
          ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
          : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
      )}
    >
      <Icon name={isPositive ? 'arrowUp' : 'arrowDown'} className='h-3 w-3' />
      <span>{displayChange.toFixed(1)}%</span>
    </Badge>
  );
};

const AccountCard = React.forwardRef<HTMLDivElement, AccountCardProps>(
  ({ className, href, account, onEdit, onDelete, showActions = true, variants }, ref) => {
    const { balance, currency, analytics, name } = account;

    return (
      <motion.div
        ref={ref}
        variants={variants}
        whileHover={{ y: -5, transition: { duration: 0.2 } }}
        className={cn('group relative h-full', className)}
      >
        <Link
          href={href}
          className='bg-card group-hover:border-primary/30 flex h-full flex-col overflow-hidden rounded-xl border shadow-sm transition-all duration-300 group-hover:shadow-lg'
        >
          <div className='flex items-start justify-between p-4'>
            <div className='flex min-w-0 items-center gap-3'>
              <div className='bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-lg'>
                <Icon name='creditCard' className='h-5 w-5' />
              </div>
              <div className='min-w-0'>
                <SingleLineEllipsis className='font-semibold'>{name}</SingleLineEllipsis>
                <p className='text-muted-foreground text-xs'>
                  {account.isDefault ? 'Default Account' : 'Standard Account'}
                </p>
              </div>
            </div>
            <div className='flex scale-90 items-center gap-1 opacity-0 transition-all duration-200 group-hover:scale-100 group-hover:opacity-100 max-sm:opacity-100'>
              {showActions && (
                <>
                  <Button
                    size='icon'
                    variant='ghost'
                    className='h-7 w-7 rounded-md'
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onEdit(account);
                    }}
                    aria-label={`Edit ${name}`}
                  >
                    <Icon name='edit' className='h-[14px] w-[14px]' />
                  </Button>
                  <Button
                    size='icon'
                    variant='ghost'
                    className='hover:bg-destructive/10 hover:text-destructive h-7 w-7 rounded-md'
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onDelete(account.id);
                    }}
                    aria-label={`Delete ${name}`}
                  >
                    <Icon name='trash' className='h-[14px] w-[14px]' />
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className='flex min-w-0 flex-grow flex-col items-center justify-center px-4 py-6'>
            <p className='text-muted-foreground text-xs font-medium uppercase'>Balance</p>
            <SingleLineEllipsis
              className={cn(
                'min-w-0 font-mono text-4xl font-bold tracking-tight tabular-nums',
                balance >= 0 ? 'text-foreground' : 'text-destructive'
              )}
              tooltipContent={balance.toFixed(2)}
            >
              {formatCurrency(balance, currency)}
            </SingleLineEllipsis>
          </div>

          {analytics && (
            <div className='bg-muted/30 mt-auto border-t p-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div className='text-center'>
                  <p className='text-muted-foreground mb-1 text-xs'>Income</p>
                  <div className='flex items-center justify-center gap-2'>
                    <span className='text-sm font-medium text-green-600 dark:text-green-400'>
                      {formatCurrency(analytics.income, currency)}
                    </span>
                    <ChangePill change={analytics.incomePercentageChange} />
                  </div>
                </div>
                <div className='text-center'>
                  <p className='text-muted-foreground mb-1 text-xs'>Expense</p>
                  <div className='flex items-center justify-center gap-2'>
                    <span className='text-sm font-medium text-red-600 dark:text-red-400'>
                      {formatCurrency(analytics.expense, currency)}
                    </span>
                    <ChangePill change={analytics.expensesPercentageChange} isExpense />
                  </div>
                </div>
              </div>
            </div>
          )}
        </Link>
      </motion.div>
    );
  }
);

AccountCard.displayName = 'AccountCard';

export { AccountCard };
