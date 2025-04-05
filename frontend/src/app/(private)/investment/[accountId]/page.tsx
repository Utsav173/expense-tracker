'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import {
  investmentGetAll,
  investmentDelete,
  investmentStockSearch,
  investmentStockPrice
} from '@/lib/endpoints/investment';
import {
  investmentAccountGetById,
  investmentAccountGetSummary
} from '@/lib/endpoints/investmentAccount';
import { useState } from 'react';
import Loader from '@/components/ui/loader';
import { Button } from '@/components/ui/button';
import { usePagination } from '@/hooks/usePagination';
import { useToast } from '@/lib/hooks/useToast';
import { ArrowLeft, PlusCircle, Edit, Trash, BarChart3, Banknote, DollarSign } from 'lucide-react';
import {
  Investment,
  StockSearchResult,
  StockPriceResult,
  ApiResponse,
  InvestmentAccountSummary
} from '@/lib/types';
import AddInvestmentHoldingModal from '@/components/modals/add-investment-holding-modal';
import EditInvestmentHoldingModal from '@/components/modals/edit-investment-holding-modal';
import DeleteConfirmationModal from '@/components/modals/delete-confirmation-modal';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import CommonTable from '@/components/ui/CommonTable';
import { investmentHoldingsColumns } from '@/components/investment/investment-holdings-columns';
import { useInvalidateQueries } from '@/hooks/useInvalidateQueries';

const InvestmentAccountDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const accountId = params.accountId as string;
  const { showError, showSuccess } = useToast();
  const invalidate = useInvalidateQueries();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deleteInvestmentId, setDeleteInvestmentId] = useState<string | null>(null);
  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);

  const { page, handlePageChange } = usePagination(1, (params) => {
    const currentParams = new URLSearchParams(window.location.search);
    if (params.page && params.page > 1) {
      currentParams.set('page', String(params.page));
    } else {
      currentParams.delete('page');
    }
    router.push(`${window.location.pathname}?${currentParams.toString()}`, { scroll: false });
  });

  const {
    data: account,
    isLoading: isLoadingAccount,
    error: accountError
  } = useQuery({
    queryKey: ['investmentAccount', accountId],
    queryFn: () => investmentAccountGetById(accountId),
    enabled: !!accountId,
    retry: false
  });

  const {
    data: summary,
    isLoading: isLoadingSummary,
    error: summaryError
  } = useQuery<ApiResponse<InvestmentAccountSummary>>({
    queryKey: ['investmentAccountSummary', accountId],
    queryFn: () => investmentAccountGetSummary(accountId),
    enabled: !!accountId,
    retry: false
  });

  const {
    data: investments,
    isLoading: isLoadingInvestments,
    error: investmentsError,
    refetch: refetchInvestments
  } = useQuery({
    queryKey: ['investments', accountId, page],
    queryFn: () => investmentGetAll(accountId, { page, limit: 10 }),
    enabled: !!accountId,
    retry: false
  });

  const deleteInvestmentMutation = useMutation({
    mutationFn: (id: string) => investmentDelete(id),
    onSuccess: async () => {
      await invalidate(['investments', accountId, page]);
      await invalidate(['investmentAccountSummary', accountId]);
      await invalidate(['investmentPortfolioSummaryDashboard']);
      showSuccess('Investment deleted successfully!');
      setDeleteInvestmentId(null);
      refetchInvestments();
    },
    onError: (error: any) => {
      showError(error.message);
    }
  });

  const handleEdit = (investment: Investment) => {
    setSelectedInvestment(investment);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteInvestmentId(id);
  };

  const handleDeleteConfirm = () => {
    if (deleteInvestmentId) {
      deleteInvestmentMutation.mutate(deleteInvestmentId);
    }
  };

  const handleStockSearch = async (query: string): Promise<ApiResponse<StockSearchResult[]>> => {
    return investmentStockSearch({ q: query });
  };

  const handleStockPrice = async (symbol: string): Promise<ApiResponse<StockPriceResult>> => {
    return investmentStockPrice(symbol);
  };

  if (isLoadingAccount) {
    return <Loader />;
  }

  if (accountError) {
    showError(`Failed to load account details: ${(accountError as Error).message}`);
    return <p>Error loading account details.</p>;
  }

  if (!account) {
    return <p>Account not found.</p>;
  }

  return (
    <div className='container space-y-6 p-4 md:p-6 lg:p-8'>
      <div className='flex items-center justify-between'>
        <Button variant='ghost' onClick={() => router.back()} className='flex items-center gap-2'>
          <ArrowLeft size={16} /> Back to Accounts
        </Button>
        <h1 className='text-xl font-semibold md:text-2xl'>
          {account.name} ({account.platform || 'N/A'})
        </h1>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <PlusCircle className='mr-2 h-4 w-4' /> Add Investment
        </Button>
      </div>

      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='flex items-center gap-2 text-sm font-medium'>
              <DollarSign size={16} /> Total Invested
            </CardTitle>
            <CardDescription>Initial investment amount</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? (
              <Loader />
            ) : (
              <p className='text-2xl font-bold'>
                {formatCurrency(summary?.totalinvestment || 0, account.currency)}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='flex items-center gap-2 text-sm font-medium'>
              <Banknote size={16} /> Total Dividends
            </CardTitle>
            <CardDescription>Dividends received</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? (
              <Loader />
            ) : (
              <p className='text-2xl font-bold text-green-600'>
                +{formatCurrency(summary?.totaldividend || 0, account.currency)}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='flex items-center gap-2 text-sm font-medium'>
              <BarChart3 size={16} /> Total Value
            </CardTitle>
            <CardDescription>Invested + Dividends</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? (
              <Loader />
            ) : (
              <p className='text-2xl font-bold'>
                {formatCurrency(summary?.totalvalue || 0, account.currency)}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Holdings</CardTitle>
          <CardDescription>Investments within this account.</CardDescription>
        </CardHeader>
        <CardContent>
          <CommonTable
            data={investments?.data || []}
            columns={investmentHoldingsColumns({ handleEdit, handleDeleteClick })}
            loading={isLoadingInvestments}
            totalRecords={investments?.pagination?.total || 0}
            pageSize={10}
            currentPage={page}
            onPageChange={handlePageChange}
            enablePagination
          />
        </CardContent>
      </Card>

      <AddInvestmentHoldingModal
        isOpen={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        accountId={accountId}
        accountCurrency={account.currency}
        onInvestmentAdded={() => {
          invalidate(['investments', accountId]);
          invalidate(['investmentAccountSummary', accountId]);
          invalidate(['investmentPortfolioSummaryDashboard']);
          refetchInvestments();
        }}
        searchStocksFn={handleStockSearch}
        getStockPriceFn={handleStockPrice}
        hideTriggerButton
      />

      {selectedInvestment && (
        <EditInvestmentHoldingModal
          isOpen={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          investment={selectedInvestment}
          accountCurrency={account.currency}
          onInvestmentUpdated={() => {
            invalidate(['investments', accountId]);
            invalidate(['investmentAccountSummary', accountId]);
            invalidate(['investmentPortfolioSummaryDashboard']);
            refetchInvestments();
          }}
        />
      )}

      <DeleteConfirmationModal
        title='Delete Investment'
        description='Are you sure you want to delete this investment holding?'
        onConfirm={handleDeleteConfirm}
        open={!!deleteInvestmentId}
        onOpenChange={(open) => !open && setDeleteInvestmentId(null)}
      />
    </div>
  );
};

export default InvestmentAccountDetailPage;
