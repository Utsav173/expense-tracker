'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { useDebounce } from 'use-debounce';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

// Components
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
import DateRangePicker from '@/components/date-range-picker';
import { Card, CardContent } from '@/components/ui/card';
import { PlusCircle, Upload, Filter, X, Calendar, Search, ArrowUpDown } from 'lucide-react';

// API & Hooks
import { transactionGetAll } from '@/lib/endpoints/transactions';
import { accountGetDropdown } from '@/lib/endpoints/accounts';
import { categoryGetAll } from '@/lib/endpoints/category';
import { useToast } from '@/lib/hooks/useToast';
import { usePagination } from '@/hooks/usePagination';

// Types
import { AccountDropdown, Category } from '@/lib/types';
import { cn } from '@/lib/utils';

const TransactionsPage = () => {
  const [accountId, setAccountId] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [isIncome, setIsIncome] = useState<boolean | undefined>(undefined);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [tempDateRange, setTempDateRange] = useState<DateRange | undefined>();
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  // Hooks
  const router = useRouter();
  const [debouncedSearch] = useDebounce(search, 300);
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { showError } = useToast();

  // Active filters count
  const activeFiltersCount = [
    accountId !== undefined && accountId !== 'all',
    categoryId !== undefined && categoryId !== 'all',
    isIncome !== undefined,
    dateRange?.from && dateRange.to,
    debouncedSearch
  ].filter(Boolean).length;

  // Pagination
  const { page, handlePageChange } = usePagination(1, (params) => {
    const currentParams = new URLSearchParams(searchParams.toString());
    Object.keys(params).forEach((key) => {
      if (params[key] === undefined || params[key] === null || params[key] === '') {
        currentParams.delete(key);
      } else {
        currentParams.set(key, String(params[key]));
      }
    });
    const newUrl = `${pathname}?${currentParams.toString()}`;
    router.push(newUrl, { scroll: false });
  });

  // Data fetching
  const {
    data: transactions,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: [
      'transactions',
      {
        accountId,
        dateRange,
        page,
        pageSize: 10,
        q: debouncedSearch,
        sortBy,
        sortOrder,
        categoryId,
        isIncome
      }
    ],
    queryFn: () =>
      transactionGetAll({
        accountId: accountId === 'all' ? '' : accountId,
        duration:
          dateRange?.from && dateRange.to
            ? `${format(dateRange.from, 'yyyy-MM-dd')},${format(dateRange.to, 'yyyy-MM-dd')}`
            : '',
        page,
        pageSize: 10,
        q: debouncedSearch,
        sortBy,
        sortOrder,
        categoryId: categoryId === 'all' ? '' : categoryId,
        isIncome
      }),
    retry: false
  });

  const { data: accountsData, isLoading: isLoadingAccounts } = useQuery({
    queryKey: ['accountsDropdown'],
    queryFn: accountGetDropdown
  });

  const { data: categoriesData, isLoading: isLoadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryGetAll
  });

  // Local state for dropdown data
  const [accounts, setAccounts] = useState<AccountDropdown[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Effects
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

  useEffect(() => {
    handlePageChange(1);
  }, [debouncedSearch]);

  // Event handlers
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleSort = (field: string, order: 'asc' | 'desc') => {
    setSortBy(field);
    setSortOrder(order);
    handlePageChange(1);
  };

  const handleDateRangeSelect = (range: DateRange | undefined) => {
    setTempDateRange(range);
    if (range?.from && range.to) {
      setDateRange(range);
      handlePageChange(1);
    }
  };

  const handleClearDateRange = () => {
    setDateRange(undefined);
    setTempDateRange(undefined);
    handlePageChange(1);
  };

  const handleAccountIdChange = (value: string) => {
    setAccountId(value);
    handlePageChange(1);
  };

  const handleCategoryIdChange = (value: string) => {
    setCategoryId(value);
    handlePageChange(1);
  };

  const handleIsIncomeChange = (value: string) => {
    setIsIncome(value === 'all' ? undefined : value === 'true');
    handlePageChange(1);
  };

  const resetAllFilters = () => {
    setAccountId(undefined);
    setCategoryId(undefined);
    setIsIncome(undefined);
    setDateRange(undefined);
    setTempDateRange(undefined);
    setSearch('');
    handlePageChange(1);
  };

  const toggleFilters = () => {
    setFiltersExpanded(!filtersExpanded);
  };

  // Error handling
  if (error) {
    showError(`Failed to get Transaction Details: ${(error as Error).message}`);
    return null;
  }

  return (
    <div className='container mx-auto max-w-7xl p-4'>
      {/* Header section */}
      <div className='mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 className='text-2xl font-bold'>Transactions</h1>
          <p className='mt-1 text-muted-foreground'>
            {transactions?.totalCount
              ? `${transactions.totalCount} transactions found`
              : 'Manage your financial transactions'}
          </p>
        </div>

        <div className='mt-4 flex gap-2 sm:mt-0'>
          <AddTransactionModal
            onTransactionAdded={refetch}
            triggerButton={
              <Button className='flex items-center gap-2'>
                <PlusCircle size={16} />
                <span className='hidden sm:inline'>Add Transaction</span>
                <span className='sm:hidden'>Add</span>
              </Button>
            }
          />

          <Link href='/transactions/import'>
            <Button variant='outline' className='flex items-center gap-2'>
              <Upload size={16} />
              <span className='hidden sm:inline'>Import</span>
            </Button>
          </Link>
        </div>
      </div>

      <Card className='mb-6'>
        <CardContent className='pt-6'>
          {/* Quick search and filter toggle */}
          <div
            className={cn(`flex flex-col items-start gap-4 sm:flex-row sm:items-center`, {
              'mb-4': filtersExpanded
            })}
          >
            <div className='relative flex-1'>
              <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground' />
              <Input
                type='text'
                placeholder='Search transactions...'
                value={search}
                onChange={handleSearch}
                className='w-full pl-9'
              />
            </div>

            <div className='flex gap-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={toggleFilters}
                className='flex items-center gap-1'
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
                  onClick={resetAllFilters}
                  className='flex items-center gap-1'
                >
                  <X size={16} />
                  <span>Clear all</span>
                </Button>
              )}
            </div>
          </div>

          {/* Advanced filters section */}
          {filtersExpanded && (
            <div className='mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
              <div>
                <label className='mb-1 block text-sm font-medium'>Account</label>
                <Select onValueChange={handleAccountIdChange} value={accountId || 'all'}>
                  <SelectTrigger className='w-full'>
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
                <label className='mb-1 block text-sm font-medium'>Category</label>
                <Select onValueChange={handleCategoryIdChange} value={categoryId || 'all'}>
                  <SelectTrigger className='w-full'>
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
                <label className='mb-1 block text-sm font-medium'>Type</label>
                <Select
                  onValueChange={handleIsIncomeChange}
                  value={isIncome === undefined ? 'all' : isIncome ? 'true' : 'false'}
                >
                  <SelectTrigger className='w-full'>
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
                <label className='mb-1 block text-sm font-medium'>Date Range</label>
                <div className='flex items-center gap-2'>
                  <DateRangePicker dateRange={tempDateRange} setDateRange={handleDateRangeSelect} />
                  {dateRange?.from && (
                    <Button
                      variant='ghost'
                      size='icon'
                      onClick={handleClearDateRange}
                      className='h-10 w-10'
                    >
                      <X className='h-4 w-4' />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transactions table */}

      {isLoading ? (
        <div className='flex items-center justify-center py-12'>
          <Loader />
        </div>
      ) : transactions?.transactions && transactions.transactions.length > 0 ? (
        <TransactionTable
          transactions={transactions.transactions}
          onUpdate={refetch}
          onSort={handleSort}
          sortBy={sortBy}
          sortOrder={sortOrder}
          loading={isLoading}
          totalRecords={transactions.totalCount}
          page={page}
          handlePageChange={handlePageChange}
        />
      ) : (
        <div className='flex items-center justify-center py-12'>
          <p>No transactions found</p>
        </div>
      )}
    </div>
  );
};

export default TransactionsPage;
