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
import { useToast } from '@/lib/hooks/useToast';
import { ArrowLeft, PlusCircle, BarChart3, Banknote } from 'lucide-react';
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
import { useUrlState } from '@/hooks/useUrlState';
import { SortingState } from '@tanstack/react-table';
import { DynamicEllipsis, SingleLineEllipsis } from '@/components/ui/ellipsis-components';

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

  const { state, setState, handlePageChange } = useUrlState({
    page: 1,
    sortBy: 'purchaseDate',
    sortOrder: 'desc' as 'asc' | 'desc'
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
    queryKey: ['investments', accountId, state.page, state.sortBy, state.sortOrder],
    queryFn: () =>
      investmentGetAll(accountId, {
        page: state.page,
        limit: 10,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder // Pass typed sortOrder
      }),
    enabled: !!accountId,
    retry: false
  });

  const deleteInvestmentMutation = useMutation({
    mutationFn: (id: string) => investmentDelete(id),
    onSuccess: async () => {
      await invalidate(['investments', accountId, state.page, state.sortBy, state.sortOrder]);
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

  // Updated handleSort to match CommonTable's expected signature
  const handleSort = (newSortingState: SortingState) => {
    if (newSortingState.length > 0) {
      const { id, desc } = newSortingState[0];
      setState({ sortBy: id, sortOrder: desc ? 'desc' : 'asc', page: 1 });
    } else {
      setState({ sortBy: 'purchaseDate', sortOrder: 'desc', page: 1 }); // Revert to default or clear
    }
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
    <div className='mx-auto w-full max-w-7xl space-y-4 p-3 pt-4 max-sm:px-0 md:space-y-6'>
      <div className='flex w-full min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex min-w-0 flex-1 items-center gap-4'>
          <Button variant='ghost' onClick={() => router.back()} className='shrink-0'>
            <ArrowLeft size={16} className='mr-2' /> Back
          </Button>
          <SingleLineEllipsis className='min-w-0 text-xl font-semibold md:text-2xl'>
            {account.name} ({account.platform || 'N/A'})
          </SingleLineEllipsis>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className='shrink-0'>
          <PlusCircle className='mr-2 h-4 w-4' /> Add Investment
        </Button>
      </div>

      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='flex items-center gap-2 text-sm font-medium'>
              Total Invested
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
          <CommonTable<Investment>
            data={investments?.data || []}
            columns={investmentHoldingsColumns({ handleEdit, handleDeleteClick })}
            loading={isLoadingInvestments}
            totalRecords={investments?.pagination?.total || 0}
            pageSize={10}
            currentPage={state.page}
            onPageChange={handlePageChange}
            onSortChange={handleSort} // Pass the correctly typed handler
            enablePagination
            sortBy={state.sortBy}
            sortOrder={state.sortOrder} // Pass typed sortOrder
            mobileTriggerColumns={['symbol', 'shares']}
          />
        </CardContent>
      </Card>

      <AddInvestmentHoldingModal
        isOpen={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        accountId={accountId}
        accountCurrency={account.currency}
        onInvestmentAdded={() => {
          invalidate(['investments', accountId, state.page, state.sortBy, state.sortOrder]);
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
            invalidate(['investments', accountId, state.page, state.sortBy, state.sortOrder]);
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
