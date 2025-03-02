'use client';

import { AccountDetails, ApiResponse } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import React from 'react';

interface AccountDetailsHeaderProps {
  account: ApiResponse<AccountDetails> | undefined;
  isLoading: boolean;
}
export const AccountDetailsHeader: React.FC<AccountDetailsHeaderProps> = ({
  account,
  isLoading
}) => {
  return (
    <section className='flex items-center justify-between rounded-xl p-6 shadow-sm'>
      {isLoading ? (
        <Skeleton className='h-8 w-48' />
      ) : (
        <h1 className='text-xl font-semibold'>{account?.name}</h1>
      )}
      <Link href={`/accounts/shares/${account?.id}`}>
        <Button variant='outline'>View Account Sharing</Button>
      </Link>
    </section>
  );
};
