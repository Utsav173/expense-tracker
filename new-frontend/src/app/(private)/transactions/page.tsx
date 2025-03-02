'use client';

import TransactionTable from '@/components/transactions-table';
import Loader from '@/components/ui/loader';
import { transactionGetAll } from '@/lib/endpoints/transactions';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
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
import { accountGetDropdown } from '@/lib/endpoints/accounts';
import { categoryGetAll } from '@/lib/endpoints/category';
import { AccountDropdown, Category } from '@/lib/types';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import DateRangePicker from '@/components/date-range-picker';
import { useToast } from '@/lib/hooks/useToast';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { usePagination } from '@/hooks/usePagination';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination';
import { useRouter } from 'next/navigation';
import { useDebounce } from 'use-debounce';

const TransactionsPage = () => {
  const [accountId, setAccountId] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [isIncome, setIsIncome] = useState<boolean | undefined>(undefined);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [tempDateRange, setTempDateRange] = useState<DateRange | undefined>();
  const router = useRouter();
  const [debouncedSearch] = useDebounce(search, 300);

  const { showError } = useToast();
  const { page, handlePageChange } = usePagination(1, (params) => {
    const currentParams = new URLSearchParams(window.location.search);
    Object.keys(params).forEach((key) => {
      const param = key as keyof typeof params;
      if (params[param] === undefined || params[param] === null || params[param] === '') {
        currentParams.delete(param.toString());
      } else {
        currentParams.set(param.toString(), params[param]);
      }
    });

    const newUrl = `${window.location.pathname}?${currentParams.toString()}`;
    router.replace(newUrl, { scroll: false });
  });

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

  useEffect(() => {
    handlePageChange(1);
  }, [debouncedSearch]);

  if (error) {
    showError(`Failed to get Transaction Details : ${(error as Error).message}`);
    return null;
  }

  return (
    <div className='p-4'>
      <h1 className='text-xl font-bold'>Transactions</h1>
      <Separator className='my-4' />

      <div className='mb-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Select onValueChange={handleAccountIdChange} value={accountId || 'all'}>
          <SelectTrigger className='w-full'>
            <SelectValue placeholder='Select Account' />
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

        <Select onValueChange={handleCategoryIdChange} value={categoryId || 'all'}>
          <SelectTrigger className='w-full'>
            <SelectValue placeholder='Select Category' />
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

        <Select
          onValueChange={handleIsIncomeChange}
          value={isIncome === undefined ? 'all' : isIncome ? 'true' : 'false'}
        >
          <SelectTrigger className='w-full'>
            <SelectValue placeholder='Select Type' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Types</SelectItem>
            <SelectItem value='true'>Income</SelectItem>
            <SelectItem value='false'>Expense</SelectItem>
          </SelectContent>
        </Select>

        <Input type='text' placeholder='Search...' onChange={handleSearch} className='w-full' />
      </div>

      <div className='mb-4'>
        <DateRangePicker dateRange={tempDateRange} setDateRange={handleDateRangeSelect} />
        {dateRange?.from && (
          <Button variant='outline' size='sm' className='ml-2' onClick={handleClearDateRange}>
            Clear Dates
          </Button>
        )}
      </div>

      <div className='mt-4'>
        {isLoading ? (
          <Loader />
        ) : (
          <>
            <TransactionTable
              transactions={transactions?.transactions}
              onUpdate={refetch}
              onSort={handleSort}
              sortBy={sortBy}
              sortOrder={sortOrder}
            />
            {transactions?.totalPages && transactions?.totalPages > 1 ? (
              <Pagination className='mt-6'>
                <PaginationContent>
                  {page > 1 && (
                    <PaginationItem>
                      <PaginationPrevious href='#' onClick={() => handlePageChange(page - 1)} />
                    </PaginationItem>
                  )}
                  {Array.from({ length: transactions.totalPages }, (_, i) => i + 1)
                    .filter(
                      (p) => p <= 2 || p >= transactions.totalPages - 1 || Math.abs(p - page) <= 1
                    )
                    .map((p) => (
                      <PaginationItem key={p}>
                        <PaginationLink
                          href='#'
                          isActive={p === page}
                          onClick={() => handlePageChange(p)}
                        >
                          {p}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                  {page < transactions.totalPages && (
                    <PaginationItem>
                      <PaginationNext href='#' onClick={() => handlePageChange(page + 1)} />
                    </PaginationItem>
                  )}
                </PaginationContent>
              </Pagination>
            ) : null}
          </>
        )}
      </div>

      <div className='mt-4 flex gap-4'>
        <AddTransactionModal onTransactionAdded={refetch} />
        <Link href='/transactions/import'>
          <Button variant='secondary'>Import Transactions</Button>
        </Link>
      </div>
    </div>
  );
};

export default TransactionsPage;
