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
import DateRangePicker from '@/components/date-range-picker'; // Import


const TransactionsPage = () => {
  const [accountId, setAccountId] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [isIncome, setIsIncome] = useState<boolean | undefined>(undefined);

  // Date Range Picker State
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

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
            : '', // Format for backend, handle undefined
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

  const { data: accountsData } = useQuery({
    queryKey: ['accountsDropdown'],
    queryFn: accountGetDropdown
  });

  const { data: categoriesData } = useQuery({
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
    setPage(1); // Reset to page 1 on new search
  };

  const handlePageChange = (page: number) => {
    setPage(page);
  };

  const handleSort = (field: string) => {
    if (field === sortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc'); // Default to ascending when changing sort field
    }
    setPage(1); // Reset to page 1 on new sort
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    setPage(1); // Reset page on date range change
  };

  if (isLoading) {
    return <Loader />;
  }

  if (error) {
    return <div>Error fetching transactions: {error.message}</div>;
  }

  return (
    <div className='p-4'>
      <h1 className='text-xl font-bold'>Transactions</h1>
      <div className='mt-4 flex flex-col gap-2 md:flex-row'>
        <Select
          onValueChange={(value) => {
            setAccountId(value === 'all' ? undefined : value);
            setPage(1);
          }}
          value={accountId || 'all'}
        >
          <SelectTrigger className='w-full md:w-[180px]'>
            <SelectValue placeholder='Select Account' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Accounts</SelectItem>
            {accounts.map((account) => (
              <SelectItem key={account.id} value={account.id}>
                {account.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          onValueChange={(value) => {
            setCategoryId(value === 'all' ? undefined : value);
            setPage(1);
          }}
          value={categoryId || 'all'}
        >
          <SelectTrigger className='w-full md:w-[180px]'>
            <SelectValue placeholder='Select Category' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          onValueChange={(value) => {
            setIsIncome(value === 'all' ? undefined : value === 'true');
            setPage(1);
          }}
          value={isIncome === undefined ? 'all' : isIncome ? 'true' : 'false'}
        >
          <SelectTrigger className='w-full md:w-[180px]'>
            <SelectValue placeholder='Select Type' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Types</SelectItem>
            <SelectItem value='true'>Income</SelectItem>
            <SelectItem value='false'>Expense</SelectItem>
          </SelectContent>
        </Select>

        <Input
          type='text'
          placeholder='Search...'
          onChange={handleSearch}
          className='w-full md:w-auto'
        />
        <AddTransactionModal />
      </div>

      {/* Use the DateRangePicker component */}
      <DateRangePicker dateRange={dateRange} setDateRange={setDateRange} className='mt-4' />

      <div className='mt-4'>
        <TransactionTable
          transactions={transactions?.transactions}
          onUpdate={refetch}
          onSort={handleSort}
          sortBy={sortBy}
          sortOrder={sortOrder}
        />
        <div className='mt-4 flex items-center justify-center gap-2'>
          {transactions?.totalPages &&
            Array.from({ length: transactions?.totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                variant='outline'
                className='rounded-sm border px-2 py-1'
                key={page}
                onClick={() => handlePageChange(page)}
              >
                {page}
              </Button>
            ))}
        </div>
      </div>
    </div>
  );
};

export default TransactionsPage;
