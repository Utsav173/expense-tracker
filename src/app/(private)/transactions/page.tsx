'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import TransactionTable from '@/components/transactions/transactions-table';
import Loader from '@/components/ui/loader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import AddTransactionModal from '@/components/modals/add-transaction-modal';
import { accountGetDropdown } from '@/lib/endpoints/accounts';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/lib/hooks/useToast';
import { useTransactions } from '@/components/transactions/hooks/useTransactions';
import DateRangePickerV2 from '@/components/date/date-range-picker-v2';
import { API_BASE_URL } from '@/lib/api-client';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from '@/components/ui/dropdown-menu';
import CategoryCombobox from '@/components/ui/category-combobox';
import { DateRange } from 'react-day-picker';
import QueryErrorDisplay from '@/components/ui/query-error-display';
import { useUrlState } from '@/hooks/useUrlState';
import { useDebounce } from 'use-debounce';
import { SortingState } from '@tanstack/react-table';
import { Icon } from '@/components/ui/icon';

const TransactionsPage = () => {
  const { showError, showInfo } = useToast();
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const { state, setState, handlePageChange } = useUrlState({
    page: 1,
    q: '',
    sortBy: 'createdAt',
    sortOrder: 'desc' as 'asc' | 'desc',
    accountId: 'all',
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
  const [tempFilters, setTempFilters] = useState<{
    accountId: string;
    categoryId: string | undefined;
    isIncome: boolean | undefined;
    dateRange: DateRange | undefined;
    minAmount: number | undefined;
    maxAmount: number | undefined;
    type: 'recurring' | 'normal' | 'all';
  }>({
    accountId: 'all',
    categoryId: undefined,
    isIncome: undefined,
    dateRange: undefined,
    minAmount: undefined,
    maxAmount: undefined,
    type: 'all'
  });

  useEffect(() => {
    setState({ q: debouncedSearchQuery, page: 1 });
  }, [debouncedSearchQuery, setState]);

  const {
    data: transactionsData,
    isLoading,
    isError,
    error,
    refetch
  } = useTransactions({
    page: state.page,
    accountId: state.accountId,
    debouncedSearchQuery: state.q,
    categoryId: state.categoryId,
    isIncome: state.isIncome,
    dateRange:
      state.dateFrom && state.dateTo
        ? { from: new Date(state.dateFrom), to: new Date(state.dateTo) }
        : undefined,
    sortBy: state.sortBy,
    sortOrder: state.sortOrder,
    minAmount: state.minAmount,
    maxAmount: state.maxAmount,
    type: state.type
  });

  const { data: accountsData, isLoading: isLoadingAccounts } = useQuery({
    queryKey: ['accountsDropdown'],
    queryFn: accountGetDropdown
  });

  const handleSort = (newSortingState: SortingState) => {
    if (newSortingState.length > 0) {
      const { id, desc } = newSortingState[0];
      setState({ sortBy: id, sortOrder: desc ? 'desc' : 'asc', page: 1 });
    } else {
      setState({ sortBy: 'createdAt', sortOrder: 'desc', page: 1 });
    }
  };

  const activeFilters = useMemo(() => {
    const filters = [];
    if (state.accountId && state.accountId !== 'all') filters.push('account');
    if (state.categoryId && state.categoryId !== 'all') filters.push('category');
    if (state.isIncome !== undefined) filters.push('type');
    if (state.dateFrom || state.dateTo) filters.push('dateRange');
    if (state.minAmount || state.maxAmount) filters.push('amount');
    if (state.type && state.type !== 'all') filters.push('transactionType');
    return filters;
  }, [state]);

  const hasSearchQuery = (state.q || '').length > 0;

  useEffect(() => {
    if (isFilterDialogOpen) {
      setTempFilters({
        accountId: state.accountId || 'all',
        categoryId: state.categoryId,
        isIncome: state.isIncome,
        dateRange:
          state.dateFrom && state.dateTo
            ? { from: new Date(state.dateFrom), to: new Date(state.dateTo) }
            : undefined,
        minAmount: state.minAmount,
        maxAmount: state.maxAmount,
        type: state.type || 'all'
      });
    }
  }, [isFilterDialogOpen, state]);

  const handleApplyFilters = () => {
    setState({
      page: 1,
      accountId: tempFilters.accountId,
      categoryId: tempFilters.categoryId,
      isIncome: tempFilters.isIncome,
      dateFrom: tempFilters.dateRange?.from?.toISOString(),
      dateTo: tempFilters.dateRange?.to?.toISOString(),
      minAmount: tempFilters.minAmount,
      maxAmount: tempFilters.maxAmount,
      type: tempFilters.type
    });
    setIsFilterDialogOpen(false);
  };

  const handleClearFilters = () => {
    setTempFilters({
      accountId: 'all',
      categoryId: undefined,
      isIncome: undefined,
      dateRange: undefined,
      minAmount: undefined,
      maxAmount: undefined,
      type: 'all'
    });
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
        if (state.accountId && state.accountId !== 'all') params.set('accountId', state.accountId);
        if (state.q) params.set('q', state.q);
        if (state.categoryId && state.categoryId !== 'all')
          params.set('categoryId', state.categoryId);
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
            <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
              <DialogTrigger asChild>
                <Button variant='outline' className='gap-2'>
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
              </DialogTrigger>
              <DialogContent className='sm:max-w-3xl'>
                <DialogHeader>
                  <DialogTitle className='flex items-center gap-2'>
                    <Icon name='filter' className='h-5 w-5' />
                    Filter Transactions
                  </DialogTitle>
                </DialogHeader>

                <div className='grid grid-cols-1 gap-6 py-4 md:grid-cols-2 lg:grid-cols-3'>
                  <div className='space-y-2'>
                    <label className='flex items-center gap-2 text-sm font-medium'>
                      <Icon name='building' className='h-4 w-4' />
                      Account
                    </label>
                    <Select
                      onValueChange={(value) =>
                        setTempFilters((prev) => ({ ...prev, accountId: value }))
                      }
                      value={tempFilters.accountId || 'all'}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='All Accounts' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='all'>All Accounts</SelectItem>
                        {isLoadingAccounts ? (
                          <SelectItem value='loading' disabled>
                            Loading...
                          </SelectItem>
                        ) : (
                          accountsData?.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className='space-y-2'>
                    <label className='flex items-center gap-2 text-sm font-medium'>
                      <Icon name='tag' className='h-4 w-4' />
                      Category
                    </label>
                    <CategoryCombobox
                      value={tempFilters.categoryId}
                      onChange={(value) =>
                        setTempFilters((prev) => ({ ...prev, categoryId: value }))
                      }
                      allowClear={true}
                      placeholder='All Categories'
                    />
                  </div>

                  <div className='space-y-2'>
                    <label className='flex items-center gap-2 text-sm font-medium'>
                      <Icon name='type' className='h-4 w-4' />
                      Type
                    </label>
                    <Select
                      onValueChange={(value) =>
                        setTempFilters((prev) => ({
                          ...prev,
                          isIncome: value === 'all' ? undefined : value === 'true'
                        }))
                      }
                      value={
                        tempFilters.isIncome === undefined ? 'all' : String(tempFilters.isIncome)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='All Types' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='all'>All Types</SelectItem>
                        <SelectItem value='true'>Income</SelectItem>
                        <SelectItem value='false'>Expense</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className='space-y-2'>
                    <label className='flex items-center gap-2 text-sm font-medium'>
                      <Icon name='calendar' className='h-4 w-4' />
                      Date Range
                    </label>
                    <DateRangePickerV2
                      date={tempFilters.dateRange}
                      onDateChange={(dateRange) =>
                        setTempFilters((prev) => ({ ...prev, dateRange }))
                      }
                      onClear={() => setTempFilters((prev) => ({ ...prev, dateRange: undefined }))}
                      closeOnComplete={true}
                      noLabel
                      minDate={
                        transactionsData?.dateRange?.minDate
                          ? new Date(transactionsData.dateRange.minDate)
                          : undefined
                      }
                      maxDate={
                        transactionsData?.dateRange?.maxDate
                          ? new Date(transactionsData.dateRange.maxDate)
                          : undefined
                      }
                    />
                  </div>

                  <div className='space-y-2'>
                    <label className='text-sm font-medium'>Min Amount</label>
                    <Input
                      type='number'
                      placeholder='Minimum amount'
                      value={tempFilters.minAmount || ''}
                      onChange={(e) =>
                        setTempFilters((prev) => ({
                          ...prev,
                          minAmount: Number(e.target.value) || undefined
                        }))
                      }
                    />
                  </div>

                  <div className='space-y-2'>
                    <label className='text-sm font-medium'>Max Amount</label>
                    <Input
                      type='number'
                      placeholder='Maximum amount'
                      value={tempFilters.maxAmount || ''}
                      onChange={(e) =>
                        setTempFilters((prev) => ({
                          ...prev,
                          maxAmount: Number(e.target.value) || undefined
                        }))
                      }
                    />
                  </div>

                  <div className='space-y-2'>
                    <label className='flex items-center gap-2 text-sm font-medium'>
                      <Icon name='settings2' className='h-4 w-4' />
                      Transaction Type
                    </label>
                    <Select
                      onValueChange={(value) =>
                        setTempFilters((prev) => ({ ...prev, type: value as any }))
                      }
                      value={tempFilters.type || 'all'}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='All' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='all'>All</SelectItem>
                        <SelectItem value='normal'>Normal</SelectItem>
                        <SelectItem value='recurring'>Recurring</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <DialogFooter className='flex gap-2'>
                  <Button variant='outline' onClick={handleClearFilters}>
                    Clear All
                  </Button>
                  <Button onClick={handleApplyFilters}>Apply Filters</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

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

        {(activeFilters.length > 0 || hasSearchQuery) && (
          <div>
            <span className='text-muted-foreground text-sm'>Active filters:</span>
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
