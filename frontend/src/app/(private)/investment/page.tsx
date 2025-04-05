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
import { PlusCircle, Edit, Trash } from 'lucide-react';
import { InvestmentAccount } from '@/lib/types';
import AddInvestmentAccountModal from '@/components/modals/add-investment-account-modal';
import EditInvestmentAccountModal from '@/components/modals/edit-investment-account-modal';
import DeleteConfirmationModal from '@/components/modals/delete-confirmation-modal';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import { useInvalidateQueries } from '@/hooks/useInvalidateQueries';

const InvestmentPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { showError, showSuccess } = useToast();
  const invalidate = useInvalidateQueries();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deleteAccountId, setDeleteAccountId] = useState<string | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<InvestmentAccount | null>(null);

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
    queryFn: () => investmentAccountGetAll({ page, limit: 10 }),
    retry: false
  });

  const deleteAccountMutation = useMutation({
    mutationFn: (id: string) => investmentAccountDelete(id),
    onSuccess: async () => {
      await invalidate(['investmentAccounts', page]);
      await invalidate(['investmentPortfolioSummaryDashboard']);
      showSuccess('Investment account deleted successfully!');
      setDeleteAccountId(null);
      refetch();
    },
    onError: (error: any) => {
      showError(error.message);
    }
  });

  const handleEdit = (account: InvestmentAccount) => {
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
    showError(`Failed to get Investment Accounts: ${(error as Error).message}`);
    return null;
  }

  return (
    <div className='mx-auto w-full max-w-7xl space-y-4 p-3 pt-4 md:space-y-6'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <h1 className='text-3xl font-semibold'>Investment Accounts</h1>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <PlusCircle className='mr-2 h-4 w-4' /> Add Account
        </Button>
      </div>

      <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
        {accounts?.data && accounts.data.length > 0 ? (
          accounts.data.map((account) => (
            <Card key={account.id} className='relative flex flex-col'>
              <CardHeader>
                <CardTitle className='truncate'>{account.name}</CardTitle>
                <CardDescription>
                  {account.platform} - {account.currency}
                </CardDescription>
              </CardHeader>
              <CardContent className='flex-grow'>
                <p className='text-2xl font-bold'>
                  {formatCurrency(account.balance || 0, account.currency)}
                </p>
                <p className='text-xs text-muted-foreground'>Current Balance</p>
              </CardContent>
              <div className='absolute right-2 top-2 flex gap-1'>
                <Button
                  size='icon'
                  variant='ghost'
                  className='h-7 w-7'
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(account);
                  }}
                >
                  <Edit size={16} />
                </Button>
                <Button
                  size='icon'
                  variant='ghost'
                  className='h-7 w-7 text-destructive hover:text-destructive'
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteClick(account.id);
                  }}
                >
                  <Trash size={16} />
                </Button>
              </div>
              <Link
                href={`/investment/${account.id}`}
                className='mt-auto block border-t bg-muted/50 px-6 py-3 text-center text-sm font-medium text-primary transition-colors hover:bg-muted'
              >
                View Details & Holdings
              </Link>
            </Card>
          ))
        ) : (
          <p className='col-span-full text-center text-muted-foreground'>
            No investment accounts found.
          </p>
        )}
      </div>

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
        <EditInvestmentAccountModal
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
