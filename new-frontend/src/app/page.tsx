'use client';

import { Button } from '@/components/ui/button';
import { accountGetAll } from '@/lib/endpoints/accounts';
import { useQuery } from '@tanstack/react-query';
import Loader from '@/components/ui/loader';
import AddAccountModal from '@/components/modals/add-account-modal';
import { AccountCard, AccountCardContent } from '@/components/ui/account-card';
import DeleteConfirmationModal from '@/components/modals/delete-confirmation-modal';
import UpdateModal from '@/components/modals/update-modal';
import { useState } from 'react';
import { Account } from '@/lib/types';
import { accountUpdate, accountDelete } from '@/lib/endpoints/accounts';
import { useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { z } from 'zod';
import { useToast } from '@/lib/hooks/useToast';
import { Pencil, Trash2 } from 'lucide-react';

const accountSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters long').max(64),
  balance: z.string().refine((value) => !isNaN(Number(value)), 'Must be Valid Number'),
  currency: z
    .string()
    .min(3, 'Currency must have three characters')
    .max(3, 'Currency must have three characters')
    .transform((val) => val.toUpperCase())
});

type AccountFormSchema = z.infer<typeof accountSchema>;

const AccountList = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => accountGetAll({ sortBy: 'createdAt', sortOrder: 'asc', page: 1, limit: 10 })
  });
  const queryClient = useQueryClient();
  const [selectedItem, setSelectedItem] = useState<Account | undefined>();
  const [openEdit, setOpenEdit] = useState(false);
  const { showError, showSuccess } = useToast();

  const handleEditAccount = async (
    id: string,
    values: { name: string; balance: string; currency: string }
  ) => {
    await accountUpdate(id, values);
    queryClient.invalidateQueries({ queryKey: ['accounts'] });
    showSuccess('Account data Updated Success!');
  };

  const handleChangeModal = (open: boolean, data?: Account) => {
    setSelectedItem(data);
    setOpenEdit(open);
  };

  const handleDelete = async (id: string) => {
    try {
      await accountDelete(id);
      showSuccess('Account Successfully Removed!');
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    } catch (e: any) {
      showError(e.message);
    }
  };

  if (isLoading) {
    return <Loader />;
  }

  if (error) {
    return <div>Failed to get user's account</div>;
  }

  return (
    <div className='p-4'>
      <div className='flex items-center justify-between pb-4'>
        <h1 className='text-xl font-bold'>Accounts</h1>
        <div className='flex items-center gap-2'>
          <AddAccountModal />
        </div>
      </div>

      <div className='grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3'>
        {data?.accounts?.map((acc) => (
          <AccountCard href={`/transactions?accountId=${acc.id}`} key={acc.id}>
            <AccountCardContent>
              <div className='flex flex-col space-y-3'>
                <div className='flex flex-col'>
                  <span className='text-sm font-medium text-primary-foreground/60'>
                    Account Name
                  </span>
                  <h2 className='text-xl font-bold'>{acc.name}</h2>
                </div>

                <div className='flex flex-col'>
                  <span className='text-sm font-medium text-primary-foreground/60'>Balance</span>
                  <div className='flex items-baseline space-x-1'>
                    <span className='text-2xl font-bold'>{acc.balance}</span>
                    <span className='text-lg font-medium text-primary-foreground/80'>
                      {acc.currency}
                    </span>
                  </div>
                </div>

                <div className='flex items-center space-x-2'>
                  <Button
                    size='sm'
                    variant='secondary'
                    onClick={(e) => {
                      e.preventDefault();
                      handleChangeModal(true, acc);
                    }}
                  >
                    <Pencil className='mr-1 size-4' />
                    Edit
                  </Button>
                  <DeleteConfirmationModal
                    onOpenChange={() => {}}
                    title='Delete account'
                    triggerButton={
                      <Button variant='secondary' size='sm'>
                        <Trash2 className='mr-1 size-4' />
                        Delete
                      </Button>
                    }
                    description='Are you sure you want to delete this account? This action cannot be undone.'
                    onConfirm={() => handleDelete(acc.id)}
                  />
                </div>
              </div>
            </AccountCardContent>
          </AccountCard>
        ))}
      </div>

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
