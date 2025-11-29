'use client';

import { accountGetAll, accountDelete } from '@/lib/endpoints/accounts';
import AddAccountModal from '@/components/modals/add-account-modal';
import { AccountCard } from '@/components/ui/account-card';
import { useState } from 'react';
import type { AccountAPI } from '@/lib/api/api-types';
import { Input } from '@/components/ui/input';
import { useToast } from '@/lib/hooks/useToast';
import { Button } from '@/components/ui/button';
import DeleteConfirmationModal from '@/components/modals/delete-confirmation-modal';
import AddTransactionModal from '@/components/modals/add-transaction-modal';
import { UpdateAccountModal } from '@/components/modals/update-account-modal';
import NoData from '@/components/ui/no-data';
import { motion, Variants } from 'framer-motion';
import { useUrlState } from '@/hooks/useUrlState';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination';
import QueryErrorDisplay from '@/components/ui/query-error-display';
import { Icon } from '@/components/ui/icon';
import { useQuery, useMutation } from '@tanstack/react-query';
import Loader from '@/components/ui/loader';

const AccountListPage = () => {
  const { showError } = useToast();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deleteAccountId, setDeleteAccountId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<AccountAPI.Account | undefined>();

  const { state, setState, handlePageChange, searchQuery, setSearchQuery } = useUrlState({
    page: 1,
    sortBy: 'createdAt',
    sortOrder: 'desc' as 'asc' | 'desc',
    q: ''
  });

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['accounts', state.page, state.q, state.sortBy, state.sortOrder],
    queryFn: () =>
      accountGetAll({
        page: state.page,
        limit: 10,
        search: state.q,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder
      }),
    retry: false
  });

  const deleteAccountMutation = useMutation({
    mutationFn: (id: string) => accountDelete(id),
    onSuccess: () => {
      refetch();
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

  const handleEdit = (account: AccountAPI.Account) => {
    setSelectedItem(account);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteAccountId(id);
  };

  if (isError) {
    return <QueryErrorDisplay error={error} message="We couldn't load your accounts." />;
  }

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: 'easeOut' } }
  };

  return (
    <div className='mx-auto w-full max-w-7xl space-y-4 p-3 pt-4 md:space-y-6'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <h1 className='text-2xl font-bold'>Accounts</h1>
        <div className='flex items-center gap-2 max-sm:w-full max-sm:flex-col max-sm:gap-2'>
          <AddAccountModal />
          <AddTransactionModal
            onTransactionAdded={refetch}
            triggerButton={
              <Button variant='transaction' className='h-10 w-full px-4 py-2 font-semibold'>
                <Icon name='plusCircle' className='mr-2 h-4 w-4' />
                Add Transaction
              </Button>
            }
          />
        </div>
      </div>
      <div className='relative mb-6 flex-1'>
        <Icon
          name='search'
          className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2'
        />
        <Input
          type='text'
          placeholder='Search accounts...'
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className='pl-9'
        />
      </div>
      {isLoading ? (
        <Loader />
      ) : (
        <motion.div
          className='grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3'
          variants={containerVariants}
          initial='hidden'
          animate='visible'
        >
          {!data || !data.accounts || data.accounts.length === 0 ? (
            <div className='col-span-full'>
              <NoData
                icon={'wallet'}
                message='No Accounts Yet'
                description='Get started by creating your first financial account to track your income and expenses.'
                action={<AddAccountModal />}
              />
            </div>
          ) : (
            data.accounts.map((account) => (
              <motion.div key={account.id} variants={itemVariants}>
                <AccountCard
                  href={`/accounts/${account.id}`}
                  account={account}
                  onEdit={handleEdit}
                  onDelete={handleDeleteClick}
                />
              </motion.div>
            ))
          )}
        </motion.div>
      )}

      <div className='mt-6 flex justify-center'>
        {data && data.pagination.totalPages > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => handlePageChange(state.page - 1)}
                  disabled={state.page === 1}
                />
              </PaginationItem>
              {Array.from({ length: data.pagination.totalPages }, (_, i) => i + 1).map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    isActive={state.page === page}
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  onClick={() => handlePageChange(state.page + 1)}
                  disabled={state.page >= data.pagination.totalPages}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>

      <DeleteConfirmationModal
        title='Delete Account'
        description={
          selectedItem ? `Are you sure you want to delete ${selectedItem.name} account?` : ''
        }
        onConfirm={handleDelete}
        open={!!deleteAccountId}
        onOpenChange={() => setDeleteAccountId(null)}
      />

      {selectedItem && (
        <UpdateAccountModal
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          accountId={selectedItem.id}
          initialValues={{
            name: selectedItem.name,
            balance: selectedItem.balance,
            currency: selectedItem.currency,
            isDefault: selectedItem.isDefault
          }}
          onAccountUpdated={refetch}
        />
      )}
    </div>
  );
};

export default AccountListPage;
