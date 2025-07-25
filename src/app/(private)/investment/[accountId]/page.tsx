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
import { ArrowLeft, PlusCircle, Search } from 'lucide-react';
import {
  Investment,
  StockSearchResult,
  StockPriceResult,
  ApiResponse,
  InvestmentAccountSummary
} from '@/lib/types';
import AddInvestmentHoldingModal from '@/components/modals/add-investment-holding-modal';
import UpdateInvestmentHoldingModal from '@/components/modals/update-investment-holding-modal';
import DeleteConfirmationModal from '@/components/modals/delete-confirmation-modal';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import CommonTable from '@/components/ui/CommonTable';
import { investmentHoldingsColumns } from '@/components/investment/investment-holdings-columns';
import { useInvalidateQueries } from '@/hooks/useInvalidateQueries';
import { useUrlState } from '@/hooks/useUrlState';
import { SortingState } from '@tanstack/react-table';
import InvestmentAccountOverview from '@/components/investment/investment-account-overview';
import { SingleLineEllipsis } from '@/components/ui/ellipsis-components';
import { useDebounce } from 'use-debounce';
import { Input } from '@/components/ui/input';

const InvestmentAccountDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const accountId = params.accountId as string;
  const { showError } = useToast();
  const invalidate = useInvalidateQueries();

  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebounce(search, 600);
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

  const { data: summary, isLoading: isLoadingSummary } = useQuery<
    ApiResponse<InvestmentAccountSummary>
  >({
    queryKey: ['investmentAccountSummary', accountId],
    queryFn: () => investmentAccountGetSummary(accountId),
    enabled: !!accountId,
    retry: false
  });

  const {
    data: investments,
    isLoading: isLoadingInvestments,
    refetch: refetchInvestments
  } = useQuery({
    queryKey: [
      'investments',
      debouncedSearch,
      accountId,
      state.page,
      state.sortBy,
      state.sortOrder
    ],
    queryFn: () =>
      investmentGetAll(accountId, {
        page: state.page,
        limit: 10,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder,
        q: debouncedSearch
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

  const handleSort = (newSortingState: SortingState) => {
    if (newSortingState.length > 0) {
      const { id, desc } = newSortingState[0];
      setState({ sortBy: id, sortOrder: desc ? 'desc' : 'asc', page: 1 });
    } else {
      setState({ sortBy: 'purchaseDate', sortOrder: 'desc', page: 1 });
    }
  };

  const columns = investmentHoldingsColumns({
    handleEdit,
    handleDeleteClick,
    accountCurrency: account?.currency || 'INR'
  });

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
    <div className='mx-auto w-full max-w-7xl space-y-4 p-3 pt-4 max-sm:px-3 md:space-y-6'>
      <div className='flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex min-w-0 flex-1 items-center gap-4'>
          <Button
            variant='ghost'
            onClick={() => router.replace('/investment')}
            className='shrink-0'
          >
            <ArrowLeft size={16} className='mr-2' />
          </Button>
          <SingleLineEllipsis className='min-w-0 text-xl font-semibold md:text-2xl'>
            {account.name} ({account.platform || 'N/A'})
          </SingleLineEllipsis>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className='shrink-0'>
          <PlusCircle className='mr-2 h-4 w-4' /> Add Investment
        </Button>
      </div>

      <InvestmentAccountOverview
        accountId={accountId}
        accountCurrency={account.currency}
        summary={summary}
        isLoadingSummary={isLoadingSummary}
        oldestInvestmentDate={account?.oldestInvestmentDate}
      />

      <Card>
        <CardHeader>
          <CardTitle>Holdings</CardTitle>
          <CardDescription>Investments within this account.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='relative mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4'>
            <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
            <Input
              type='text'
              placeholder='Search investments...'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className='max-w-full grow pl-9'
            />
          </div>
          <CommonTable<Investment>
            tableId={`investment-holdings-${accountId}`}
            data={investments?.data || []}
            columns={columns}
            loading={isLoadingInvestments}
            totalRecords={investments?.pagination?.total || 0}
            pageSize={10}
            currentPage={state.page}
            onPageChange={handlePageChange}
            onSortChange={handleSort}
            enablePagination
            sortBy={state.sortBy}
            sortOrder={state.sortOrder}
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
        <UpdateInvestmentHoldingModal
          isOpen={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          investment={selectedInvestment}
          accountCurrency={account.currency}
          onInvestmentUpdated={refetchInvestments}
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
