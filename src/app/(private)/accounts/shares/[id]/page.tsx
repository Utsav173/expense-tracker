'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import React, { use } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { accountGetPreviousShares, accountRevokeShare } from '@/lib/endpoints/accounts';
import { useToast } from '@/lib/hooks/useToast';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import ShareAccountModal from '@/components/modals/share-account-modal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useInvalidateQueries } from '@/hooks/useInvalidateQueries';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import QueryErrorDisplay from '@/components/ui/query-error-display';
import { Icon } from '@/components/ui/icon';

interface PageProps {
  params: Promise<{ id: string }>;
}

const AccountSharesPage = ({ params }: PageProps) => {
  const unwrappedParams = use(params);
  const { id } = unwrappedParams;
  const { showError } = useToast();
  const invalidate = useInvalidateQueries();

  const {
    data: shares,
    isLoading,
    error
  } = useQuery({
    queryKey: ['accountShares', id],
    queryFn: () => accountGetPreviousShares(id),
    retry: false
  });

  const revokeShareMutation = useMutation({
    mutationFn: (userId: string) => accountRevokeShare({ accountId: id, userId }),
    onSuccess: () => {
      invalidate(['accountShares']);
    },
    onError: (error: any) => {
      showError(error.message);
    }
  });

  if (isLoading) {
    return (
      <div className='space-y-4 p-4'>
        <Skeleton className='h-8 w-48' />
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
          {[1, 2, 3].map((i) => (
            <Card key={i} className='p-4'>
              <div className='space-y-3'>
                <Skeleton className='h-6 w-32' />
                <div className='space-y-2'>
                  <Skeleton className='h-4 w-full' />
                  <Skeleton className='h-4 w-3/4' />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <QueryErrorDisplay error={error} message='Failed to load account shares.' />;
  }

  if (!shares || shares.length === 0) {
    return (
      <div className='space-y-4 p-4'>
        <div className='flex items-center justify-between'>
          <h1 className='flex items-center gap-2 text-2xl font-bold'>
            <Icon name='share2' className='h-6 w-6' />
            Account Shares
          </h1>
          <ShareAccountModal accountId={id} />
        </div>
        <Card className='p-8 text-center'>
          <div className='flex flex-col items-center gap-2'>
            <Icon name='share2' className='text-muted-foreground h-12 w-12' />
            <h3 className='text-lg font-medium'>No shares found</h3>
            <p className='text-muted-foreground'>
              This account hasn&apos;t been shared with anyone yet.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className='space-y-4 p-4'>
      <div className='flex items-center justify-between'>
        <h1 className='flex items-center gap-2 text-2xl font-bold'>
          <Icon name='share2' className='h-6 w-6' />
          Account Shares
        </h1>
        <ShareAccountModal accountId={id} />
      </div>

      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
        {shares.map((share) => (
          <Card key={share.id} className='overflow-hidden transition-shadow hover:shadow-lg'>
            <CardHeader className='pb-2'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                  <Avatar>
                    <AvatarImage src={share.image || undefined} />
                    <AvatarFallback>
                      {share?.name
                        ? share.name
                            .split(' ')
                            .map((n) => n)
                            .join('')
                        : ''}
                    </AvatarFallback>
                  </Avatar>
                  <CardTitle className='text-lg'>{share?.name || 'N/A'}</CardTitle>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant='ghost' size='icon'>
                      <Icon name='moreVertical' className='h-4 w-4' />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end'>
                    <DropdownMenuItem
                      className='text-destructive'
                      onClick={() => revokeShareMutation.mutate(share.id)}
                    >
                      <Icon name='trash2' className='mr-2 h-4 w-4' />
                      Revoke Access
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <div className='space-y-3'>
                <div className='flex items-center gap-2 text-sm'>
                  <Icon name='mail' className='text-muted-foreground h-4 w-4' />
                  <span className='text-muted-foreground'>{share?.email || 'N/A'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AccountSharesPage;
