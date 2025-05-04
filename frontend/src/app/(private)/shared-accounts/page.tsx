'use client';
import { useQuery } from '@tanstack/react-query';
import { accountGetSharedWithMe } from '@/lib/endpoints/accounts';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/lib/hooks/useToast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Share2 } from 'lucide-react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const SharedAccountsPage = () => {
  const { showError } = useToast();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const {
    data: sharedAccounts,
    isLoading,
    error
  } = useQuery({
    queryKey: ['sharedAccounts', page, search],
    queryFn: () =>
      accountGetSharedWithMe({
        page,
        limit: 10,
        search,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      }),
    retry: false
  });

  if (isLoading) {
    return (
      <div className='space-y-4 p-4'>
        <Skeleton className='h-8 w-48' />
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
          {[1, 2, 3].map((i) => (
            <div key={i} className='space-y-3 rounded-lg border p-4'>
              <Skeleton className='h-6 w-32' />
              <div className='space-y-2'>
                <Skeleton className='h-4 w-full' />
                <Skeleton className='h-4 w-3/4' />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant='destructive' className='m-4'>
        <AlertCircle className='h-4 w-4' />
        <AlertDescription>
          Failed to load shared accounts: {(error as Error).message}
        </AlertDescription>
      </Alert>
    );
  }

  if (!sharedAccounts || sharedAccounts.data.length === 0) {
    return (
      <div className='space-y-4 p-4'>
        <div className='flex items-center justify-between'>
          <h1 className='flex items-center gap-2 text-2xl font-bold'>
            <Share2 className='h-6 w-6' />
            Shared Accounts
          </h1>
        </div>
        <div className='rounded-lg border p-8 text-center'>
          <div className='flex flex-col items-center gap-2'>
            <Share2 className='text-muted-foreground h-12 w-12' />
            <h3 className='text-lg font-medium'>No shared accounts found</h3>
            <p className='text-muted-foreground'>No accounts have been shared with you yet.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-4 p-4'>
      <div className='flex items-center justify-between'>
        <h1 className='flex items-center gap-2 text-2xl font-bold'>
          <Share2 className='h-6 w-6' />
          Shared Accounts
        </h1>
      </div>

      <Input
        type='text'
        placeholder='Search shared accounts...'
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className='mb-6'
      />

      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
        {sharedAccounts.data.map((account) => (
          <div key={account.id} className='rounded-lg border p-4 transition-shadow hover:shadow-lg'>
            <div className='mb-4 flex items-center justify-between'>
              <div className='flex items-center gap-3'>
                <Avatar>
                  <AvatarImage src={account.owner?.profilePic || undefined} />
                  <AvatarFallback>
                    {account.owner?.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className='font-semibold'>{account.name}</h3>
                  <p className='text-muted-foreground text-sm'>{account.owner?.name}</p>
                </div>
              </div>
            </div>
            <div className='space-y-2'>
              <div className='flex items-center justify-between'>
                <span className='text-muted-foreground text-sm'>Current Balance</span>
                <span className='font-medium'>
                  {formatCurrency(account.balance, account.currency || 'INR')}
                </span>
              </div>
              <Button
                variant='outline'
                className='w-full'
                onClick={() => (window.location.href = `/accounts/${account.id}`)}
              >
                View Account
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className='mt-6 flex justify-center'>
        {sharedAccounts.pagination.total > 10 && (
          <div className='flex space-x-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setPage((old) => Math.max(old - 1, 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setPage((old) => old + 1)}
              disabled={page >= Math.ceil(sharedAccounts.pagination.total / 10)}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SharedAccountsPage;
