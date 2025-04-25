'use client';

import { AccountDetails, ApiResponse } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import React from 'react';
import ShareAccountModal from '../modals/share-account-modal';
import { ArrowLeftRight, History, Share } from 'lucide-react';
import AddTransactionModal from '../modals/add-transaction-modal';
import { useIsMobile } from '@/hooks/use-mobile';
import { SingleLineEllipsis } from '../ui/ellipsis-components';
import { cn } from '@/lib/utils';

interface AccountDetailsHeaderProps {
  account: ApiResponse<AccountDetails> | undefined;
  isLoading: boolean;
  refetchData: () => Promise<void>;
  isMobile: boolean;
}

export const AccountDetailsHeader: React.FC<AccountDetailsHeaderProps> = ({
  account,
  isLoading,
  refetchData,
  isMobile
}) => {
  return (
    <section className='from-background to-muted flex min-w-0 flex-col items-center justify-between gap-4 rounded-xl bg-linear-to-r p-4 shadow-xs md:flex-row md:gap-6 md:p-6'>
      {isLoading || !account ? (
        <Skeleton className={cn('h-8 md:w-1/2', isMobile ? 'w-[100px]' : 'w-full')} />
      ) : (
        <>
          <div
            className={cn(
              'truncate text-center text-xl font-semibold md:text-left',
              isMobile ? 'w-full' : 'w-1/2'
            )}
          >
            {account?.name}
          </div>
          <div className='flex flex-row flex-wrap items-center justify-center gap-2 md:flex-nowrap md:gap-4'>
            <ShareAccountModal
              accountId={account.id}
              triggerButton={
                <Button
                  size='sm'
                  variant='outline'
                  className='hover:bg-muted h-8 w-8 rounded-full p-0 transition-transform duration-200 hover:scale-110 md:h-9 md:w-9'
                  aria-label='Share account'
                  onClick={(e) => e.stopPropagation()}
                >
                  <Share className='h-3.5 w-3.5 md:h-4 md:w-4' />
                </Button>
              }
            />
            <Link href={`/accounts/shares/${account?.id}`} className='shrink-0'>
              <Button
                variant='outline'
                size='sm'
                className='hover:bg-muted h-8 gap-1.5 text-xs transition-all duration-200 hover:scale-105 md:h-9 md:gap-2 md:text-sm'
              >
                <History className='h-3.5 w-3.5 md:h-4 md:w-4' />
                <span className='hidden md:inline'>View Account Sharing</span>
                <span className='md:hidden'>Shares</span>
              </Button>
            </Link>
            <AddTransactionModal
              onTransactionAdded={async () => {
                await refetchData();
              }}
              accountId={account.id}
              triggerButton={
                <Button
                  variant='outline'
                  size='sm'
                  className='hover:bg-muted h-8 gap-1.5 text-xs transition-all duration-200 hover:scale-105 md:h-9 md:gap-2 md:text-sm'
                >
                  <ArrowLeftRight className='h-3.5 w-3.5 md:h-4 md:w-4' />
                  <span className='hidden capitalize md:inline'>Add Transaction</span>
                  <span className='capitalize md:hidden'>Add</span>
                </Button>
              }
            />
          </div>
        </>
      )}
    </section>
  );
};
