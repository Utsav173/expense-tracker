'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import Link from 'next/link';
import TransactionTable from '@/components/transactions/transactions-table';
import Loader from '@/components/ui/loader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import AddTransactionModal from '@/components/modals/add-transaction-modal';
import { accountGetDropdown } from '@/lib/endpoints/accounts';
import { transactionGetAll } from '@/lib/endpoints/transactions';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/lib/hooks/useToast';
import { API_BASE_URL } from '@/lib/api-client';
import QueryErrorDisplay from '@/components/ui/query-error-display';
import { useUrlState } from '@/hooks/useUrlState';
import { useDebounce } from 'use-debounce';
import { SortingState } from '@tanstack/react-table';
import { Icon } from '@/components/ui/icon';
import {
  FilterState,
  TransactionFilterDialog
} from '@/components/transactions/transaction-filter-dialog';
import { categoryGetAll } from '@/lib/endpoints/category';
import { format } from 'date-fns';

const TransactionsPage = () => {
  const { showError, showInfo } = useToast();
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const { state, setState, handlePageChange } = useUrlState({
    page: 1,
    q: '',
    sortBy: 'createdAt',
    sortOrder: 'desc' as 'asc' | 'desc',
    accountId: undefined as string | undefined,
    categoryId: undefined as string | undefined,
    isIncome: undefined as boolean | undefined,
    dateFrom: undefined as string | undefined,
    dateTo: undefined as string | undefined,
    minAmount: undefined as number | undefined,
    maxAmount: undefined as number | undefined,
    type: 'all' as 'recurring' | 'normal' | 'all'
  });

  const [searchQuery, setSearchQuery] = useState(state.q);
  const [debouncedSearchQuery] = useDebounce(searchQuery, 600);

  const duration = useMemo(
    () =>
      state.dateFrom && state.dateTo
        ? `${format(new Date(state.dateFrom), 'yyyy-MM-dd')},${format(
            new Date(state.dateTo),
            'yyyy-MM-dd'
          )}`
        : undefined,
    [state.dateFrom, state.dateTo]
  );

  useEffect(() => {
    setState({ q: debouncedSearchQuery, page: 1 });
  }, [debouncedSearchQuery, setState]);

  const {
    data: transactionsData,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: [
      'transactions',
      state.page,
      state.accountId,
      debouncedSearchQuery,
      state.categoryId,
      state.isIncome,
      duration,
      state.sortBy,
      state.sortOrder,
      state.minAmount,
      state.maxAmount,
      state.type
    ],
    queryFn: ({ signal }) =>
      transactionGetAll({
        page: state.page,
        limit: 10,
        accountId: state.accountId,
        duration,
        q: debouncedSearchQuery,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder,
        categoryId: state.categoryId,
        isIncome: state.isIncome?.toString(),
        minAmount: state.minAmount,
        maxAmount: state.maxAmount,
        type: state.type === 'all' ? undefined : state.type
      }),
    staleTime: 5 * 60 * 1000,
    retry: false
  });

  const { data: accountsData, isLoading: isLoadingAccounts } = useQuery({
    queryKey: ['accountsDropdown'],
    queryFn: () => accountGetDropdown()
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['allCategoriesForCombobox'],
    queryFn: () => categoryGetAll({ limit: 200, sortBy: 'name', sortOrder: 'asc', page: 1 })
  });

  const handleSort = (newSortingState: SortingState) => {
    if (newSortingState.length > 0) {
      const { id, desc } = newSortingState[0];
      setState({ sortBy: id, sortOrder: desc ? 'desc' : 'asc' });
    } else {
      setState({ sortBy: 'createdAt', sortOrder: 'desc' });
    }
  };

  const activeFilters = useMemo(() => {
    const filters = [];
    if (state.accountId) filters.push('account');
    if (state.categoryId) filters.push('category');
    if (state.isIncome !== undefined) filters.push('type');
    if (state.dateFrom || state.dateTo) filters.push('dateRange');
    if (state.minAmount || state.maxAmount) filters.push('amount');
    if (state.type && state.type !== 'all') filters.push('transactionType');
    return filters;
  }, [state]);

  const activeFilterBadges = useMemo(() => {
    const badges = [];

    if (state.accountId) {
      const account = accountsData?.find((acc) => acc.id === state.accountId);
      badges.push({
        key: 'account',
        label: account?.name || 'Account',
        onRemove: () => setState({ accountId: undefined })
      });
    }
    if (state.categoryId) {
      const category = categoriesData?.categories.find((cat) => cat.id === state.categoryId);
      badges.push({
        key: 'category',
        label: category?.name || 'Category',
        onRemove: () => setState({ categoryId: undefined })
      });
    }
    if (state.isIncome !== undefined) {
      badges.push({
        key: 'isIncome',
        label: state.isIncome ? 'Income' : 'Expense',
        onRemove: () => setState({ isIncome: undefined })
      });
    }
    if (state.dateFrom && state.dateTo) {
      const from = format(new Date(state.dateFrom), 'MMM d');
      const to = format(new Date(state.dateTo), 'MMM d');
      badges.push({
        key: 'date',
        label: `${from} - ${to}`,
        onRemove: () => setState({ dateFrom: undefined, dateTo: undefined })
      });
    }
    if (state.minAmount || state.maxAmount) {
      badges.push({
        key: 'amount',
        label: 'Amount Range',
        onRemove: () => setState({ minAmount: undefined, maxAmount: undefined })
      });
    }
    if (state.type && state.type !== 'all') {
      badges.push({
        key: 'type',
        label: state.type === 'recurring' ? 'Recurring' : 'Normal',
        onRemove: () => setState({ type: 'all' })
      });
    }

    return badges;
  }, [state, accountsData, categoriesData, setState]);

  const handleApplyFilters = (newFilters: Partial<FilterState>) => {
    setState({ page: 1, ...newFilters });
  };

  const handleResetFilters = () => {
    setState({
      q: '',
      page: 1,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      accountId: undefined,
      categoryId: undefined,
      isIncome: undefined,
      dateFrom: undefined,
      dateTo: undefined,
      minAmount: undefined,
      maxAmount: undefined,
      type: 'all'
    });
    setSearchQuery('');
  };

  const handleExport = useCallback(
    async (exportFormat: 'xlsx' | 'csv') => {
      if (!transactionsData?.transactions || transactionsData.transactions.length === 0) {
        showError('No transactions available to export with the current filters.');
        return;
      }
      setIsExporting(true);
      showInfo('Preparing your export...');

      try {
        const params = new URLSearchParams();
        if (state.accountId) params.set('accountId', state.accountId);
        if (state.q) params.set('q', state.q);
        if (state.categoryId) params.set('categoryId', state.categoryId);
        if (state.isIncome !== undefined) params.set('isIncome', String(state.isIncome));
        if (state.dateFrom && state.dateTo)
          params.set('duration', `${state.dateFrom},${state.dateTo}`);
        if (state.minAmount) params.set('minAmount', String(state.minAmount));
        if (state.maxAmount) params.set('maxAmount', String(state.maxAmount));
        if (state.type && state.type !== 'all') params.set('type', state.type);
        params.set('format', exportFormat);

        const exportUrl = `${API_BASE_URL}/transactions/export?${params.toString()}`;

        const response = await fetch(exportUrl, {
          method: 'GET'
        });

        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({ message: `Export failed with status: ${response.status}` }));
          throw new Error(errorData.message);
        }

        const disposition = response.headers.get('content-disposition');
        let filename = `transactions.${exportFormat}`;
        if (disposition?.includes('attachment')) {
          const filenameMatch = /filename="?([^"]+)"?/.exec(disposition);
          if (filenameMatch?.[1]) filename = filenameMatch[1];
        }

        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(downloadUrl);
      } catch (error: any) {
        showError(error.message || 'Failed to export transactions.');
      } finally {
        setIsExporting(false);
      }
    },
    [state, showError, showInfo, transactionsData?.transactions]
  );

  if (isError) {
    return <QueryErrorDisplay error={error} message='Failed to load transactions.' />;
  }

  return (
    <div className='mx-auto w-full max-w-7xl space-y-6 p-3 pt-4'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 className='text-2xl font-bold'>Transactions</h1>
          <p className='text-muted-foreground mt-1'>
            {transactionsData?.pagination.total
              ? `${transactionsData.pagination.total} transactions found`
              : 'Manage your financial transactions'}
          </p>
        </div>
        <div className='flex gap-2'>
          <AddTransactionModal onTransactionAdded={refetch} />
          <Link href='/transactions/import'>
            <Button variant='outline' className='gap-2'>
              <Icon name='import' className='h-4 w-4' />
              Import
            </Button>
          </Link>
        </div>
      </div>

      <div className='space-y-4'>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
          <div className='relative flex-1'>
            <Icon
              name='search'
              className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2'
            />
            <Input
              type='text'
              placeholder='Search transactions...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='pl-9'
            />
          </div>

          <div className='flex gap-2'>
            <Button variant='outline' className='gap-2' onClick={() => setIsFilterDialogOpen(true)}>
              <Icon name='filter' className='h-4 w-4' />
              Filters
              {activeFilters.length > 0 && (
                <Badge
                  variant='secondary'
                  className='ml-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-medium'
                >
                  {activeFilters.length}
                </Badge>
              )}
            </Button>
            <TransactionFilterDialog
              isOpen={isFilterDialogOpen}
              onOpenChange={setIsFilterDialogOpen}
              activeFilters={state}
              onApplyFilters={handleApplyFilters}
              accounts={accountsData}
              isLoadingAccounts={isLoadingAccounts}
              transactionsData={transactionsData}
              showAccountFilter={true}
            />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='outline'
                  className='gap-2'
                  disabled={
                    isExporting ||
                    isLoading ||
                    !transactionsData?.transactions ||
                    transactionsData.transactions.length === 0
                  }
                >
                  <Icon name='download' className='h-4 w-4' />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                <DropdownMenuItem onClick={() => handleExport('xlsx')} disabled={isExporting}>
                  <Icon name='xlsx' className='mr-2 h-4 w-4' />
                  Export as Excel (.xlsx)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('csv')} disabled={isExporting}>
                  <Icon name='csv' className='mr-2 h-4 w-4' />
                  Export as CSV (.csv)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {activeFilterBadges.length > 0 && (
          <div className='flex flex-wrap items-center gap-2'>
            <span className='text-muted-foreground text-sm'>Active filters:</span>
            {activeFilterBadges.map((badge) => (
              <Badge key={badge.key} variant='secondary' className='gap-1 pr-1'>
                {badge.label}
                <Button
                  variant='ghost'
                  size='sm'
                  className='h-auto p-0.5 hover:bg-transparent'
                  onClick={badge.onRemove}
                >
                  <Icon name='x' className='h-3 w-3' />
                </Button>
              </Badge>
            ))}
            <Button
              variant='ghost'
              size='sm'
              onClick={handleResetFilters}
              className='text-muted-foreground hover:text-foreground h-6 text-xs'
            >
              Clear all
            </Button>
          </div>
        )}
      </div>

      {isLoading && !transactionsData ? (
        <Loader />
      ) : (
        <TransactionTable
          tableId='global-transactions-table'
          transactions={transactionsData?.transactions || []}
          onSort={(sortBy, sortOrder) => setState({ sortBy, sortOrder })}
          sortBy={state.sortBy}
          sortOrder={state.sortOrder}
          loading={isLoading}
          totalRecords={transactionsData?.pagination.total || 0}
          page={state.page}
          handlePageChange={handlePageChange}
          refetchData={async () => {
            await refetch();
          }}
          accountsData={accountsData}
        />
      )}
    </div>
  );
};

export default TransactionsPage;
