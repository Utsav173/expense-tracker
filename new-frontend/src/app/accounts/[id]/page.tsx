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
import DateRangePicker from '@/components/date-range-picker'; // Import
import { useToast } from '@/lib/hooks/useToast';
import { Separator } from '@/components/ui/separator';

const AccountDetailsPage = ({ params }: { params: { id: string } }) => {
  const { id } = params;
  const router = useRouter();
  const { showError } = useToast();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [isIncome, setIsIncome] = useState<boolean | undefined>(undefined);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [tempDateRange, setTempDateRange] = useState<DateRange | undefined>(); // Temporary date range

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
        duration:
          dateRange?.from && dateRange.to
            ? `${format(dateRange.from, 'yyyy-MM-dd')},${format(dateRange.to, 'yyyy-MM-dd')}`
            : dateRange?.from
              ? `${format(dateRange.from, 'yyyy-MM-dd')},${format(dateRange.from, 'yyyy-MM-dd')}`
              : '', // Only send duration if both from and to are set, or a single date
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

  const { data: categoriesData, isLoading: isLoadingCategories } = useQuery({
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

  const handleDateRangeSelect = (range: DateRange | undefined) => {
    setTempDateRange(range); // Update temporary range
    if (range?.from && range.to) {
      setDateRange(range); // Update main range when both dates are selected
      setPage(1);
    }
  };

  const handleClearDateRange = () => {
    setDateRange(undefined);
    setTempDateRange(undefined);
    setPage(1);
  };

  if (isAccountLoading || isLoadingCategories) {
    return <Loader />;
  }

  if (accountError || transactionError) {
    const errorMessage = accountError
      ? (accountError as Error).message
      : (transactionError as Error).message;
    showError(`Failed to load account or transaction data: ${errorMessage}`);
    return null; // Or a more user-friendly error message/component
  }

  return (
    <div className='p-4'>
      <h1 className='text-xl font-bold'>{account?.name}</h1>
      <p>Balance: {account?.balance}</p>
      <Separator className='my-4' />

      <div className='mb-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
        {/* Category Select */}
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
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Income/Expense Select */}
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

        {/* Search Input */}
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
        {transactionsData?.transactions && (
          <TransactionTable
            transactions={transactionsData.transactions}
            onUpdate={refetch}
            onSort={handleSort}
            sortBy={sortBy}
            sortOrder={sortOrder}
          />
        )}
        <div className='relative mt-4 flex items-center justify-center gap-2'>
          {isTransactionLoading ? (
            <Loader />
          ) : (
            transactionsData?.totalPages &&
            Array.from({ length: transactionsData.totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                variant='outline'
                className='rounded-sm border px-2 py-1'
                key={page}
                onClick={() => handlePageChange(page)}
                disabled={page === transactionsData.currentPage}
              >
                {page}
              </Button>
            ))
          )}
        </div>
      </div>
      <Button className='mt-4 text-blue-500 hover:underline' onClick={() => router.back()}>
        Back
      </Button>
    </div>
  );
};

export default AccountDetailsPage;
