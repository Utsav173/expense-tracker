import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import NoData from '../ui/no-data';
import { DashboardData } from '@/lib/types';
import { cn, formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import { Button } from '../ui/button';

interface AccountListSummaryProps {
  accountsInfo: DashboardData['accountsInfo'] | undefined;
  accountIdToCurrencyMap: Map<string, string>;
  isLoading: boolean;
  className?: string;
}

export const AccountListSummary: React.FC<AccountListSummaryProps> = ({
  accountsInfo,
  accountIdToCurrencyMap,
  isLoading,
  className
}) => {
  const sortedAccounts = accountsInfo
    ?.slice()
    .sort((a, b) => (b.balance ?? 0) - (a.balance ?? 0))
    .slice(0, 5);

  return (
    <Card className={cn('flex flex-col py-4', className)}>
      <CardContent className='scrollbar h-[200px] flex-grow overflow-y-auto'>
        {isLoading ? (
          <div className='space-y-4'>
            {[...Array(3)].map((_, i) => (
              <div key={i} className='space-y-1'>
                <div className='flex justify-between'>
                  <Skeleton className='h-4 w-2/5' />
                  <Skeleton className='h-4 w-1/4' />
                </div>
                <Skeleton className='h-3 w-1/3' />
              </div>
            ))}
          </div>
        ) : !sortedAccounts || sortedAccounts.length === 0 ? (
          <div className='flex h-full items-center justify-center'>
            <NoData message='No accounts added yet.' icon='inbox' />
          </div>
        ) : (
          <ul className='space-y-4'>
            {sortedAccounts.map((accountInfo) => {
              const currency = accountIdToCurrencyMap.get(accountInfo.id) || 'INR';
              return (
                <li key={accountInfo.id} className='text-sm'>
                  <Link
                    href={`/accounts/${accountInfo.id}`}
                    className='block rounded-md p-2 transition-colors hover:bg-muted/50'
                  >
                    <div className='mb-1 flex justify-between'>
                      <span className='mr-2 truncate font-semibold'>{accountInfo.name}</span>
                      <span className='flex-shrink-0 font-bold'>
                        {formatCurrency(accountInfo.balance ?? 0, currency)}
                      </span>
                    </div>
                    <div className='flex justify-between text-xs text-muted-foreground'>
                      <span>
                        In:{' '}
                        <span className='text-green-600'>
                          {formatCurrency(accountInfo.income ?? 0, currency)}
                        </span>
                      </span>
                      <span>
                        Out:{' '}
                        <span className='text-red-600'>
                          {formatCurrency(accountInfo.expense ?? 0, currency)}
                        </span>
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
      {!isLoading && accountsInfo && accountsInfo.length > 0 && (
        <div className='border-t p-3 text-center'>
          <Button variant='link' size='sm' asChild className='text-xs'>
            <Link href='/'>View All Accounts</Link>
          </Button>
        </div>
      )}
    </Card>
  );
};
