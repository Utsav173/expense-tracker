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
        // Frosted glass base styling
        'relative overflow-hidden rounded-xl transition-all duration-300 hover:scale-[1.02] focus:scale-[1.02]',
        'bg-background/10 border-border/20 border backdrop-blur-md',
        'shadow-lg hover:shadow-xl focus:shadow-xl',
        'focus:ring-primary/50 focus:ring-2 focus:ring-offset-2 focus:outline-none',
        // Custom frosted glass border effect
        'before:absolute before:inset-0 before:rounded-xl before:border before:border-transparent',
        'before:from-border/30 before:to-border/10 before:bg-gradient-to-br',
        'before:mask-composite-subtract before:-z-10',
        className
      )}
      style={{
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)'
      }}
    >
      {/* Gradient overlay for depth */}
      <div className='from-background/20 to-background/5 pointer-events-none absolute inset-0 bg-gradient-to-br via-transparent' />

      <div
        className={cn(
          'relative p-5',
          // Balance-based styling with glass effect
          balance > 0
            ? 'from-success/20 via-success/5 bg-gradient-to-br to-transparent'
            : balance < 0
              ? 'from-destructive/20 via-destructive/5 bg-gradient-to-br to-transparent'
              : 'from-muted/20 via-muted/5 bg-gradient-to-br to-transparent'
        )}
      >
        {/* Credit card icon with glass effect */}
        <div className='absolute top-4 right-4 opacity-30'>
          <div className='bg-background/10 rounded-lg p-2 backdrop-blur-sm'>
            <CreditCard className='text-foreground/60 h-5 w-5' />
          </div>
        </div>

        <div className='relative z-10'>
          {/* Account info section */}
          <div className='mb-4 flex min-w-0 items-start gap-3'>
            {owner.profilePic && (
              <div className='relative h-12 w-12 shrink-0'>
                <Image
                  src={owner.profilePic}
                  alt={owner.name}
                  fill
                  className='ring-background/20 rounded-full object-cover ring-2'
                />
              </div>
            )}
            <div className='mr-4 flex min-w-0 flex-col items-start'>
              <SingleLineEllipsis showTooltip className='text-foreground text-lg font-semibold'>
                {name}
              </SingleLineEllipsis>
              <p className='text-foreground/70 text-sm'>{owner.name}</p>
            </div>
          </div>

          {/* Balance section with enhanced glass effect */}
          <div className='bg-background/10 border-border/20 mb-4 rounded-lg border p-3 backdrop-blur-sm'>
            <span className='text-foreground/60 text-xs font-medium tracking-wide uppercase'>
              Balance
            </span>
            <span
              className={cn(
                'mt-1 block text-2xl font-bold',
                balance > 0 ? 'text-success' : balance < 0 ? 'text-destructive' : 'text-foreground'
              )}
            >
              {formatCurrency(balance, currency)}
            </span>
          </div>

          {/* Analytics section with frosted glass panels */}
          {analytics && (
            <div className='bg-background/10 border-border/20 mb-4 rounded-lg border p-3 backdrop-blur-sm'>
              <div className='space-y-3'>
                {/* Income row */}
                <div className='bg-background/10 flex items-center justify-between rounded-md p-2'>
                  <span className='text-foreground/60 text-xs font-medium'>Income</span>
                  <div className='flex items-center gap-2'>
                    <span className='text-foreground text-sm font-semibold'>
                      {formatCurrency(analytics.income, currency)}
                    </span>
                    <div className='bg-background/20 flex items-center gap-1 rounded-full px-2 py-1'>
                      <span className='text-[0.65rem] font-medium'>
                        {analytics.incomePercentageChange}%
                      </span>
                      {analytics.incomePercentageChange > 0 && (
                        <ArrowUp className='text-success h-3 w-3' />
                      )}
                      {analytics.incomePercentageChange < 0 && (
                        <ArrowDown className='text-destructive h-3 w-3' />
                      )}
                      {analytics.incomePercentageChange === 0 && (
                        <Minus className='text-foreground/60 h-3 w-3' />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expense row */}
                <div className='bg-background/10 flex items-center justify-between rounded-md p-2'>
                  <span className='text-foreground/60 text-xs font-medium'>Expense</span>
                  <div className='flex items-center gap-2'>
                    <span className='text-foreground text-sm font-semibold'>
                      {formatCurrency(analytics.expense, currency)}
                    </span>
                    <div className='bg-background/20 flex items-center gap-1 rounded-full px-2 py-1'>
                      <span className='text-[0.65rem] font-medium'>
                        {analytics.expensesPercentageChange}%
                      </span>
                      {analytics.expensesPercentageChange > 0 && (
                        <ArrowUp className='text-destructive h-3 w-3' />
                      )}
                      {analytics.expensesPercentageChange < 0 && (
                        <ArrowDown className='text-success h-3 w-3' />
                      )}
                      {analytics.expensesPercentageChange === 0 && (
                        <Minus className='text-foreground/60 h-3 w-3' />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer section */}
          <div className='flex items-center justify-between gap-2 pt-2'>
            <p className='text-foreground/50 text-xs'>
              Created on {new Date(createdAt).toLocaleDateString()}
            </p>
            {showActions && (
              <div className='flex gap-2'>
                <Button
                  size='sm'
                  variant='outline'
                  className={cn(
                    'border-border/30 h-8 w-8 rounded-full p-0',
                    'bg-background/10 hover:bg-background/20 backdrop-blur-sm',
                    'transition-all duration-200'
                  )}
                  onClick={(e) => {
                    e.preventDefault();
                    onEdit(account);
                  }}
                  aria-label='Edit account'
                >
                  <Edit className='text-foreground/70 h-3.5 w-3.5' />
                </Button>
                <Button
                  size='sm'
                  variant='outline'
                  className={cn(
                    'border-destructive/30 h-8 w-8 rounded-full p-0',
                    'bg-destructive/10 hover:bg-destructive/20 backdrop-blur-sm',
                    'transition-all duration-200'
                  )}
                  onClick={(e) => {
                    e.preventDefault();
                    onDelete(account.id);
                  }}
                  aria-label='Delete account'
                >
                  <Trash className='text-destructive h-3.5 w-3.5' />
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
