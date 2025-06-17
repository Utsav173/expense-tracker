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
>(({ className, href, account, onEdit, onDelete, showActions = true, ...props }, ref) => {
  const { balance, currency, analytics, owner, name, createdAt } = account;

  const getChangeIcon = (change: number) => {
    if (change > 0) return <ArrowUp className='h-3 w-3' />;
    if (change < 0) return <ArrowDown className='h-3 w-3' />;
    return <Minus className='h-3 w-3' />;
  };

  const getChangeColor = (change: number, isExpense = false) => {
    if (change === 0) return 'text-foreground/60';
    if (isExpense) {
      return change > 0 ? 'text-destructive' : 'text-success';
    }
    return change > 0 ? 'text-success' : 'text-destructive';
  };

  return (
    <Link
      ref={ref}
      href={href}
      className={cn(
        'relative block overflow-hidden rounded-xl transition-all duration-300',
        'hover:scale-[1.02] focus:scale-[1.02]',
        'bg-background/10 border-border/20 border backdrop-blur-md',
        'shadow-lg hover:shadow-xl focus:shadow-xl',
        'focus:ring-primary/50 focus:ring-2 focus:ring-offset-2 focus:outline-none',
        'w-full',
        className
      )}
      style={{
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)'
      }}
      {...props}
    >
      {/* Background gradient */}
      <div className='from-background/20 to-background/5 pointer-events-none absolute inset-0 bg-gradient-to-br via-transparent' />

      <div
        className={cn(
          'relative p-4',
          balance > 0
            ? 'from-success/20 via-success/5 bg-gradient-to-br to-transparent'
            : balance < 0
              ? 'from-destructive/20 via-destructive/5 bg-gradient-to-br to-transparent'
              : 'from-muted/20 via-muted/5 bg-gradient-to-br to-transparent'
        )}
      >
        {/* Header with profile and card icon */}
        <div className='mb-3 flex items-start justify-between'>
          <div className='flex min-w-0 flex-1 items-start gap-3'>
            {owner.profilePic && (
              <div className='relative h-10 w-10 shrink-0'>
                <Image
                  src={owner.profilePic}
                  alt={owner.name}
                  fill
                  className='ring-background/20 rounded-full object-cover ring-2'
                  sizes='40px'
                />
              </div>
            )}
            <div className='min-w-0 flex-1'>
              <SingleLineEllipsis
                showTooltip
                className='text-foreground text-base leading-tight font-semibold'
              >
                {name}
              </SingleLineEllipsis>
              <p className='text-foreground/70 mt-0.5 text-sm'>{owner.name}</p>
            </div>
          </div>

          <div className='opacity-30'>
            <div className='bg-background/10 rounded-lg p-1.5 backdrop-blur-sm'>
              <CreditCard className='text-foreground/60 h-4 w-4' />
            </div>
          </div>
        </div>

        {/* Current Balance */}
        <div className='mb-3'>
          <span className='text-foreground/60 mb-1 block text-xs font-medium tracking-wide uppercase'>
            Current Balance
          </span>
          <span
            className={cn(
              'block text-xl font-bold',
              balance > 0 ? 'text-success' : balance < 0 ? 'text-destructive' : 'text-foreground'
            )}
          >
            {formatCurrency(balance, currency)}
          </span>
        </div>

        {/* Analytics */}
        {analytics && (
          <div className='mb-3 space-y-2'>
            {/* Income */}
            <div className='flex items-center justify-between'>
              <span className='text-foreground/60 text-xs font-medium uppercase'>Income</span>
              <div className='flex items-center gap-2'>
                <span className='text-foreground text-sm font-semibold'>
                  {formatCurrency(analytics.income, currency)}
                </span>
                <div className='bg-background/20 flex items-center gap-1 rounded-full px-2 py-0.5'>
                  <span className='text-[0.65rem] font-medium'>
                    +{analytics.incomePercentageChange}%
                  </span>
                  <span className={getChangeColor(analytics.incomePercentageChange)}>
                    {getChangeIcon(analytics.incomePercentageChange)}
                  </span>
                </div>
              </div>
            </div>

            {/* Expenses */}
            <div className='flex items-center justify-between'>
              <span className='text-foreground/60 text-xs font-medium uppercase'>Expenses</span>
              <div className='flex items-center gap-2'>
                <span className='text-foreground text-sm font-semibold'>
                  {formatCurrency(analytics.expense, currency)}
                </span>
                <div className='bg-background/20 flex items-center gap-1 rounded-full px-2 py-0.5'>
                  <span className='text-[0.65rem] font-medium'>
                    {analytics.expensesPercentageChange}%
                  </span>
                  <span className={getChangeColor(analytics.expensesPercentageChange, true)}>
                    {getChangeIcon(analytics.expensesPercentageChange)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className='flex items-center justify-between gap-2 pt-2'>
          <p className='text-foreground/50 text-xs'>
            Created{' '}
            {new Date(createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </p>
          {showActions && (
            <div className='flex gap-1.5'>
              <Button
                size='sm'
                variant='outline'
                className={cn(
                  'h-7 w-7 rounded-full p-0',
                  'bg-background/10 hover:bg-background/20 backdrop-blur-sm',
                  'border-border/30 transition-all duration-200'
                )}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onEdit(account);
                }}
                aria-label={`Edit ${name}`}
              >
                <Edit className='text-foreground/70 h-3 w-3' />
              </Button>
              <Button
                size='sm'
                variant='outline'
                className={cn(
                  'h-7 w-7 rounded-full p-0',
                  'bg-destructive/10 hover:bg-destructive/20 backdrop-blur-sm',
                  'border-destructive/30 transition-all duration-200'
                )}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDelete(account.id);
                }}
                aria-label={`Delete ${name}`}
              >
                <Trash className='text-destructive h-3 w-3' />
              </Button>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
});

AccountCard.displayName = 'AccountCard';

export { AccountCard };
