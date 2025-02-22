'use client';

import { useQuery } from '@tanstack/react-query';
import { accountGetAll, accountDelete, accountUpdate } from '@/lib/endpoints/accounts';
import Loader from '@/components/ui/loader';
import AddAccountModal from '@/components/modals/add-account-modal';
import { AccountCard, AccountCardContent } from '@/components/ui/account-card';
import UpdateModal from '@/components/modals/update-modal';
import { useState } from 'react';
import { Account } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { z } from 'zod';
import { useToast } from '@/lib/hooks/useToast';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import DeleteConfirmationModal from '@/components/modals/delete-confirmation-modal';
import AddTransactionModal from '@/components/modals/add-transaction-modal';

const accountSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters long').max(64),
  balance: z.string().refine((value) => !isNaN(Number(value)), 'Must be a valid number'),
  currency: z
    .string()
    .min(3, 'Currency must have three characters')
    .max(3, 'Currency must have three characters')
    .transform((val) => val.toUpperCase())
});

type AccountFormSchema = z.infer<typeof accountSchema>;

const AccountList = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['accounts', page, search],
    queryFn: () =>
      accountGetAll({ page, limit: 10, search, sortBy: 'createdAt', sortOrder: 'asc' }),
    retry: false
  });

  const [selectedItem, setSelectedItem] = useState<Account | undefined>();

  const { showError, showSuccess } = useToast();

  const handleEditAccount = async (id: string, values: AccountFormSchema) => {
    try {
      await accountUpdate(id, values);
      showSuccess('Account data Updated Success!');
      refetch();
    } catch (e: any) {
      showError(e.message);
    } finally {
      setOpenEdit(false);
    }
  };

  const handleChangeModal = (open: boolean, data?: Account) => {
    setSelectedItem(data);
    setOpenEdit(open);
  };

  const handleChangeDeleteModal = (open: boolean, data?: Account) => {
    setOpenDelete(open);
    setSelectedItem(data);
  };

  const handleDelete = async (id: string) => {
    try {
      await accountDelete(id);
      setOpenDelete(false);
      setSelectedItem(undefined);
      showSuccess('Account Successfully Removed!');
      refetch();
    } catch (e: any) {
      showError(e.message);
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
                        handleChangeModal(true, account);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      size='sm'
                      variant='destructive'
                      onClick={(e) => {
                        e.preventDefault();
                        handleChangeDeleteModal(true, account);
                      }}
                    >
                      Delete
                    </Button>
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

      {openDelete && selectedItem && (
        <DeleteConfirmationModal
          title='Delete Account'
          description={
            <>
              Are you sure you want to delete <b>{selectedItem?.name}</b> account?
            </>
          }
          onConfirm={() => handleDelete(selectedItem?.id)}
          open={openDelete}
          noTriggerButton
          onOpenChange={() => handleChangeDeleteModal(false, undefined)}
        />
      )}
      {selectedItem && (
        <UpdateModal
          title='Edit account info'
          formSchema={accountSchema}
          defaultValues={selectedItem}
          triggerButton={<></>}
          description='Update your account name, initial amount, and currency information'
          submit={async (values: AccountFormSchema) => {
            if (selectedItem) {
              await handleEditAccount(selectedItem.id, values);

              setOpenEdit(false);
            }
          }}
          onOpenChange={(open) => handleChangeModal(open, open ? selectedItem : undefined)}
          open={openEdit}
        >
          <Input type='text' name='name' placeholder='Account Name' className='my-2 w-full' />
          <Input
            type='number'
            name='balance'
            placeholder='Starting Balance'
            className='my-2 w-full'
          />
          <Input type='text' name='currency' placeholder='Currency' className='my-2 w-full' />
        </UpdateModal>
      )}
    </div>
  );
};

export default AccountList;
