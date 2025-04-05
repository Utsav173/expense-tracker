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

interface AccountDetailsHeaderProps {
  account: ApiResponse<AccountDetails> | undefined;
  isLoading: boolean;
  refetchData: () => Promise<void>;
}
export const AccountDetailsHeader: React.FC<AccountDetailsHeaderProps> = ({
  account,
  isLoading,
  refetchData
}) => {
  const isMobile = useIsMobile();

  return (
    <section className='flex w-full flex-col items-center justify-between gap-4 rounded-xl bg-gradient-to-r from-background to-muted p-4 shadow-sm md:flex-row md:gap-6 md:p-6'>
      {isLoading || !account ? (
        <Skeleton className='h-8 w-full md:w-1/2' />
      ) : (
        <>
          <SingleLineEllipsis className='w-full flex-1 text-center text-xl font-semibold text-foreground md:min-w-0 md:text-left'>
            {account?.name}
          </SingleLineEllipsis>
          <div className='flex flex-shrink-0 flex-row items-center gap-2 max-md:flex-wrap max-md:justify-center md:gap-4'>
            <ShareAccountModal
              accountId={account.id}
              triggerButton={
                <Button
                  size='sm'
                  variant='outline'
                  className='h-9 w-9 rounded-full p-0 transition-transform duration-200 hover:scale-110 hover:bg-muted'
                  aria-label='Share account'
                  onClick={(e) => e.stopPropagation()}
                >
                  <Share className='h-4 w-4' />
                </Button>
              }
            />
            <Link href={`/accounts/shares/${account?.id}`}>
              <Button
                variant='outline'
                size='sm'
                className='gap-2 transition-all duration-200 hover:scale-105 hover:bg-muted'
              >
                <History className='h-4 w-4' />
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
                  className='gap-2 transition-all duration-200 hover:scale-105 hover:bg-muted'
                >
                  <ArrowLeftRight className='h-4 w-4' />
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
