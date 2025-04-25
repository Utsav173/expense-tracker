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
import { PlusCircle, Edit, Trash, TrendingUp, ArrowUpRight } from 'lucide-react';
import { InvestmentAccount } from '@/lib/types';
import AddInvestmentAccountModal from '@/components/modals/add-investment-account-modal';
import EditInvestmentAccountModal from '@/components/modals/edit-investment-account-modal';
import DeleteConfirmationModal from '@/components/modals/delete-confirmation-modal';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import { useInvalidateQueries } from '@/hooks/useInvalidateQueries';
import { Badge } from '@/components/ui/badge';

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
    <div className='mx-auto w-full min-w-0 max-w-7xl space-y-6 p-4 pt-6'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>Investment Accounts</h1>
          <p className='mt-1 text-muted-foreground'>Manage your investment portfolios</p>
        </div>
        <Button
          onClick={() => setIsAddModalOpen(true)}
          size='lg'
          className='shadow-xs hover:shadow-sm'
        >
          <PlusCircle className='mr-2 h-5 w-5' /> Add New Account
        </Button>
      </div>

      {accounts?.data && accounts.data.length > 0 ? (
        <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
          {accounts.data.map((account) => (
            <Card
              key={account.id}
              className='group relative flex h-full flex-col overflow-hidden transition-all duration-300 hover:shadow-md'
            >
              <CardHeader className='pb-2'>
                <div className='flex items-start justify-between'>
                  <div className='flex-1 pr-8'>
                    <CardTitle className='line-clamp-1 text-xl font-bold'>{account.name}</CardTitle>
                    <div className='mt-1.5 flex items-center gap-2'>
                      <Badge
                        variant='outline'
                        className='bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary'
                      >
                        {account.platform}
                      </Badge>
                      <span className='text-xs font-medium text-muted-foreground'>
                        {account.currency}
                      </span>
                    </div>
                  </div>
                  <div className='absolute right-3 top-3 flex gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100'>
                    <Button
                      size='icon'
                      variant='ghost'
                      className='h-8 w-8 rounded-full bg-background/80 backdrop-blur-xs hover:bg-background'
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleEdit(account);
                      }}
                    >
                      <Edit size={15} />
                    </Button>
                    <Button
                      size='icon'
                      variant='ghost'
                      className='h-8 w-8 rounded-full bg-background/80 text-destructive backdrop-blur-xs hover:bg-destructive/10'
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleDeleteClick(account.id);
                      }}
                    >
                      <Trash size={15} />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className='grow pb-4 pt-2'>
                <div className='flex items-center gap-1.5'>
                  <TrendingUp className='h-5 w-5 text-primary' />
                  <p className='text-2xl font-bold tracking-tight text-foreground'>
                    {formatCurrency(account.balance || 0, account.currency)}
                  </p>
                </div>
                <p className='mt-0.5 text-xs text-muted-foreground'>Current Balance</p>
              </CardContent>

              <CardFooter className='mt-auto block p-0'>
                <Link
                  href={`/investment/${account.id}`}
                  className='flex w-full items-center justify-center gap-1.5 rounded-b-lg bg-primary/10 py-3 text-sm font-medium text-primary transition-colors hover:bg-primary/20'
                >
                  View Details & Holdings
                  <ArrowUpRight size={14} />
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card className='flex flex-col items-center justify-center p-10 text-center'>
          <div className='rounded-full bg-muted p-6'>
            <TrendingUp className='h-10 w-10 text-muted-foreground' />
          </div>
          <h3 className='mt-4 text-xl font-semibold'>No investment accounts yet</h3>
          <p className='mt-2 max-w-md text-muted-foreground'>
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
