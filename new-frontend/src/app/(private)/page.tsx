'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accountGetAll, accountDelete } from '@/lib/endpoints/accounts';
import Loader from '@/components/ui/loader';
import AddAccountModal from '@/components/modals/add-account-modal';
import { AccountCard, AccountCardContent } from '@/components/ui/account-card';
import { useState } from 'react';
import { Account } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { z } from 'zod';
import { useToast } from '@/lib/hooks/useToast';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import DeleteConfirmationModal from '@/components/modals/delete-confirmation-modal';
import ShareAccountModal from '@/components/modals/share-account-modal';
import AddTransactionModal from '@/components/modals/add-transaction-modal';
import { EditAccountModal } from '@/components/modals/edit-account-modal';

const accountSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters long').max(64),
  balance: z.string().refine((value) => !isNaN(Number(value)), 'Must be a valid number'),
  currency: z
    .string()
    .min(3, 'Currency must have three characters')
    .max(3, 'Currency must have three characters')
    .transform((val) => val.toUpperCase())
});

const AccountList = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['accounts', page, search],
    queryFn: () =>
      accountGetAll({ page, limit: 10, search, sortBy: 'createdAt', sortOrder: 'asc' }),
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
      setDeleteAccountId(null); // Clear selection
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
      <div>Error: {error instanceof Error ? error.message : 'An unknown error occurred.'}</div>
    );
  }

  return (
    <div className='p-4'>
      <div className='flex items-center justify-between pb-4'>
        <h1 className='text-xl font-bold'>Accounts</h1>
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
        className='mb-4'
      />

      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
        {isLoading ? (
          <div className='col-span-3 row-auto flex items-center justify-center'>
            <Loader />
          </div>
        ) : !data || !data.accounts ? (
          <div className='col-span-3 flex items-center justify-center'>
            <h2 className='text-2xl font-bold'>No Accounts Found</h2>
          </div>
        ) : (
          data.accounts.map((account) => (
            <AccountCard key={account.id} href={`/accounts/${account.id}`}>
              <AccountCardContent>
                <div className='flex flex-col space-y-3'>
                  <div className='flex flex-col'>
                    <span className='text-sm font-medium text-primary-foreground/60'>
                      Account Name
                    </span>
                    <h2 className='text-xl font-bold'>{account.name}</h2>
                  </div>

                  <div className='flex flex-col'>
                    <span className='text-sm font-medium text-primary-foreground/60'>Balance</span>
                    <div className='flex items-baseline space-x-1'>
                      <span className='text-2xl font-bold'>
                        {formatCurrency(account.balance, account.currency)}
                      </span>
                    </div>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <Button
                      size='sm'
                      variant='secondary'
                      onClick={(e) => {
                        e.preventDefault();
                        setSelectedItem(account);
                        setIsEditModalOpen(true);
                      }}
                    >
                      Edit
                    </Button>

                    <Button
                      size='sm'
                      variant='destructive'
                      onClick={(e) => {
                        e.preventDefault();
                        setDeleteAccountId(account.id);
                      }}
                    >
                      Delete
                    </Button>

                    {/* <ShareAccountModal accountId={account.id} /> */}
                  </div>
                </div>
              </AccountCardContent>
            </AccountCard>
          ))
        )}
      </div>

      <div className='mt-4 flex justify-center'>
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
          <>
            Are you sure you want to delete <b>{selectedItem?.name}</b> account?
          </>
        }
        onConfirm={handleDelete}
        open={!!deleteAccountId}
        noTriggerButton
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
