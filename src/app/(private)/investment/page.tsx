'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import {
  investmentAccountGetAll,
  investmentAccountDelete
} from '@/lib/endpoints/investmentAccount';
import { useState } from 'react';
import Loader from '@/components/ui/loader';
import { Button } from '@/components/ui/button';
import { usePagination } from '@/hooks/usePagination';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useToast } from '@/lib/hooks/useToast';
import { Frown, PlusCircle, TrendingUp } from 'lucide-react';
import type { InvestmentAccountAPI } from '@/lib/api/api-types';
import AddInvestmentAccountModal from '@/components/modals/add-investment-account-modal';
import UpdateInvestmentAccountModal from '@/components/modals/update-investment-account-modal';
import DeleteConfirmationModal from '@/components/modals/delete-confirmation-modal';
import { Card } from '@/components/ui/card';
import { useInvalidateQueries } from '@/hooks/useInvalidateQueries';
import InvestmentAccountCard from '@/components/investment/investment-account-card';
import { motion } from 'framer-motion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { showError } = useToast();
  const invalidate = useInvalidateQueries();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deleteAccountId, setDeleteAccountId] = useState<string | null>(null);
  const [selectedAccount, setSelectedAccount] =
    useState<InvestmentAccountAPI.InvestmentAccount | null>(null);

  const { page, handlePageChange } = usePagination(
    Number(searchParams.get('page')) || 1,
    (params) => {
      const currentParams = new URLSearchParams(searchParams.toString());
      Object.keys(params).forEach((key) => {
        if (params[key] === undefined || params[key] === null || params[key] === '') {
          currentParams.delete(key);
        } else {
          currentParams.set(key.toString(), params[key]);
        }
      });
      const newUrl = `${pathname}?${currentParams.toString()}`;
      router.push(newUrl, { scroll: false });
    }
  );

  const {
    data: accounts,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['investmentAccounts', page],
    queryFn: () => investmentAccountGetAll({ page, limit: 10, sortBy: 'name', sortOrder: 'asc' }),
    retry: false
  });

  const deleteAccountMutation = useMutation({
    mutationFn: (id: string) => investmentAccountDelete(id),
    onSuccess: async () => {
      await invalidate(['investmentAccounts', page]);
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
    return (
      <div className='mx-auto w-full max-w-7xl space-y-4 p-3 pt-4 md:space-y-6'>
        <Alert variant='destructive' className='mx-auto mt-6'>
          <Frown className='h-4 w-4' />
          <AlertTitle>Oops! Something went wrong.</AlertTitle>
          <AlertDescription>
            We couldn&apos;t load your investment accounts. Please check your connection and try
            refreshing.
            {error && (
              <div className='text-muted-foreground mt-2 text-xs'>
                Error: {(error as Error).message}
              </div>
            )}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className='mx-auto w-full max-w-7xl min-w-0 space-y-6 p-4 pt-6'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>Investment Accounts</h1>
          <p className='text-muted-foreground mt-1'>Manage your investment portfolios</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <PlusCircle className='mr-2 h-5 w-5' /> Add New Account
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
            <TrendingUp className='text-muted-foreground h-10 w-10' />
          </div>
          <h3 className='mt-4 text-xl font-semibold'>No investment accounts yet</h3>
          <p className='text-muted-foreground mt-2 max-w-md'>
            Add your first investment account to start tracking your portfolio performance in one
            place.
          </p>
          <Button onClick={() => setIsAddModalOpen(true)} className='mt-6'>
            <PlusCircle className='mr-2 h-4 w-4' /> Add Your First Account
          </Button>
        </Card>
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
