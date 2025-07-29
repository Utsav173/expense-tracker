'use client';

import Link from 'next/link';
import * as React from 'react';
import { CreditCard, ArrowUp, ArrowDown, Edit, Trash } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';
import { Button } from './button';
import { Account } from '@/lib/types';
import { SingleLineEllipsis } from './ellipsis-components';

interface AccountCardProps {
  href: string;
  account: Account;
  onEdit: (account: Account) => void;
  onDelete: (id: string) => void;
  showActions?: boolean;
  className?: string;
}

const AccountCard = React.forwardRef<HTMLDivElement, AccountCardProps>(
  ({ className, href, account, onEdit, onDelete, showActions = true }, ref) => {
    const { balance, currency, analytics, owner, name, createdAt } = account;

    const ChangePill: React.FC<{ change: number; isExpense?: boolean }> = ({
      change,
      isExpense = false
    }) => {
      if (change === 0) return null;
      const isPositive = isExpense ? change < 0 : change > 0;
      const displayChange = Math.abs(change);
      return (
        <div
          className={cn(
            'flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold',
            isPositive ? 'bg-positive/10 text-positive' : 'bg-negative/10 text-negative'
          )}
        >
          {isPositive ? <ArrowUp className='h-3 w-3' /> : <ArrowDown className='h-3 w-3' />}
          <span>{displayChange.toFixed(2)}%</span>
        </div>
      );
    };

    return (
      <div
        ref={ref}
        className={cn(
          'group relative h-full shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:rounded-2xl hover:shadow-xl',
          className
        )}
      >
        <Link
          href={href}
          className='from-card to-card/95 group-hover:border-primary/30 flex h-full flex-col overflow-hidden rounded-xl border bg-gradient-to-b shadow-lg transition-all duration-300 group-hover:shadow-xl'
        >
          <div className='flex items-start justify-between p-4'>
            <div className='flex min-w-0 flex-1 items-center gap-3'>
              <div className='min-w-0 flex-1'>
                <SingleLineEllipsis
                  showTooltip
                  className='font-semibold text-slate-700 dark:text-slate-300'
                >
                  {name}
                </SingleLineEllipsis>
                <p className='text-xs text-slate-500 dark:text-slate-400'>{owner.name}</p>
              </div>
            </div>
            <div className='flex scale-90 items-center gap-1 opacity-0 transition-all duration-200 group-hover:scale-100 group-hover:opacity-100 max-sm:opacity-100'>
              {showActions && (
                <>
                  <Button
                    size='icon'
                    variant='ghost'
                    className='h-8 w-8 rounded-md'
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onEdit(account);
                    }}
                    aria-label={`Edit ${name}`}
                  >
                    <Edit size={14} />
                  </Button>
                  <Button
                    size='icon'
                    variant='ghost'
                    className='hover:bg-destructive/10 hover:text-destructive h-8 w-8 rounded-md'
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onDelete(account.id);
                    }}
                    aria-label={`Delete ${name}`}
                  >
                    <Trash size={14} />
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className='flex flex-grow flex-col items-center justify-center px-2 py-3'>
            <p className='text-xs font-medium tracking-wider text-slate-500 uppercase dark:text-slate-400'>
              Current Balance
            </p>
            <SingleLineEllipsis
              className={cn(
                'font-mono text-4xl font-bold tracking-tight tabular-nums',
                balance >= 0 ? 'text-slate-900 dark:text-slate-50' : 'text-negative'
              )}
            >
              {formatCurrency(balance, currency)}
            </SingleLineEllipsis>
          </div>

          <div className='bg-muted/20 mt-auto border-t p-4'>
            {analytics && (
              <div className='space-y-2'>
                <div className='flex items-center justify-between text-sm'>
                  <span className='text-slate-500 dark:text-slate-400'>Income</span>
                  <div className='flex items-center gap-2'>
                    <SingleLineEllipsis className='font-mono font-medium text-slate-700 tabular-nums dark:text-slate-300'>
                      {formatCurrency(analytics.income, currency)}
                    </SingleLineEllipsis>
                    <ChangePill change={analytics.incomePercentageChange} />
                  </div>
                </div>
                <div className='flex items-center justify-between text-sm'>
                  <span className='text-slate-500 dark:text-slate-400'>Expenses</span>
                  <div className='flex items-center gap-2'>
                    <SingleLineEllipsis className='font-mono font-medium text-slate-700 tabular-nums dark:text-slate-300'>
                      {formatCurrency(analytics.expense, currency)}
                    </SingleLineEllipsis>
                    <ChangePill change={analytics.expensesPercentageChange} isExpense />
                  </div>
                </div>
              </div>
            )}
            <div
              className={cn(
                'flex items-center justify-between text-xs text-slate-500 dark:text-slate-500',
                analytics ? 'mt-4 border-t pt-4' : ''
              )}
            >
              <p>
                Created{' '}
                {new Date(createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </p>
              <CreditCard className='h-4 w-4' />
            </div>
          </div>
        </Link>
      </div>
    );
  }
);

AccountCard.displayName = 'AccountCard';

export { AccountCard };
