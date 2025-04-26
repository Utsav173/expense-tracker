'use client';

import { AccountDetails } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Share, Plus, Download, History } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import AddTransactionModal from '@/components/modals/add-transaction-modal';
import ShareAccountModal from '@/components/modals/share-account-modal';
import { SingleLineEllipsis } from '../ui/ellipsis-components';
import Link from 'next/link';

interface AccountDetailsHeaderProps {
  account?: AccountDetails;
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
              <Download className='h-4 w-4' />
              {!isMobile && 'Export'}
            </Button>

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

            <ShareAccountModal
              accountId={account.id}
              triggerButton={
                <Button variant='outline' size='sm' className='gap-2'>
                  <Share className='h-4 w-4' />
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
                <Button variant='default' size='sm' className='gap-2'>
                  <Plus className='h-4 w-4' />
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
