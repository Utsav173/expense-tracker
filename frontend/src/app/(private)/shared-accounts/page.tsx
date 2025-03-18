'use client';

import { useQuery } from '@tanstack/react-query';
import { accountGetSharedWithMe } from '@/lib/endpoints/accounts';
import Loader from '@/components/ui/loader';
import { AccountCard } from '@/components/ui/account-card'; // Import the updated AccountCard
import { useToast } from '@/lib/hooks/useToast';
import { Account } from '@/lib/types';

const SharedAccountsPage = () => {
  const { showError } = useToast();
  const {
    data: sharedAccounts,
    isLoading,
    error
  } = useQuery({
    queryKey: ['sharedAccounts'],
    queryFn: accountGetSharedWithMe,
    retry: false
  });

  if (isLoading) {
    return <Loader />;
  }

  if (error) {
    showError(`Failed to get Shared Accounts Details : ${(error as Error).message}`);
    return <div>Error loading shared accounts.</div>; // Return a div, not null
  }

  if (!sharedAccounts || sharedAccounts.data.length === 0) {
    return (
      <div className='p-4'>
        <h1 className='text-xl font-bold'>Shared Accounts</h1>
        <p className='mt-4'>No accounts have been shared with you.</p>
      </div>
    );
  }

  return (
    <div className='p-4'>
      <h1 className='text-xl font-bold'>Shared Accounts</h1>
      <div className='mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
        {sharedAccounts.data.map((account) => (
          <AccountCard
            key={account.id}
            href={`/accounts/${account.id}`}
            account={account as Account}
            onEdit={() => {}}
            onDelete={() => {}}
            showActions={false}
          />
        ))}
      </div>
    </div>
  );
};

export default SharedAccountsPage;
