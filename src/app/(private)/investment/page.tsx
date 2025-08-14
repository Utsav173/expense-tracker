'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import {
  investmentAccountGetAll,
  investmentAccountDelete
} from '@/lib/endpoints/investmentAccount';
import { useState, useEffect } from 'react';
import Loader from '@/components/ui/loader';
import { Button } from '@/components/ui/button';
import { useToast } from '@/lib/hooks/useToast';
import type { InvestmentAccountAPI } from '@/lib/api/api-types';
import AddInvestmentAccountModal from '@/components/modals/add-investment-account-modal';
import UpdateInvestmentAccountModal from '@/components/modals/update-investment-account-modal';
import DeleteConfirmationModal from '@/components/modals/delete-confirmation-modal';
import { Card } from '@/components/ui/card';
import { useInvalidateQueries } from '@/hooks/useInvalidateQueries';
import InvestmentAccountCard from '@/components/investment/investment-account-card';
import { motion, Variants } from 'framer-motion';
import QueryErrorDisplay from '@/components/ui/query-error-display';
import { useUrlState } from '@/hooks/useUrlState';
import { useDebounce } from 'use-debounce';
import { Input } from '@/components/ui/input';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination';
import { Icon } from '@/components/ui/icon';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const InvestmentPage = () => {
  const { showError } = useToast();
  const invalidate = useInvalidateQueries();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deleteAccountId, setDeleteAccountId] = useState<string | null>(null);
  const [selectedAccount, setSelectedAccount] =
    useState<InvestmentAccountAPI.InvestmentAccount | null>(null);

  const { state, handlePageChange } = useUrlState({
    page: 1,
    sortBy: 'name',
    sortOrder: 'asc' as 'asc' | 'desc',
    q: ''
  });

  const {
    data: accounts,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['investmentAccounts', state.page, state.q, state.sortBy, state.sortOrder],
    queryFn: () =>
      investmentAccountGetAll({
        page: state.page,
        limit: 10,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder
      }),
    retry: false
  });

  const deleteAccountMutation = useMutation({
    mutationFn: (id: string) => investmentAccountDelete(id),
    onSuccess: async () => {
      await invalidate(['investmentAccounts', state.page]);
      await invalidate(['investmentPortfolioSummaryDashboard']);
      setDeleteAccountId(null);
      refetch();
    },
    onError: (error: any) => {
      showError(error.message);
    }
  });

  const handleEdit = (account: InvestmentAccountAPI.InvestmentAccount) => {
    setSelectedAccount(account);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteAccountId(id);
  };

  const handleDeleteConfirm = () => {
    if (deleteAccountId) {
      deleteAccountMutation.mutate(deleteAccountId);
    }
  };

  if (isLoading) {
    return <Loader />;
  }

  if (error) {
    return <QueryErrorDisplay error={error} message="We couldn't load your investment accounts." />;
  }

  return (
    <div className='mx-auto w-full max-w-7xl min-w-0 space-y-6 p-4 pt-6'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>Investment Accounts</h1>
          <p className='text-muted-foreground mt-1'>Manage your investment portfolios</p>
        </div>
        <Button
          variant='planning'
          className='h-10 px-4 py-2'
          onClick={() => setIsAddModalOpen(true)}
        >
          <Icon name='plusCircle' className='mr-2 h-5 w-5' /> Add New Account
        </Button>
      </div>

      {accounts?.data && accounts.data.length > 0 ? (
        <motion.div
          className='grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3'
          variants={containerVariants}
          initial='hidden'
          animate='visible'
        >
          {accounts.data.map((account) => (
            <InvestmentAccountCard
              key={account.id}
              account={account}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
            />
          ))}
        </motion.div>
      ) : (
        <Card className='flex flex-col items-center justify-center p-10 text-center'>
          <div className='bg-muted rounded-full p-6'>
            <Icon name='trendingUp' className='text-muted-foreground h-10 w-10' />
          </div>
          <h3 className='mt-4 text-xl font-semibold'>No investment accounts yet</h3>
          <p className='text-muted-foreground mt-2 max-w-md'>
            Add your first investment account to start tracking your portfolio performance in one
            place.
          </p>
          <Button
            variant='planning'
            className='mt-6 h-10 px-4 py-2'
            onClick={() => setIsAddModalOpen(true)}
          >
            <Icon name='plusCircle' className='mr-2 h-4 w-4' /> Add Your First Account
          </Button>
        </Card>
      )}

      {accounts?.pagination && accounts.pagination.totalPages > 1 && (
        <div className='mt-6 flex justify-center'>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => handlePageChange(state.page - 1)}
                  disabled={state.page === 1}
                />
              </PaginationItem>
              {Array.from({ length: accounts.pagination.totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      isActive={state.page === page}
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}
              <PaginationItem>
                <PaginationNext
                  onClick={() => handlePageChange(state.page + 1)}
                  disabled={state.page >= accounts.pagination.totalPages}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      <AddInvestmentAccountModal
        isOpen={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onAccountAdded={() => {
          invalidate(['investmentAccounts']);
          refetch();
        }}
        hideTriggerButton
      />

      {selectedAccount && (
        <UpdateInvestmentAccountModal
          isOpen={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          account={selectedAccount}
          onAccountUpdated={() => {
            invalidate(['investmentAccounts']);
            refetch();
          }}
        />
      )}

      <DeleteConfirmationModal
        title='Delete Investment Account'
        description='Are you sure? Deleting this account will also delete all associated investments.'
        onConfirm={handleDeleteConfirm}
        open={!!deleteAccountId}
        onOpenChange={(open) => !open && setDeleteAccountId(null)}
      />
    </div>
  );
};

export default InvestmentPage;
