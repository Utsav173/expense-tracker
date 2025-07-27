'use client';

import { useQuery } from '@tanstack/react-query';
import { accountGetSharedWithMe } from '@/lib/endpoints/accounts';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, ChevronRight, Search, Share2 } from 'lucide-react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { Account } from '@/lib/types';

// Helper to generate initials for the avatar fallback
const getInitials = (name?: string) => {
  if (!name) return '??';
  const names = name.split(' ');
  if (names.length > 1) {
    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const AccountCard = ({ account }: { account: Account }) => {
  return (
    <Link
      href={`/accounts/${account.id}`}
      className='group bg-card text-card-foreground hover:bg-muted/50 flex items-center justify-between rounded-lg border p-4 transition-all hover:shadow-md'
    >
      <div className='flex items-center gap-4'>
        <Avatar className='h-12 w-12'>
          <AvatarImage src={account.owner?.profilePic || undefined} alt={account.owner?.name} />
          <AvatarFallback>{getInitials(account.owner?.name)}</AvatarFallback>
        </Avatar>
        <div className='flex flex-col'>
          <h3 className='font-semibold'>{account.name}</h3>
          <p className='text-muted-foreground text-sm'>Shared by {account.owner?.name}</p>
        </div>
      </div>
      <div className='flex items-center gap-2 text-right'>
        <div className='flex flex-col'>
          <span className='font-bold'>{formatCurrency(account.balance, account.currency)}</span>
          <span className='text-muted-foreground text-xs'>Current Balance</span>
        </div>
        <ChevronRight className='text-muted-foreground h-5 w-5 transition-transform group-hover:translate-x-1' />
      </div>
    </Link>
  );
};

// Main page component
const SharedAccountsPage = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  const {
    data: sharedAccounts,
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ['sharedAccounts', page, search],
    queryFn: () =>
      accountGetSharedWithMe({
        page,
        limit,
        search,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      }),
    retry: false
  });

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
          {[...Array(3)].map((_, i) => (
            <div key={i} className='flex items-center gap-4 rounded-lg border p-4'>
              <Skeleton className='h-12 w-12 rounded-full' />
              <div className='w-full space-y-2'>
                <Skeleton className='h-5 w-3/4' />
                <Skeleton className='h-4 w-1/2' />
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (isError) {
      return (
        <Alert variant='destructive'>
          <AlertCircle className='h-4 w-4' />
          <AlertDescription>
            Failed to load shared accounts: {(error as Error).message}
          </AlertDescription>
        </Alert>
      );
    }

    if (!sharedAccounts || sharedAccounts.data.length === 0) {
      return (
        <div className='bg-card rounded-lg border p-12 text-center'>
          <div className='mx-auto flex max-w-sm flex-col items-center gap-4'>
            <Share2 className='text-muted-foreground h-16 w-16' />
            <h3 className='text-xl font-medium'>No Shared Accounts</h3>
            <p className='text-muted-foreground'>
              {search
                ? `No accounts matched your search for "${search}".`
                : 'No one has shared an account with you yet.'}
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
        {sharedAccounts.data.map((account) => (
          <AccountCard key={account.id} account={account} />
        ))}
      </div>
    );
  };

  const pagination = sharedAccounts?.pagination;
  const totalPages = pagination ? Math.ceil(pagination.total / limit) : 1;

  return (
    <div className='mx-auto w-full max-w-7xl space-y-6 p-4'>
      <header className='flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <h1 className='flex items-center gap-3 text-2xl font-bold tracking-tight'>
          <Share2 className='h-7 w-7' />
          Shared With Me
        </h1>
        <div className='relative w-full sm:w-64'>
          <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
          <Input
            type='text'
            placeholder='Search accounts...'
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1); // Reset to first page on search
            }}
            className='pl-9'
          />
        </div>
      </header>

      <main>{renderContent()}</main>

      {pagination && pagination.total > limit && (
        <footer className='mt-6 flex items-center justify-center space-x-4'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setPage((old) => Math.max(old - 1, 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className='text-muted-foreground text-sm'>
            Page {page} of {totalPages}
          </span>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setPage((old) => old + 1)}
            disabled={page >= totalPages}
          >
            Next
          </Button>
        </footer>
      )}
    </div>
  );
};

export default SharedAccountsPage;
