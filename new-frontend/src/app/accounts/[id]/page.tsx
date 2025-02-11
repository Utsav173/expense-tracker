'use client';

import { useQuery } from '@tanstack/react-query';
import { accountGetById } from '@/lib/endpoints/accounts';
import { useRouter } from 'next/navigation';
import { transactionGetAll } from '@/lib/endpoints/transactions';
import TransactionTable from '@/components/transactions-table';
import Loader from '@/components/ui/loader';
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
import { categoryGetAll } from '@/lib/endpoints/category';
import { Category } from '@/lib/types'; // Import TransactionType
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import DateRangePicker from '@/components/date-range-picker';

const AccountDetailsPage = ({ params }: { params: { id: string } }) => {
  const { id } = params;
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [isIncome, setIsIncome] = useState<boolean | undefined>(undefined);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const {
    data: account,
    isLoading: isAccountLoading,
    error: accountError
  } = useQuery({
    queryKey: ['account', id],
    queryFn: () => accountGetById(id),
    retry: false
  });

  const {
    data: transactionsData,
    isLoading: isTransactionLoading,
    error: transactionError,
    refetch
  } = useQuery({
    queryKey: [
      'accountTransactions',
      id,
      { dateRange, page, pageSize: 10, q: search, sortBy, sortOrder, categoryId, isIncome }
    ],
    queryFn: () =>
      transactionGetAll({
        accountId: id,
        duration: dateRange
          ? `${format(dateRange.from!, 'yyyy-MM-dd')},${format(dateRange.to!, 'yyyy-MM-dd')}`
          : '',
        page,
        pageSize: 10,
        q: search,
        sortBy,
        sortOrder,
        categoryId: categoryId === 'all' ? '' : categoryId,
        isIncome
      }),
    retry: false,
    enabled: !!id // Only fetch if id is available
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryGetAll
  });

  const [categories, setCategories] = useState<Category[]>([]);

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

  if (isAccountLoading) {
    return <Loader />;
  }

  if (accountError) {
    return <div>Failed to load the account</div>;
  }

  if (isTransactionLoading) {
    return <Loader />;
  }

  if (transactionError) {
    return <div>Failed to load the transaction data: {transactionError.message}</div>;
  }

  return (
    <div className='p-4'>
      <h1 className='text-xl font-bold'>{account?.name}</h1>
      <p>Balance: {account?.balance}</p>

      <div className='mt-4 flex flex-col gap-2 md:flex-row'>
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
      </div>

      <DateRangePicker
        dateRange={dateRange}
        setDateRange={(range) => {
          setDateRange(range);
          setPage(1);
        }}
        className='mt-4'
      />

      <div className='mt-4'>
        {transactionsData?.transactions && (
          <TransactionTable
            transactions={transactionsData.transactions}
            onUpdate={refetch}
            onSort={handleSort}
            sortBy={sortBy}
            sortOrder={sortOrder}
          />
        )}
        <div className='mt-4 flex items-center justify-center gap-2'>
          {transactionsData?.totalPages &&
            Array.from({ length: transactionsData.totalPages }, (_, i) => i + 1).map((page) => (
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
      <Button className='mt-4 text-blue-500 hover:underline' onClick={() => router.back()}>
        Back
      </Button>
    </div>
  );
};

export default AccountDetailsPage;
