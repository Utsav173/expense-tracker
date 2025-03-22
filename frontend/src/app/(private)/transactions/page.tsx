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
import { Filter, X, Search, Import } from 'lucide-react';

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

  const router = useRouter();
  const [debouncedSearch] = useDebounce(search, 300);
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { showError } = useToast();

  const activeFiltersCount = [
    accountId !== undefined && accountId !== 'all',
    categoryId !== undefined && categoryId !== 'all',
    isIncome !== undefined,
    dateRange?.from && dateRange.to,
    debouncedSearch
  ].filter(Boolean).length;

  const { page, handlePageChange } = usePagination(
    Number(searchParams.get('page')) || 1,
    (params) => {
      const currentParams = new URLSearchParams(searchParams.toString());
      Object.keys(params).forEach((key) => {
        if (params[key] === undefined || params[key] === null || params[key] === '') {
          currentParams.delete(key);
        } else {
          currentParams.set(key, String(params[key]));
        }
      });
      const newUrl = `${pathname}?${currentParams.toString()}`;
      router.push(newUrl, { scroll: true });
    }
  );

  const queryKey = [
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
  ];

  const {
    data: transactions,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey,
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

  const [accounts, setAccounts] = useState<AccountDropdown[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

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
  }, [debouncedSearch, accountId, categoryId, isIncome, dateRange, sortBy, sortOrder]);

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

  if (error) {
    showError(`Failed to get Transaction Details: ${(error as Error).message}`);
    return null;
  }

  return (
    <div className='mx-auto w-full max-w-7xl space-y-4 p-3 md:space-y-6'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 className='text-xl font-bold sm:text-2xl'>Transactions</h1>
          <p className='mt-1 text-sm text-muted-foreground sm:text-base'>
            {transactions?.totalCount
              ? `${transactions.totalCount} transactions found`
              : 'Manage your financial transactions'}
          </p>
        </div>

        {/* Action buttons - Fixed position on mobile */}
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
                onClick={resetAllFilters}
                className='flex flex-1 items-center justify-center gap-1 sm:flex-auto'
              >
                <X size={16} />
                <span>Clear</span>
              </Button>
            )}
          </div>
        </div>

        {/* Advanced filters section - Improved grid layout for mobile */}
        {filtersExpanded && (
          <div className='mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4'>
            <div>
              <label className='mb-1 block text-xs font-medium sm:text-sm'>Account</label>
              <Select onValueChange={handleAccountIdChange} value={accountId || 'all'}>
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
              <Select onValueChange={handleCategoryIdChange} value={categoryId || 'all'}>
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
                onValueChange={handleIsIncomeChange}
                value={isIncome === undefined ? 'all' : isIncome ? 'true' : 'false'}
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
                  dateRange={tempDateRange}
                  setDateRange={handleDateRangeSelect}
                  className='h-9 text-xs sm:h-10 sm:text-sm'
                />
                {dateRange?.from && (
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

      {/* Content area */}
      {isLoading ? (
        <div className='flex items-center justify-center py-12'>
          <Loader />
        </div>
      ) : transactions?.transactions && transactions.transactions.length > 0 ? (
        <div className='my-2 mb-16 sm:mb-0'>
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
            queryKey={queryKey}
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
