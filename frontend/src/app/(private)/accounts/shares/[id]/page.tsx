'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import React, { use } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { accountGetPreviousShares, accountRevokeShare } from '@/lib/endpoints/accounts';
import { useToast } from '@/lib/hooks/useToast';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Share2, Mail, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import ShareAccountModal from '@/components/modals/share-account-modal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { MoreVertical } from 'lucide-react';
import { useInvalidateQueries } from '@/hooks/useInvalidateQueries';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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
    return (
      <Alert variant='destructive' className='m-4'>
        <AlertCircle className='h-4 w-4' />
        <AlertDescription>
          Failed to load account shares: {(error as Error).message}
        </AlertDescription>
      </Alert>
    );
  }

  if (!shares || shares.length === 0) {
    return (
      <div className='space-y-4 p-4'>
        <div className='flex items-center justify-between'>
          <h1 className='flex items-center gap-2 text-2xl font-bold'>
            <Share2 className='h-6 w-6' />
            Account Shares
          </h1>
          <ShareAccountModal accountId={id} />
        </div>
        <Card className='p-8 text-center'>
          <div className='flex flex-col items-center gap-2'>
            <Share2 className='text-muted-foreground h-12 w-12' />
            <h3 className='text-lg font-medium'>No shares found</h3>
            <p className='text-muted-foreground'>
              This account hasn&apos;t been shared with anyone yet.
            </p>
            <ShareAccountModal
              accountId={id}
              triggerButton={<Button className='mt-4'>Share Account</Button>}
            />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className='space-y-4 p-4'>
      <div className='flex items-center justify-between'>
        <h1 className='flex items-center gap-2 text-2xl font-bold'>
          <Share2 className='h-6 w-6' />
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
                    <AvatarImage src={share.User.profilePic || undefined} />
                    <AvatarFallback>
                      {share.User.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </AvatarFallback>
                  </Avatar>
                  <CardTitle className='text-lg'>{share.User.name}</CardTitle>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant='ghost' size='icon'>
                      <MoreVertical className='h-4 w-4' />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end'>
                    <DropdownMenuItem
                      className='text-destructive'
                      onClick={() => revokeShareMutation.mutate(share.User.id)}
                    >
                      <Trash2 className='mr-2 h-4 w-4' />
                      Revoke Access
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <div className='space-y-3'>
                <div className='flex items-center gap-2 text-sm'>
                  <Mail className='text-muted-foreground h-4 w-4' />
                  <span className='text-muted-foreground'>{share.User.email}</span>
                </div>
                <div className='border-t pt-2'>
                  <div className='flex items-center justify-between'>
                    <span className='text-muted-foreground text-sm'>Current Balance</span>
                    <span className='font-medium'>{formatCurrency(share.balance, 'INR')}</span>
                  </div>
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
