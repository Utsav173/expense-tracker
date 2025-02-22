'use client';

import { useQuery } from '@tanstack/react-query';
import { accountGetById, accountGetCustomAnalytics } from '@/lib/endpoints/accounts';
import { useRouter } from 'next/navigation';
import { transactionGetAll, transactionGetIncomeExpenseChart } from '@/lib/endpoints/transactions';
import TransactionTable from '@/components/transactions-table';
import { useState, useEffect, useMemo } from 'react';
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
import { Category, ChartDataType } from '@/lib/types';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import DateRangePicker from '@/components/date-range-picker';
import { useToast } from '@/lib/hooks/useToast';
import { AccountHeader, AnalyticsCards, IncomeExpenseChart } from '@/components/account';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination';

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
    isError: isAccountError,
    error: accountError
  } = useQuery({
    queryKey: ['account', id],
    queryFn: () => accountGetById(id),
    retry: false
  });

  const {
    data: customAnalytics,
    isLoading: isAnalyticsLoading,
    isError: isAnalyticsError,
    error: analyticsError
  } = useQuery({
    queryKey: ['customAnalytics', id, dateRange],
    queryFn: () =>
      accountGetCustomAnalytics(id, {
        duration:
          dateRange?.from && dateRange.to
            ? `${format(dateRange.from, 'yyyy-MM-dd')},${format(dateRange.to, 'yyyy-MM-dd')}`
            : 'thisMonth'
      }),
    enabled: !!id,
    retry: false
  });

  const {
    data: chartData,
    isLoading: isChartLoading,
    isError: isChartError,
    error: chartError
  } = useQuery({
    queryKey: ['incomeExpenseChart', id, dateRange],
    queryFn: () =>
      transactionGetIncomeExpenseChart({
        accountId: id,
        duration:
          dateRange?.from && dateRange.to
            ? `${format(dateRange.from, 'yyyy-MM-dd')},${format(dateRange.to, 'yyyy-MM-dd')}`
            : 'thisMonth' // Default to this month
      }),
    enabled: !!id,
    retry: false
  });

  const {
    data: transactionsData,
    isLoading: isTransactionLoading,
    isError: isTransactionError,
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

  // combines All errors from useQuery Hooks
  if (isAccountError || isTransactionError || isAnalyticsError) {
    const errorMessage = isAccountError
      ? (accountError as Error).message
      : isTransactionError
        ? (transactionError as Error).message
        : (analyticsError as Error).message;
    showError(`Failed to load data: ${errorMessage}`);
    return <div>Error: {errorMessage}</div>;
  }

  const transformedChartData = useMemo(() => {
    if (!chartData) {
      return [];
    }
    const chartArray: ChartDataType[] = [];
    chartData.date?.forEach((date: string, i) => {
      chartArray.push({
        date,
        income: chartData.income?.[i],
        expense: chartData.expense?.[i],
        balance: chartData.balance?.[i]
      });
    });
    return chartArray;
  }, [chartData]);

  const getPaginationItems = (currentPage: number, totalPages: number) => {
    const pages = [];
    const pageRange = 2;

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      if (currentPage > pageRange + 2) {
        pages.push('ellipsis');
      }
      for (
        let i = Math.max(2, currentPage - pageRange);
        i <= Math.min(totalPages - 1, currentPage + pageRange);
        i++
      ) {
        pages.push(i);
      }
      if (currentPage < totalPages - (pageRange + 1)) {
        pages.push('ellipsis');
      }
      pages.push(totalPages);
    }

    return pages;
  };

  const paginationItems = useMemo(() => {
    if (!transactionsData) return [];
    return getPaginationItems(page, transactionsData.totalPages);
  }, [transactionsData, page]);

  return (
    <div className='min-h-screen'>
      <AccountHeader account={account} isLoading={isAccountLoading} router={router} />

      <div className='mx-auto max-w-7xl space-y-6 p-4'>
        <AnalyticsCards analytics={customAnalytics} isLoading={isAnalyticsLoading} />

        <IncomeExpenseChart data={transformedChartData} isLoading={isChartLoading} />

        <div className='rounded-xl bg-white shadow-sm'>
          <div className='border-b p-6'>
            <h2 className='text-xl font-semibold'>Transactions</h2>
          </div>
          <div className='p-4'>
            <div className='mb-6 flex flex-wrap gap-4'>
              <Input
                type='text'
                placeholder='Search transactions...'
                value={search}
                onChange={handleSearch}
                className='w-full'
              />
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

              <DateRangePicker dateRange={tempDateRange} setDateRange={handleDateRangeSelect} />
              {dateRange?.from && (
                <Button variant='outline' size='sm' className='ml-2' onClick={handleClearDateRange}>
                  Clear Dates
                </Button>
              )}
            </div>

            {isTransactionLoading ? (
              <div className='space-y-4'>
                {[1, 2, 3].map((i) => (
                  <div key={i} className='h-16 animate-pulse rounded bg-gray-200'></div>
                ))}
              </div>
            ) : (
              <>
                <TransactionTable
                  transactions={transactionsData?.transactions}
                  onUpdate={refetch}
                  onSort={handleSort}
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                />
                <Pagination className='mt-6'>
                  {transactionsData && transactionsData?.totalPages > 0 && (
                    <PaginationContent>
                      {page !== 1 && (
                        <PaginationPrevious
                          href='#'
                          onClick={() => handlePageChange(Math.max(1, page - 1))}
                        />
                      )}
                      {paginationItems.map((item, index) =>
                        item === 'ellipsis' ? (
                          <PaginationItem key={`ellipsis-${index}`}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        ) : (
                          <PaginationItem key={item}>
                            <PaginationLink
                              href='#'
                              isActive={item === page}
                              onClick={() => handlePageChange(item as number)}
                            >
                              {item}
                            </PaginationLink>
                          </PaginationItem>
                        )
                      )}
                      {page !== transactionsData.totalPages && (
                        <PaginationNext
                          href='#'
                          onClick={() =>
                            handlePageChange(Math.min(transactionsData.totalPages, page + 1))
                          }
                        />
                      )}
                    </PaginationContent>
                  )}
                </Pagination>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountDetailsPage;
