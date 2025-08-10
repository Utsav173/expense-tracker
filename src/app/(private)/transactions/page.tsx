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
import {
  Filter,
  Import,
  X,
  Download,
  Search,
  Calendar,
  DollarSign,
  Building,
  Tag,
  Settings2
} from 'lucide-react';
import { accountGetDropdown } from '@/lib/endpoints/accounts';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/lib/hooks/useToast';
import type { AccountAPI } from '@/lib/api/api-types';
import { useTransactions } from '@/components/transactions/hooks/useTransactions';
import DateRangePickerV2 from '@/components/date/date-range-picker-v2';
import { API_BASE_URL } from '@/lib/api-client';
import { format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from '@/components/ui/dropdown-menu';
import CategoryCombobox from '@/components/ui/category-combobox';
import { DateRange } from 'react-day-picker';

const TransactionsPage = () => {
  const { showError, showInfo } = useToast();
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [tempFilters, setTempFilters] = useState<{
    accountId: string;
    categoryId: string;
    isIncome: boolean | undefined;
    dateRange: DateRange | undefined;
    minAmount: number | undefined;
    maxAmount: number | undefined;
    type: 'recurring' | 'normal' | 'all';
  }>({
    accountId: 'all',
    categoryId: 'all',
    isIncome: undefined,
    dateRange: undefined,
    minAmount: undefined,
    maxAmount: undefined,
    type: 'all'
  });

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

  const [accounts, setAccounts] = useState<AccountAPI.SimpleAccount[]>([]);

  // Calculate active filters for badges
  const getActiveFilters = () => {
    const activeFilters = [];

    if (filters.accountId && filters.accountId !== 'all') {
      const account = accounts.find((acc) => acc.id === filters.accountId);
      activeFilters.push({
        key: 'account',
        label: 'Account',
        value: account?.name || 'Selected Account',
        icon: Building
      });
    }

    if (filters.categoryId && filters.categoryId !== 'all') {
      activeFilters.push({
        key: 'category',
        label: 'Category',
        value: 'Selected Category',
        icon: Tag
      });
    }

    if (filters.isIncome !== undefined) {
      activeFilters.push({
        key: 'type',
        label: 'Type',
        value: filters.isIncome ? 'Income' : 'Expense',
        icon: DollarSign
      });
    }

    if (filters.dateRange?.from && filters.dateRange.to) {
      activeFilters.push({
        key: 'dateRange',
        label: 'Date Range',
        value: `${format(filters.dateRange.from, 'MMM dd')} - ${format(filters.dateRange.to, 'MMM dd, yyyy')}`,
        icon: Calendar
      });
    }

    if (filters.minAmount || filters.maxAmount) {
      const amountText =
        filters.minAmount && filters.maxAmount
          ? `$${filters.minAmount} - $${filters.maxAmount}`
          : filters.minAmount
            ? `Min $${filters.minAmount}`
            : `Max $${filters.maxAmount}`;
      activeFilters.push({
        key: 'amount',
        label: 'Amount',
        value: amountText,
        icon: DollarSign
      });
    }

    if (filters.type && filters.type !== 'all') {
      activeFilters.push({
        key: 'transactionType',
        label: 'Transaction Type',
        value: filters.type === 'normal' ? 'Normal' : 'Recurring',
        icon: Settings2
      });
    }

    return activeFilters;
  };

  const activeFilters = getActiveFilters();
  const hasSearchQuery = debouncedSearchQuery.length > 0;

  useEffect(() => {
    if (accountsData) {
      setAccounts(accountsData);
    }
  }, [accountsData]);

  // Initialize temp filters when dialog opens
  useEffect(() => {
    if (isFilterDialogOpen) {
      setTempFilters({
        accountId: filters.accountId || 'all',
        categoryId: filters.categoryId || 'all',
        isIncome: filters.isIncome,
        dateRange: filters.dateRange,
        minAmount: filters.minAmount,
        maxAmount: filters.maxAmount,
        type: filters.type || 'all'
      });
    }
  }, [isFilterDialogOpen, filters]);

  const handleApplyFilters = () => {
    // Apply all temp filters
    if (tempFilters.accountId !== 'all') {
      handleAccountChange(tempFilters.accountId);
    } else {
      handleAccountChange('all');
    }

    if (tempFilters.categoryId !== 'all') {
      handleCategoryChange(tempFilters.categoryId);
    } else {
      handleCategoryChange('all');
    }

    if (tempFilters.isIncome !== undefined) {
      handleIncomeTypeChange(String(tempFilters.isIncome));
    } else {
      handleIncomeTypeChange('all');
    }

    if (tempFilters.dateRange) {
      handleDateRangeSelect(tempFilters.dateRange);
    }

    if (tempFilters.minAmount || tempFilters.maxAmount) {
      handleAmountChange(tempFilters.minAmount, tempFilters.maxAmount);
    }

    if (tempFilters.type !== 'all') {
      handleTypeChange(tempFilters.type || 'all');
    } else {
      handleTypeChange('all');
    }

    setIsFilterDialogOpen(false);
  };

  const handleClearFilters = () => {
    setTempFilters({
      accountId: 'all',
      categoryId: 'all',
      isIncome: undefined,
      dateRange: undefined,
      minAmount: undefined,
      maxAmount: undefined,
      type: 'all'
    });
  };

  const removeFilter = (filterKey: string) => {
    switch (filterKey) {
      case 'account':
        handleAccountChange('all');
        break;
      case 'category':
        handleCategoryChange('all');
        break;
      case 'type':
        handleIncomeTypeChange('all');
        break;
      case 'dateRange':
        handleClearDateRange();
        break;
      case 'amount':
        handleAmountChange(undefined, undefined);
        break;
      case 'transactionType':
        handleTypeChange('all');
        break;
    }
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
    <div className='mx-auto w-full max-w-7xl space-y-6 p-3 pt-4'>
      {/* Header Section */}
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
              <Import className='h-4 w-4' />
              Import
            </Button>
          </Link>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className='space-y-4'>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
          {/* Search Input */}
          <div className='relative flex-1'>
            <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
            <Input
              type='text'
              placeholder='Search transactions...'
              value={filters.searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='pl-9'
            />
          </div>

          {/* Filter and Export Controls */}
          <div className='flex gap-2'>
            <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
              <DialogTrigger asChild>
                <Button variant='outline' className='gap-2'>
                  <Filter className='h-4 w-4' />
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
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className='flex items-center gap-2'>
                    <Filter className='h-5 w-5' />
                    Filter Transactions
                  </DialogTitle>
                </DialogHeader>

                <div className='grid grid-cols-1 gap-6 py-4 md:grid-cols-2 lg:grid-cols-3'>
                  {/* Account Filter */}
                  <div className='space-y-2'>
                    <label className='flex items-center gap-2 text-sm font-medium'>
                      <Building className='h-4 w-4' />
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
                  <div className='space-y-2'>
                    <label className='flex items-center gap-2 text-sm font-medium'>
                      <Tag className='h-4 w-4' />
                      Category
                    </label>
                    <CategoryCombobox
                      value={tempFilters.categoryId}
                      onChange={(value) =>
                        setTempFilters((prev) => ({ ...prev, categoryId: value ?? 'all' }))
                      }
                      allowClear={true}
                      placeholder='All Categories'
                    />
                  </div>

                  {/* Income/Expense Type */}
                  <div className='space-y-2'>
                    <label className='flex items-center gap-2 text-sm font-medium'>
                      <DollarSign className='h-4 w-4' />
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

                  {/* Date Range */}
                  <div className='space-y-2'>
                    <label className='flex items-center gap-2 text-sm font-medium'>
                      <Calendar className='h-4 w-4' />
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

                  {/* Min Amount */}
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

                  {/* Max Amount */}
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

                  {/* Transaction Type */}
                  <div className='space-y-2'>
                    <label className='flex items-center gap-2 text-sm font-medium'>
                      <Settings2 className='h-4 w-4' />
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
                  <Download className='h-4 w-4' />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
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

        {/* Active Filters Display */}
        {(activeFilters.length > 0 || hasSearchQuery) && (
          <div className='flex flex-wrap items-center gap-2'>
            <span className='text-muted-foreground text-sm'>Active filters:</span>

            {hasSearchQuery && (
              <Badge variant='secondary' className='flex items-center gap-1'>
                <Search className='h-3 w-3' />
                Search: "{debouncedSearchQuery}"
                <button
                  onClick={() => setSearchQuery('')}
                  className='hover:bg-muted-foreground/20 ml-1 rounded-full p-0.5'
                >
                  <X className='h-3 w-3' />
                </button>
              </Badge>
            )}

            {activeFilters.map((filter) => {
              const Icon = filter.icon;
              return (
                <Badge key={filter.key} variant='secondary' className='flex items-center gap-1'>
                  <Icon className='h-3 w-3' />
                  {filter.label}: {filter.value}
                  <button
                    onClick={() => removeFilter(filter.key)}
                    className='hover:bg-muted-foreground/20 ml-1 rounded-full p-0.5'
                  >
                    <X className='h-3 w-3' />
                  </button>
                </Badge>
              );
            })}

            {(activeFilters.length > 0 || hasSearchQuery) && (
              <Button
                variant='ghost'
                size='sm'
                onClick={() => {
                  resetFilters();
                  setSearchQuery('');
                }}
                className='h-6 px-2 text-xs'
              >
                Clear All
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Table Section */}
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
          accountsData={accountsData}
        />
      ) : (
        <div className='flex flex-col items-center justify-center space-y-4 py-12'>
          <div className='bg-muted rounded-full p-4'>
            <Search className='text-muted-foreground h-8 w-8' />
          </div>
          <div className='text-center'>
            <p className='text-lg font-medium'>No transactions found</p>
            <p className='text-muted-foreground'>
              Try adjusting your search terms or filters to find what you're looking for.
            </p>
          </div>
          {(activeFilters.length > 0 || hasSearchQuery) && (
            <Button
              variant='outline'
              onClick={() => {
                resetFilters();
                setSearchQuery('');
              }}
            >
              Clear all filters
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default TransactionsPage;
