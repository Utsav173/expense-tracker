'use client';

import { AccountDetails, ApiResponse } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import React from 'react';
import ShareAccountModal from '../modals/share-account-modal';
import { Share } from 'lucide-react';

interface AccountDetailsHeaderProps {
  account: ApiResponse<AccountDetails> | undefined;
  isLoading: boolean;
}
export const AccountDetailsHeader: React.FC<AccountDetailsHeaderProps> = ({
  account,
  isLoading
}) => {
  return (
    <section className='flex flex-col items-center justify-between gap-4 rounded-xl p-6 shadow-sm md:flex-row'>
      {isLoading || !account ? (
        <Skeleton className='h-8 w-full' />
      ) : (
        <>
          <h1 className='text-xl font-semibold'>{account?.name}</h1>
          <div className='flex flex-row items-center gap-3 max-lg:flex-col'>
            <ShareAccountModal
              accountId={account.id}
              triggerButton={
                <Button
                  size='sm'
                  variant='outline'
                  className='h-7 w-7 rounded-full p-0'
                  aria-label='Share account'
                  onClick={(e) => e.stopPropagation()}
                >
                  <Share className='h-3.5 w-3.5' />
                </Button>
              }
            />
            <Link href={`/accounts/shares/${account?.id}`}>
              <Button variant='outline'>View Account Sharing</Button>
            </Link>
          </div>
        </>
      )}
    </section>
  );
};
