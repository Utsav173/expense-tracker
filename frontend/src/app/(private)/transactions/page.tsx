'use client';

import React, { useState, useEffect, useCallback } from 'react'; // Added useCallback
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import TransactionTable from '@/components/transactions-table';
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
import { Filter, Import, X, Download, Loader2 } from 'lucide-react';
import { accountGetDropdown } from '@/lib/endpoints/accounts';
import { categoryGetAll } from '@/lib/endpoints/category';
import { useToast } from '@/lib/hooks/useToast';
import { AccountDropdown, Category } from '@/lib/types';
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

const TransactionsPage = () => {
  const { showError, showSuccess, showInfo } = useToast();
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [exportFormat, setExportFormat] = useState<'xlsx' | 'csv'>('xlsx');
  const [isExporting, setIsExporting] = useState(false);

  const {
    transactionsData,
    isLoading,
    isError,
    error,
    refetch,
    page,
    handlePageChange,
    filters, // Use filters from the hook
    debouncedSearchQuery,
    setSearchQuery,
    handleAccountChange,
    handleCategoryChange,
    handleIncomeTypeChange,
    handleDateRangeSelect,
    handleClearDateRange,
    handleSort,
    resetFilters
  } = useTransactions(); // Use the existing hook

  // Fetch accounts and categories for filters
  const { data: accountsData, isLoading: isLoadingAccounts } = useQuery({
    queryKey: ['accountsDropdown'],
    queryFn: accountGetDropdown
  });

  const { data: categoriesData, isLoading: isLoadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryGetAll({ limit: 500 }) // Fetch more categories for filtering
  });

  const [accounts, setAccounts] = useState<AccountDropdown[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Calculate active filters count based on the hook's state
  const activeFiltersCount = [
    filters.accountId !== undefined && filters.accountId !== 'all',
    filters.categoryId !== undefined && filters.categoryId !== 'all',
    filters.isIncome !== undefined,
    filters.dateRange?.from && filters.dateRange.to,
    debouncedSearchQuery !== ''
  ].filter(Boolean).length;

  useEffect(() => {
    if (accountsData) {
      setAccounts(accountsData);
    }
  }, [accountsData]);

  useEffect(() => {
    if (categoriesData?.categories) {
      setCategories(categoriesData.categories);
    }
  }, [categoriesData?.categories]);

  // Export Handler - adapted from AccountTransactionsSection
  const handleExport = useCallback(async () => {
    if (!transactionsData?.transactions || transactionsData.transactions.length === 0) {
      showError('No transactions available to export with the current filters.');
      return;
    }
    setIsExporting(true);
    showInfo('Preparing your export...');

    try {
      const params = new URLSearchParams();

      // Use filters from the useTransactions hook
      if (filters.accountId && filters.accountId !== 'all')
        params.set('accountId', filters.accountId);
      if (debouncedSearchQuery) params.set('q', debouncedSearchQuery);
      if (filters.categoryId && filters.categoryId !== 'all')
        params.set('categoryId', filters.categoryId);
      if (filters.isIncome !== undefined) params.set('isIncome', String(filters.isIncome));
      if (filters.dateRange?.from)
        params.set('dateFrom', format(filters.dateRange.from, 'yyyy-MM-dd'));
      if (filters.dateRange?.to) params.set('dateTo', format(filters.dateRange.to, 'yyyy-MM-dd'));
      // Add amount filters if implemented in useTransactions hook
      // if (filters.minAmount !== undefined) params.set('minAmount', String(filters.minAmount));
      // if (filters.maxAmount !== undefined) params.set('maxAmount', String(filters.maxAmount));
      params.set('format', exportFormat);

      const exportUrl = `${API_BASE_URL}/transactions/export?${params.toString()}`;
      const token = getAuthTokenClient();

      const response = await fetch(exportUrl, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        let errorMsg = `Export failed with status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMsg = errorData.message || errorMsg;
        } catch (_) {
          /* Ignore if response is not JSON */
        }
        throw new Error(errorMsg);
      }

      const disposition = response.headers.get('content-disposition');
      let filename = `transactions.${exportFormat}`;
      if (disposition && disposition.indexOf('attachment') !== -1) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(disposition);
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
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

      showSuccess('Export started successfully!');
    } catch (error: any) {
      console.error('Export error:', error);
      showError(error.message || 'Failed to export transactions.');
    } finally {
      setIsExporting(false);
    }
  }, [filters, exportFormat, showError, showSuccess, showInfo, transactionsData?.transactions]); // Dependencies

  const handleExportWithFormat = async (format: 'xlsx' | 'csv') => {
    setExportFormat(format);
    await handleExport();
  };

  if (isError) {
    showError(`Failed to get Transaction Details: ${(error as Error).message}`);
    return null; // Or show an error component
  }

  return (
    <div className='mx-auto w-full max-w-7xl space-y-4 p-3 pt-4 md:space-y-6'>
      {/* Header */}
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

      {/* Filters */}
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
              className='w-full pl-9' // Keep padding for potential icon
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
              <span>Filters</span>
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
            {/* Account Filter */}
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

            {/* Category Filter */}
            <div className='space-y-1'>
              <label className='mb-1 block text-xs font-medium sm:text-sm'>Category</label>
              <Select onValueChange={handleCategoryChange} value={filters.categoryId || 'all'}>
                <SelectTrigger className='h-9 w-full text-xs sm:h-10 sm:text-sm'>
                  <SelectValue placeholder='All Categories' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Categories</SelectItem>
                  {isLoadingCategories ? (
                    <SelectItem value='loading-categories' disabled>
                      Loading categories...
                    </SelectItem>
                  ) : (
                    categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Type Filter */}
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

            {/* Date Range Filter */}
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
                hideCloseButton
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

            {/* Export Controls - DropdownMenu Button */}
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
                  <DropdownMenuItem
                    onClick={async () => await handleExportWithFormat('xlsx')}
                    disabled={isExporting}
                  >
                    <Download className='mr-2 h-4 w-4' />
                    Export as Excel (.xlsx)
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={async () => await handleExportWithFormat('csv')}
                    disabled={isExporting}
                  >
                    <Download className='mr-2 h-4 w-4' />
                    Export as CSV (.csv)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )}
      </div>

      {/* Transaction Table */}
      {isLoading && !transactionsData ? (
        <Loader />
      ) : transactionsData?.transactions && transactionsData.transactions.length > 0 ? (
        <div className='my-2 mb-16 sm:mb-0'>
          <TransactionTable
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
            key={'transactionspage'}
          />
        </div>
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
