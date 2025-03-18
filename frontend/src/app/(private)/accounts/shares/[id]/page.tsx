'use client';

import { useQuery } from '@tanstack/react-query';
import React, { use } from 'react';
import Loader from '@/components/ui/loader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { accountGetPreviousShares } from '@/lib/endpoints/accounts'; // Assuming this endpoint exists
import { useToast } from '@/lib/hooks/useToast';

interface PageProps {
  params: Promise<{ id: string }>;
}

const AccountSharesPage = ({ params }: PageProps) => {
  const unwrappedParams = use(params);
  const { id } = unwrappedParams;
  const { showError } = useToast();

  const {
    data: shares,
    isLoading,
    error
  } = useQuery({
    queryKey: ['accountShares', id],
    queryFn: () => accountGetPreviousShares(id), // Use the API endpoint
    retry: false
  });

  if (isLoading) {
    return <Loader />;
  }

  if (error) {
    showError(`Failed to get Account Share Details : ${(error as Error).message}`);
    return null;
  }

  if (!shares || shares.length === 0) {
    return (
      <div className='p-4'>
        <h1 className='text-xl font-bold'>Account Shares</h1>
        <p className='mt-4'>No shares found for this account.</p>
      </div>
    );
  }

  return (
    <div className='p-4'>
      <h1 className='text-xl font-bold'>Account Shares</h1>
      <div className='mt-4'>
        {shares.map((share) => (
          <Card key={share.id} className='mb-4'>
            <CardHeader>
              <CardTitle>{share.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                <strong>Shared with User:</strong> {share?.User?.name} ({share?.User?.email})
              </p>
              <p>
                <strong>Balance:</strong> {share.balance}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AccountSharesPage;
