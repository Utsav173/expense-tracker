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

const TransactionsPage = () => {
  const [accountId, setAccountId] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [isIncome, setIsIncome] = useState<boolean | undefined>(undefined);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [tempDateRange, setTempDateRange] = useState<DateRange | undefined>();

  const { showError } = useToast();

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
        q: search,
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
        q: search,
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
    setPage(1);
  };

  const handlePageChange = (page: number) => {
    setPage(page);
  };

  const handleSort = (field: string) => {
    if (field === sortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const handleDateRangeSelect = (range: DateRange | undefined) => {
    setTempDateRange(range);
    if (range?.from && range.to) {
      setDateRange(range);
      setPage(1);
    }
  };

  const handleClearDateRange = () => {
    setDateRange(undefined);
    setTempDateRange(undefined);
    setPage(1);
  };

  if (error) {
    showError(`Failed to get Transaction Details : ${(error as Error).message}`);
    return null;
  }

  return (
    <div className='p-4'>
      <h1 className='text-xl font-bold'>Transactions</h1>
      <Separator className='my-4' />

      <div className='mb-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Select
          onValueChange={(value) => {
            setAccountId(value === 'all' ? undefined : value);
            setPage(1);
          }}
          value={accountId || 'all'}
        >
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

        <Select
          onValueChange={(value) => {
            setCategoryId(value === 'all' ? undefined : value);
            setPage(1);
          }}
          value={categoryId || 'all'}
        >
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
          onValueChange={(value) => {
            setIsIncome(value === 'all' ? undefined : value === 'true');
            setPage(1);
          }}
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
            <div className='mt-4 flex items-center justify-center gap-2'>
              {transactions?.totalPages
                ? Array.from({ length: transactions.totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      variant='outline'
                      className='rounded-sm border px-2 py-1'
                      key={page}
                      onClick={() => handlePageChange(page)}
                      disabled={page === transactions.currentPage}
                    >
                      {page}
                    </Button>
                  ))
                : null}
            </div>
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
