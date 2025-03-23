'use client';

import { useState, useEffect } from 'react';
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
import { Filter, Import, X } from 'lucide-react';
import { accountGetDropdown } from '@/lib/endpoints/accounts';
import { categoryGetAll } from '@/lib/endpoints/category';
import { useToast } from '@/lib/hooks/useToast';
import { useIsMobile } from '@/hooks/use-mobile';
import { AccountDropdown, Category } from '@/lib/types';
import { cn } from '@/lib/utils';
import DateRangePicker from '@/components/date-range-picker';
import { useTransactions } from '@/components/transactions/hooks/useTransactions';

const TransactionsPage = () => {
  const isMobile = useIsMobile();
  const { showError } = useToast();
  const [filtersExpanded, setFiltersExpanded] = useState(false);

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
    handleCategoryChange,
    handleIncomeTypeChange,
    handleDateRangeSelect,
    handleClearDateRange,
    handleSort,
    resetFilters
  } = useTransactions();

  const { data: accountsData, isLoading: isLoadingAccounts } = useQuery({
    queryKey: ['accountsDropdown'],
    queryFn: accountGetDropdown
  });

  const { data: categoriesData, isLoading: isLoadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryGetAll
  });

  const [accounts, setAccounts] = useState<AccountDropdown[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

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

  if (isError) {
    showError(`Failed to get Transaction Details: ${(error as Error).message}`);
    return null;
  }

  return (
    <div className='mx-auto w-full max-w-7xl space-y-4 p-3 md:space-y-6'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 className='text-xl font-bold sm:text-2xl'>Transactions</h1>
          <p className='mt-1 text-sm text-muted-foreground sm:text-base'>
            {transactionsData?.totalCount
              ? `${transactionsData.totalCount} transactions found`
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
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className='ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground'>
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
          <div className='mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4'>
            <div>
              <label className='mb-1 block text-xs font-medium sm:text-sm'>Account</label>
              <Select
                onValueChange={(value) => handleCategoryChange(value)}
                value={filters.categoryId || 'all'}
              >
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

            <div>
              <label className='mb-1 block text-xs font-medium sm:text-sm'>Category</label>
              <Select
                onValueChange={(value) => handleCategoryChange(value)}
                value={filters.categoryId || 'all'}
              >
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

            <div>
              <label className='mb-1 block text-xs font-medium sm:text-sm'>Type</label>
              <Select
                onValueChange={(value) => handleIncomeTypeChange(value)}
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

            <div>
              <label className='mb-1 block text-xs font-medium sm:text-sm'>Date Range</label>
              <div className='flex items-center gap-2'>
                <DateRangePicker
                  dateRange={filters.dateRange}
                  setDateRange={handleDateRangeSelect}
                  className='h-9 text-xs sm:h-10 sm:text-sm'
                />
                {filters.dateRange?.from && (
                  <Button
                    variant='ghost'
                    size='icon'
                    onClick={handleClearDateRange}
                    className='h-9 w-9 sm:h-10 sm:w-10'
                  >
                    <X className='h-4 w-4' />
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      {isLoading ? (
        <Loader />
      ) : transactionsData?.transactions && transactionsData.transactions.length > 0 ? (
        <div className='my-2 mb-16 sm:mb-0'>
          <TransactionTable
            transactions={transactionsData.transactions}
            onUpdate={refetch}
            onSort={handleSort}
            sortBy={filters.sortBy}
            sortOrder={filters.sortOrder}
            loading={isLoading}
            totalRecords={transactionsData.totalCount}
            page={page}
            handlePageChange={handlePageChange}
            queryKey={['transactions']}
            key={'transactionspage'}
          />
        </div>
      ) : (
        <div className='flex items-center justify-center py-12'>
          <p className='text-muted-foreground'>No transactions found</p>
        </div>
      )}
    </div>
  );
};

export default TransactionsPage;
