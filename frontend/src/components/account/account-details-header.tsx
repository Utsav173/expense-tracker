'use client';

import { AccountDetails, ApiResponse } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import React from 'react';
import ShareAccountModal from '../modals/share-account-modal';
import { ArrowLeftRight, History, Share } from 'lucide-react';
import AddTransactionModal from '../modals/add-transaction-modal';
import { useQueryClient } from '@tanstack/react-query';
import { useIsMobile } from '@/hooks/use-mobile';

interface AccountDetailsHeaderProps {
  account: ApiResponse<AccountDetails> | undefined;
  isLoading: boolean;
}
export const AccountDetailsHeader: React.FC<AccountDetailsHeaderProps> = ({
  account,
  isLoading
}) => {
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const refetchData = () => {
    queryClient.invalidateQueries({
      queryKey: [
        'account',
        'customAnalytics',
        'incomeExpenseChart',
        'accountTransactions',
        'categories'
      ]
    });
  };

  return (
    <section className='flex flex-col items-center justify-between gap-4 rounded-xl bg-gradient-to-r from-background to-muted p-6 shadow-sm md:flex-row'>
      {isLoading || !account ? (
        <Skeleton className='h-8 w-full' />
      ) : (
        <>
          <h1 className='text-xl font-semibold text-foreground'>{account?.name}</h1>
          <div className='flex flex-row items-center gap-4 max-md:flex-wrap max-md:justify-center'>
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
                className='gap-2 transition-all duration-200 hover:scale-105 hover:bg-muted'
              >
                {isMobile ? (
                  <>
                    <History className='h-4 w-4' />
                    <span>Share</span>
                  </>
                ) : (
                  <span>View Account Sharing</span>
                )}
              </Button>
            </Link>
            <AddTransactionModal
              onTransactionAdded={refetchData}
              accountId={account.id}
              triggerButton={
                <Button
                  variant='outline'
                  className='gap-2 transition-all duration-200 hover:scale-105 hover:bg-muted'
                >
                  <ArrowLeftRight className='h-4 w-4' />
                  <span className='capitalize'>{isMobile ? 'Add' : 'Add Transaction'}</span>
                </Button>
              }
            />
          </div>
        </>
      )}
    </section>
  );
};
