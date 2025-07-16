'use client';

import { useState, useEffect, useCallback } from 'react';
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
import AddTransactionModal from '@/components/modals/add-transaction-modal';
import { Filter, Import, X, Download } from 'lucide-react';
import { accountGetDropdown } from '@/lib/endpoints/accounts';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/lib/hooks/useToast';
import { AccountDropdown } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useTransactions } from '@/components/transactions/hooks/useTransactions';
import DateRangePickerV2 from '@/components/date/date-range-picker-v2';
import { API_BASE_URL } from '@/lib/api-client';
import { getAuthTokenClient } from '@/lib/auth';
import { format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from '@/components/ui/dropdown-menu';
import CategoryCombobox from '@/components/ui/category-combobox';

const TransactionsPage = () => {
  const { showError, showInfo } = useToast();
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const {
    transactionsData,
    isLoading,
    isError,
    error,
    refetch,
    page,
    handlePageChange,
    filters,
    debouncedSearchQuery,
    setSearchQuery,
    handleAccountChange,
    handleCategoryChange,
    handleIncomeTypeChange,
    handleDateRangeSelect,
    handleClearDateRange,
    handleSort,
    resetFilters,
    handleAmountChange,
    handleTypeChange
  } = useTransactions();

  const { data: accountsData, isLoading: isLoadingAccounts } = useQuery({
    queryKey: ['accountsDropdown'],
    queryFn: accountGetDropdown
  });

  const [accounts, setAccounts] = useState<AccountDropdown[]>([]);

  const activeFiltersCount = [
    filters.accountId !== undefined && filters.accountId !== 'all',
    filters.categoryId !== undefined && filters.categoryId !== 'all',
    filters.isIncome !== undefined,
    filters.dateRange?.from && filters.dateRange.to,
    debouncedSearchQuery !== '',
    filters.minAmount !== undefined,
    filters.maxAmount !== undefined,
    filters.type !== 'all'
  ].filter(Boolean).length;

  useEffect(() => {
    if (accountsData) {
      setAccounts(accountsData);
    }
  }, [accountsData]);

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
        if (filters.accountId && filters.accountId !== 'all')
          params.set('accountId', filters.accountId);
        if (debouncedSearchQuery) params.set('q', debouncedSearchQuery);
        if (filters.categoryId && filters.categoryId !== 'all')
          params.set('categoryId', filters.categoryId);
        if (filters.isIncome !== undefined) params.set('isIncome', String(filters.isIncome));
        if (filters.dateRange?.from)
          params.set(
            'duration',
            `${format(filters.dateRange.from, 'yyyy-MM-dd')},${format(
              filters.dateRange.to!,
              'yyyy-MM-dd'
            )}`
          );
        if (filters.minAmount) params.set('minAmount', String(filters.minAmount));
        if (filters.maxAmount) params.set('maxAmount', String(filters.maxAmount));
        if (filters.type && filters.type !== 'all') params.set('type', filters.type);

        params.set('format', exportFormat);

        const exportUrl = `${API_BASE_URL}/transactions/export?${params.toString()}`;
        const token = getAuthTokenClient();

        const response = await fetch(exportUrl, {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` }
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
        console.error('Export error:', error);
        showError(error.message || 'Failed to export transactions.');
      } finally {
        setIsExporting(false);
      }
    },
    [filters, showError, showInfo, transactionsData?.transactions, debouncedSearchQuery]
  );

  if (isError) {
    showError(`Failed to get Transaction Details: ${(error as Error).message}`);
    return null;
  }

  return (
    <div className='mx-auto w-full max-w-7xl space-y-4 p-3 pt-4 md:space-y-6'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 className='text-xl font-bold sm:text-2xl'>Transactions</h1>
          <p className='text-muted-foreground mt-1 text-sm sm:text-base'>
            {transactionsData?.pagination.total
              ? `${transactionsData.pagination.total} transactions found`
              : 'Manage your financial transactions'}
          </p>
        </div>
        <div className='mt-4 flex gap-2 max-sm:flex-col sm:mt-0'>
          <AddTransactionModal onTransactionAdded={refetch} />
          <Link href='/transactions/import'>
            <Button variant='outline' className='flex w-full items-center gap-2'>
              <Import />
              <span>Import</span>
            </Button>
          </Link>
        </div>
      </div>

      <div className='flex w-full flex-col'>
        <div
          className={cn(`flex flex-col gap-3 sm:flex-row sm:items-center`, {
            'mb-3 sm:mb-4': filtersExpanded
          })}
        >
          <div className='relative flex-1'>
            <Input
              type='text'
              placeholder='Search transactions...'
              value={filters.searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='w-full pl-9'
            />
          </div>

          <div className='flex gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setFiltersExpanded(!filtersExpanded)}
              className='flex flex-1 items-center justify-center gap-1 sm:flex-auto'
            >
              <Filter size={16} />
              <span className='py-2'>Filters</span>
              {activeFiltersCount > 0 && (
                <span className='bg-primary text-primary-foreground ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-medium'>
                  {activeFiltersCount}
                </span>
              )}
            </Button>

            {activeFiltersCount > 0 && (
              <Button
                variant='ghost'
                size='sm'
                onClick={resetFilters}
                className='flex flex-1 items-center justify-center gap-1 sm:flex-auto'
              >
                <X size={16} />
                <span>Clear</span>
              </Button>
            )}
          </div>
        </div>
        {filtersExpanded && (
          <div className='mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5'>
            <div className='space-y-1'>
              <label className='mb-1 block text-xs font-medium sm:text-sm'>Account</label>
              <Select onValueChange={handleAccountChange} value={filters.accountId || 'all'}>
                <SelectTrigger className='h-9 w-full text-xs sm:h-10 sm:text-sm'>
                  <SelectValue placeholder='All Accounts' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Accounts</SelectItem>
                  {isLoadingAccounts ? (
                    <SelectItem value='loading-accounts' disabled>
                      Loading accounts...
                    </SelectItem>
                  ) : (
                    accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-1'>
              <label className='mb-1 block text-xs font-medium sm:text-sm'>Category</label>
              <CategoryCombobox
                value={filters.categoryId}
                onChange={handleCategoryChange}
                allowClear={true}
                placeholder='All Categories'
                className='h-9 text-xs sm:h-10 sm:text-sm'
              />
            </div>
            <div className='space-y-1'>
              <label className='mb-1 block text-xs font-medium sm:text-sm'>Type</label>
              <Select
                onValueChange={handleIncomeTypeChange}
                value={filters.isIncome === undefined ? 'all' : String(filters.isIncome)}
              >
                <SelectTrigger className='h-9 w-full text-xs sm:h-10 sm:text-sm'>
                  <SelectValue placeholder='All Types' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Types</SelectItem>
                  <SelectItem value='true'>Income</SelectItem>
                  <SelectItem value='false'>Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-1'>
              <label className='mb-1 block text-xs font-medium sm:text-sm'>Date Range</label>
              <DateRangePickerV2
                date={filters.dateRange}
                onDateChange={handleDateRangeSelect}
                onClear={handleClearDateRange}
                className='h-9 text-xs sm:h-10 sm:text-sm'
                closeOnComplete={true}
                buttonClassName='h-full'
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
            <div className='space-y-1'>
              <label className='mb-1 block text-xs font-medium sm:text-sm'>Min Amount</label>
              <Input
                type='number'
                placeholder='Min amount'
                value={filters.minAmount || ''}
                onChange={(e) =>
                  handleAmountChange(Number(e.target.value) || undefined, filters.maxAmount)
                }
                className='h-9 text-xs sm:h-10 sm:text-sm'
              />
            </div>
            <div className='space-y-1'>
              <label className='mb-1 block text-xs font-medium sm:text-sm'>Max Amount</label>
              <Input
                type='number'
                placeholder='Max amount'
                value={filters.maxAmount || ''}
                onChange={(e) =>
                  handleAmountChange(filters.minAmount, Number(e.target.value) || undefined)
                }
                className='h-9 text-xs sm:h-10 sm:text-sm'
              />
            </div>
            <div className='space-y-1'>
              <label className='mb-1 block text-xs font-medium sm:text-sm'>Transaction Type</label>
              <Select onValueChange={handleTypeChange} value={filters.type || 'all'}>
                <SelectTrigger className='h-9 w-full text-xs sm:h-10 sm:text-sm'>
                  <SelectValue placeholder='All' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All</SelectItem>
                  <SelectItem value='normal'>Normal</SelectItem>
                  <SelectItem value='recurring'>Recurring</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-1 sm:ml-2'>
              <label className='mb-1 block text-xs font-medium sm:text-sm'>Export</label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant='outline'
                    className='flex h-9 w-full items-center gap-2 text-xs sm:h-10 sm:text-sm'
                    disabled={
                      isExporting ||
                      isLoading ||
                      !transactionsData?.transactions ||
                      transactionsData.transactions.length === 0
                    }
                  >
                    <Download className='h-4 w-4' />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='start' className='min-w-[180px]'>
                  <DropdownMenuItem onClick={() => handleExport('xlsx')} disabled={isExporting}>
                    <Download className='mr-2 h-4 w-4' />
                    Export as Excel (.xlsx)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('csv')} disabled={isExporting}>
                    <Download className='mr-2 h-4 w-4' />
                    Export as CSV (.csv)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )}
      </div>

      {isLoading && !transactionsData ? (
        <Loader />
      ) : transactionsData?.transactions && transactionsData.transactions.length > 0 ? (
        <TransactionTable
          tableId='global-transactions-table'
          transactions={transactionsData.transactions}
          onSort={handleSort}
          sortBy={filters.sortBy}
          sortOrder={filters.sortOrder}
          loading={isLoading}
          totalRecords={transactionsData.pagination.total}
          page={page}
          handlePageChange={handlePageChange}
          refetchData={async () => {
            await refetch();
          }}
          accountsData={accountsData!}
        />
      ) : (
        <div className='flex items-center justify-center py-12'>
          <p className='text-muted-foreground'>
            No transactions found. Try adjusting your filters.
          </p>
        </div>
      )}
    </div>
  );
};

export default TransactionsPage;
