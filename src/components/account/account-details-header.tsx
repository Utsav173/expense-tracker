'use client';

import type { AccountAPI } from '@/lib/api/api-types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import AddTransactionModal from '@/components/modals/add-transaction-modal';
import ShareAccountModal from '@/components/modals/share-account-modal';
import { SingleLineEllipsis } from '../ui/ellipsis-components';
import Link from 'next/link';
import { Icon } from '@/components/ui/icon';

interface AccountDetailsHeaderProps {
  account?: AccountAPI.GetAccountByIdResponse;
  isLoading?: boolean;
  refetchData: () => void;
  isMobile?: boolean;
  isOwner?: boolean;
}

export const AccountDetailsHeader = ({
  account,
  isLoading,
  refetchData,
  isMobile,
  isOwner = true
}: AccountDetailsHeaderProps) => {
  if (isLoading) {
    return (
      <div className='space-y-4'>
        <div className='flex items-center justify-between'>
          <div className='space-y-1'>
            <Skeleton className='h-7 w-64' />
            <Skeleton className='h-5 w-32' />
          </div>
          <div className='flex gap-2 max-sm:hidden'>
            <Skeleton className='h-9 w-24' />
            <Skeleton className='h-9 w-24' />
            <Skeleton className='h-9 w-32' />
          </div>
        </div>
      </div>
    );
  }

  if (!account) return null;

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between max-sm:flex-col max-sm:items-start max-sm:gap-4'>
        <div className='min-w-0 space-y-1 max-sm:w-[300px]'>
          <SingleLineEllipsis className='truncate text-2xl font-semibold tracking-tight'>
            {account.name}
          </SingleLineEllipsis>
          <p className='text-muted-foreground text-sm'>
            {isOwner ? 'Personal Account' : 'Shared Account'} • {account.currency}
          </p>
        </div>

        {isOwner && (
          <div className='flex items-center gap-2 max-sm:w-full max-sm:justify-center'>
            <Button variant='outline' size='sm' className='gap-2' onClick={() => window.print()}>
              <Icon name='download2' className='h-4 w-4' />
              {!isMobile && 'Export'}
            </Button>

            <Link href={`/accounts/statement`} className='shrink-0'>
              <Button variant='outline' size='sm' className='gap-2'>
                <Icon name='statement' className='h-4 w-4' />
                {!isMobile && 'Statement'}
              </Button>
            </Link>

            <Link href={`/accounts/shares/${account?.id}`} className='shrink-0'>
              <Button variant='outline' size='sm' className='gap-2'>
                <Icon name='groups' className='h-4 w-4' />
                {!isMobile && 'View Account Sharing'}
              </Button>
            </Link>

            <ShareAccountModal
              accountId={account.id}
              triggerButton={
                <Button variant='outline' size='sm' className='gap-2'>
                  <Icon name='share' className='h-4 w-4' />
                  {!isMobile && 'Share'}
                </Button>
              }
            />

            <AddTransactionModal
              accountId={account.id}
              onTransactionAdded={() => {
                refetchData();
              }}
              triggerButton={
                <Button variant='transaction' size='sm' className='gap-2'>
                  <Icon name='plus' className='h-4 w-4' />
                  {!isMobile && 'Add Transaction'}
                </Button>
              }
            />
          </div>
        )}
      </div>
    </div>
  );
};
