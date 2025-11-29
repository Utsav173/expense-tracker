'use client';

import Link from 'next/link';
import * as React from 'react';
import { cn, formatCurrency } from '@/lib/utils';
import { Button } from './button';
import type { AccountAPI } from '@/lib/api/api-types';
import { SingleLineEllipsis } from './ellipsis-components';
import { motion, Variants } from 'framer-motion';
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

// Percentage change indicator component
const PercentageChange: React.FC<{ value: number; isExpense?: boolean }> = ({
  value,
  isExpense = false
}) => {
  if (value === 0) return null;

  const isPositive = isExpense ? value < 0 : value > 0;
  const displayValue = Math.abs(value);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-[10px] font-medium',
        isPositive ? 'text-emerald-600 dark:text-emerald-500' : 'text-red-600 dark:text-red-500'
      )}
    >
      <Icon name={isPositive ? 'trendingUp' : 'trendingDown'} className='h-3 w-3' />
      {displayValue.toFixed(1)}%
    </span>
  );
};

const AccountCard = React.forwardRef<HTMLDivElement, AccountCardProps>(
  ({ className, href, account, onEdit, onDelete, showActions = true, variants }, ref) => {
    const { balance, currency, analytics, name, isDefault, owner, createdAt } = account;

    // Handle edge cases for analytics
    const hasAnalytics = analytics && (analytics.income > 0 || analytics.expense > 0);
    const totalFlow = (analytics?.income || 0) + (analytics?.expense || 0);
    const incomePercent = totalFlow > 0 ? ((analytics?.income || 0) / totalFlow) * 100 : 50;
    const expensePercent = totalFlow > 0 ? ((analytics?.expense || 0) / totalFlow) * 100 : 50;

    return (
      <motion.div
        ref={ref}
        variants={variants}
        whileHover={{ y: -2 }}
        transition={{ duration: 0.2 }}
        className={cn('group relative h-full', className)}
      >
        {isDefault && (
          <span className='bg-secondary text-secondary-foreground border-accent absolute -top-2 -right-2 rounded-md border px-1.5 py-0.5 text-[10px] font-medium'>
            Default
          </span>
        )}
        <Link
          href={href}
          className='bg-card hover:border-primary/20 flex h-full flex-col overflow-hidden rounded-xl border shadow-sm transition-colors duration-300'
        >
          <div className='flex h-full flex-col p-5'>
            {/* Header: Icon + Name + Actions */}
            <div className='mb-4 flex items-start justify-between gap-2'>
              <div className='flex min-w-0 flex-1 items-center gap-3'>
                <div
                  className={cn(
                    'bg-primary/5 text-primary group-hover:bg-primary/10 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-transparent transition-colors',
                    isDefault &&
                      'bg-accent/20 group-hover:bg-accent/50 text-accent-foreground h-8 w-8 bg-none'
                  )}
                >
                  <Icon name={isDefault ? 'walletFill' : 'wallet'} className='h-6 w-6' />
                </div>
                <div className='min-w-0 flex-1'>
                  <SingleLineEllipsis
                    className='text-foreground font-semibold'
                    tooltipContent={name}
                  >
                    {name}
                  </SingleLineEllipsis>
                  <div className='flex items-center gap-2'>
                    <span className='text-muted-foreground text-xs font-medium'>{currency}</span>
                  </div>
                </div>
              </div>

              {showActions && (
                <div className='flex shrink-0 items-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100'>
                  <Button
                    size='icon'
                    variant='ghost'
                    className='text-muted-foreground hover:text-foreground h-8 w-8'
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onEdit(account);
                    }}
                  >
                    <Icon name='edit' className='h-4 w-4' />
                  </Button>
                  <Button
                    size='icon'
                    variant='ghost'
                    className='text-muted-foreground hover:bg-destructive/10 hover:text-destructive h-8 w-8'
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onDelete(account.id);
                    }}
                  >
                    <Icon name='trash' className='h-4 w-4' />
                  </Button>
                </div>
              )}
            </div>

            {/* Balance */}
            <div className='mb-2'>
              <p className='text-muted-foreground mb-1 text-xs font-medium'>Total Balance</p>
              <SingleLineEllipsis
                className={cn(
                  'text-foreground text-2xl font-bold tracking-tight',
                  balance < 0 && 'text-destructive'
                )}
                tooltipContent={formatCurrency(balance, currency)}
              >
                {formatCurrency(balance, currency)}
              </SingleLineEllipsis>
            </div>

            {/* Analytics Footer */}
            {hasAnalytics ? (
              <div className='border-border/50 mt-auto space-y-2 border-t pt-4'>
                {/* Labels with Percentage Changes */}
                <div className='flex items-center justify-between text-xs'>
                  <div className='flex items-center gap-1.5'>
                    <span className='text-muted-foreground font-medium tracking-wider uppercase'>
                      Income
                    </span>
                    {analytics && analytics.incomePercentageChange !== 0 && (
                      <PercentageChange value={analytics.incomePercentageChange} />
                    )}
                  </div>
                  <div className='flex items-center gap-1.5'>
                    {analytics && analytics.expensesPercentageChange !== 0 && (
                      <PercentageChange value={analytics.expensesPercentageChange} isExpense />
                    )}
                    <span className='text-muted-foreground font-medium tracking-wider uppercase'>
                      Expense
                    </span>
                  </div>
                </div>

                {/* Minimalist Progress Line */}
                <div className='bg-secondary flex h-1.5 w-full overflow-hidden rounded-full'>
                  <div
                    className='bg-emerald-400 transition-all duration-500'
                    style={{ width: `${incomePercent}%` }}
                  />
                  <div
                    className='bg-gray-200 transition-all duration-500 dark:bg-gray-600'
                    style={{ width: `${expensePercent}%` }}
                  />
                </div>

                {/* Values */}
                <div className='flex items-center justify-between'>
                  <div className='text-income text-sm font-semibold'>
                    +{formatCurrency(analytics?.income || 0, currency)}
                  </div>
                  <div className='text-sm font-semibold text-gray-600 dark:text-gray-400'>
                    -{formatCurrency(analytics?.expense || 0, currency)}
                  </div>
                </div>
              </div>
            ) : (
              <div className='border-border/50 mt-auto border-t pt-4'>
                <p className='text-muted-foreground text-center text-xs'>No transactions yet</p>
              </div>
            )}
          </div>
        </Link>
      </motion.div>
    );
  }
);

AccountCard.displayName = 'AccountCard';

export { AccountCard };
