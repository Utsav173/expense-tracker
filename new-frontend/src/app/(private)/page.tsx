// page.tsx
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accountGetAll, accountDelete } from '@/lib/endpoints/accounts';
import Loader from '@/components/ui/loader';
import AddAccountModal from '@/components/modals/add-account-modal';
import { AccountCard } from '@/components/ui/account-card'; // Removed AccountCardContent import
import { useState } from 'react';
import { Account } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { useToast } from '@/lib/hooks/useToast';
import { Button } from '@/components/ui/button';
import DeleteConfirmationModal from '@/components/modals/delete-confirmation-modal';
import AddTransactionModal from '@/components/modals/add-transaction-modal';
import { EditAccountModal } from '@/components/modals/edit-account-modal';
import { cn } from '@/lib/utils';

const AccountList = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['accounts', page, search],
    queryFn: () =>
      accountGetAll({
        page,
        limit: 10,
        search,
        sortBy: 'createdAt',
        sortOrder: 'asc'
      }),
    retry: false
  });

  const [selectedItem, setSelectedItem] = useState<Account | undefined>();
  const { showError, showSuccess } = useToast();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deleteAccountId, setDeleteAccountId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const deleteAccountMutation = useMutation({
    mutationFn: (id: string) => accountDelete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      showSuccess('Account deleted successfully!');
      setDeleteAccountId(null);
    },
    onError: (error: any) => {
      showError(error.message);
    }
  });

  const handleDelete = async () => {
    if (deleteAccountId) {
      deleteAccountMutation.mutate(deleteAccountId);
    }
  };

  if (isError) {
    return (
      <div>
        Error:
        {error instanceof Error ? error.message : 'An unknown error occurred.'}
      </div>
    );
  }

  const handleEdit = (account: Account) => {
    setSelectedItem(account);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteAccountId(id);
  };

  return (
    <div className='p-4'>
      <div className='mb-6 flex items-center justify-between'>
        <h1 className='text-2xl font-bold'>Accounts</h1>
        <div className='flex items-center gap-2'>
          <AddAccountModal />
          <AddTransactionModal onTransactionAdded={() => {}} />
        </div>
      </div>

      <Input
        type='text'
        placeholder='Search accounts...'
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className='mb-6'
      />

      {isLoading ? (
        <Loader />
      ) : (
        <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
          {!data || !data.accounts ? (
            <div className='col-span-3 flex items-center justify-center'>
              <h2 className='text-2xl font-bold'>No Accounts Found</h2>
            </div>
          ) : (
            data.accounts.map((account) => (
              <AccountCard
                key={account.id}
                href={`/accounts/${account.id}`}
                account={account}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
              />
            ))
          )}
        </div>
      )}

      <div className='mt-6 flex justify-center'>
        {data && data.total > 10 && (
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
              disabled={page >= Math.ceil(data.total / 10)}
            >
              Next
            </Button>
          </div>
        )}
      </div>

      <DeleteConfirmationModal
        title='Delete Account'
        description={
          selectedItem ? `Are you sure you want to delete <b>${selectedItem.name}</b> account?` : ''
        }
        onConfirm={handleDelete}
        open={!!deleteAccountId}
        onOpenChange={() => setDeleteAccountId(null)}
      />

      {selectedItem && (
        <EditAccountModal
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          accountId={selectedItem.id}
          initialValues={{
            name: selectedItem.name,
            balance: selectedItem.balance,
            currency: selectedItem.currency
          }}
          onAccountUpdated={refetch}
        />
      )}
    </div>
  );
};

export default AccountList;
