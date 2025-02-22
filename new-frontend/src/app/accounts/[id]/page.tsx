'use client';

import { useQuery } from '@tanstack/react-query';
import { accountGetById, accountGetCustomAnalytics } from '@/lib/endpoints/accounts';
import { useRouter } from 'next/navigation';
import { transactionGetAll, transactionGetIncomeExpenseChart } from '@/lib/endpoints/transactions';
import { categoryGetAll } from '@/lib/endpoints/category';
import { format } from 'date-fns';
import { use, useMemo } from 'react';
import { useDebounce } from 'use-debounce';

// Components
import TransactionTable from '@/components/transactions-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import DateRangePicker from '@/components/date-range-picker';
import { AccountHeader, AnalyticsCards, IncomeExpenseChart } from '@/components/account';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';

// Custom hooks
import { useToast } from '@/lib/hooks/useToast';
import { usePagination } from '@/hooks/usePagination';
import { useFilterState } from '@/hooks/useFilterState';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    q?: string;
    page?: string;
    sortBy?: string;
    sortOrder?: string;
    categoryId?: string;
    isIncome?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
}

const AccountDetailsPage = ({ params, searchParams }: PageProps) => {
  const unwrappedParams = use(params);
  const unwrappedSearchParams = use(searchParams);
  const { id } = unwrappedParams;
  const router = useRouter();
  const { showError } = useToast();

  // Custom hooks for state management
  const {
    filters,
    setSearchQuery,
    handleCategoryChange,
    handleIncomeTypeChange,
    handleDateRangeSelect,
    applyDateRange,
    handleClearDateRange,
    handleSort,
    updateURL
  } = useFilterState(unwrappedSearchParams, router, id);

  const { page, handlePageChange } = usePagination(
    Number(unwrappedSearchParams.page) || 1,
    updateURL
  );

  // Debounced search
  const [debouncedSearch] = useDebounce(filters.searchQuery, 300);

  // Queries
  const { data: account, isLoading: isAccountLoading } = useQuery({
    queryKey: ['account', id],
    queryFn: () => accountGetById(id),
    retry: false
  });

  const { data: customAnalytics, isLoading: isAnalyticsLoading } = useQuery({
    queryKey: ['customAnalytics', id, filters.dateRange],
    queryFn: () =>
      accountGetCustomAnalytics(id, {
        duration:
          filters.dateRange?.from && filters.dateRange.to
            ? `${format(filters.dateRange.from, 'yyyy-MM-dd')},${format(filters.dateRange.to, 'yyyy-MM-dd')}`
            : 'thisMonth'
      }),
    enabled: !!id
  });

  const { data: chartData, isLoading: isChartLoading } = useQuery({
    queryKey: ['incomeExpenseChart', id, filters.dateRange],
    queryFn: () =>
      transactionGetIncomeExpenseChart({
        accountId: id,
        duration:
          filters.dateRange?.from && filters.dateRange.to
            ? `${format(filters.dateRange.from, 'yyyy-MM-dd')},${format(filters.dateRange.to, 'yyyy-MM-dd')}`
            : 'thisMonth'
      }),
    enabled: !!id
  });

  const {
    data: transactionsData,
    isLoading: isTransactionLoading,
    refetch: refetchTransactions
  } = useQuery({
    queryKey: [
      'accountTransactions',
      id,
      {
        dateRange: filters.dateRange,
        page,
        q: debouncedSearch,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        categoryId: filters.categoryId,
        isIncome: filters.isIncome
      }
    ],
    queryFn: () =>
      transactionGetAll({
        accountId: id,
        duration:
          filters.dateRange?.from && filters.dateRange.to
            ? `${format(filters.dateRange.from, 'yyyy-MM-dd')},${format(filters.dateRange.to, 'yyyy-MM-dd')}`
            : '',
        page,
        pageSize: 10,
        q: debouncedSearch,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        categoryId: filters.categoryId === 'all' ? '' : filters.categoryId,
        isIncome: filters.isIncome
      })
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryGetAll
  });

  // Memoized transformations
  const transformedChartData = useMemo(() => {
    if (!chartData?.date) return [];

    return chartData.date.map((date: string, i: number) => ({
      date,
      income: chartData.income?.[i],
      expense: chartData.expense?.[i],
      balance: chartData.balance?.[i]
    }));
  }, [chartData]);

  const selectedDateRangeLabel = useMemo(() => {
    if (!filters.dateRange?.from || !filters.dateRange.to) return 'This Month';
    return `${format(filters.dateRange.from, 'MMM dd, yyyy')} - ${format(filters.dateRange.to, 'MMM dd, yyyy')}`;
  }, [filters.dateRange]);

  // Error handling
  if (!id) {
    showError('Account ID is required');
    return <div className='p-4'>Invalid account ID</div>;
  }

  return (
    <div className='min-h-screen'>
      <AccountHeader account={account} isLoading={isAccountLoading} router={router} />

      <div className='mx-auto max-w-7xl space-y-6 p-4'>
        <AnalyticsCards analytics={customAnalytics} isLoading={isAnalyticsLoading} />

        {/* Income vs Expense Chart */}
        <section className='rounded-xl bg-white shadow-sm'>
          <div className='border-b p-6'>
            <h2 className='text-xl font-semibold'>Income vs Expense</h2>
          </div>
          <div className='p-6'>
            <IncomeExpenseChart data={transformedChartData} isLoading={isChartLoading} />
          </div>
        </section>

        {/* Transactions Section */}
        <section className='rounded-xl bg-white shadow-sm'>
          <div className='flex items-center justify-between border-b p-6'>
            <h2 className='text-xl font-semibold'>Transactions</h2>
            <span className='text-sm text-gray-500'>{selectedDateRangeLabel}</span>
          </div>

          <div className='p-6'>
            {/* Filters */}
            <div className='mb-4 grid gap-4'>
              {/* First Row: Full-width Search Bar */}
              <div className='col-span-4'>
                <Input
                  type='text'
                  placeholder='Search transactions...'
                  value={filters.searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className='w-full rounded-md border border-gray-300 p-2'
                />
              </div>

              {/* Second Row: Responsive 4 Columns */}
              <div className='col-span-4 grid grid-cols-1 gap-4 sm:grid-cols-4'>
                {/* Category Filter */}
                <div>
                  <Select value={filters.categoryId || 'all'} onValueChange={handleCategoryChange}>
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder='Select Category' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>All Categories</SelectItem>
                      {categories?.categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Type Filter */}
                <div>
                  <Select
                    value={filters.isIncome === undefined ? 'all' : String(filters.isIncome)}
                    onValueChange={handleIncomeTypeChange}
                  >
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder='Select Type' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>All Types</SelectItem>
                      <SelectItem value='income'>Income</SelectItem>
                      <SelectItem value='expense'>Expense</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Date Range Filter */}
                <div>
                  <DateRangePicker
                    dateRange={filters.tempDateRange}
                    setDateRange={handleDateRangeSelect}
                  />
                </div>

                {/* Apply & Clear Buttons */}
                <div className='flex w-fit justify-end gap-2 sm:justify-start'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={applyDateRange}
                    disabled={!filters.tempDateRange?.from || !filters.tempDateRange?.to}
                  >
                    Apply
                  </Button>
                  {filters.dateRange?.from && (
                    <Button variant='ghost' size='sm' onClick={handleClearDateRange}>
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Transactions Table */}
            {isTransactionLoading ? (
              <div className='space-y-4'>
                {Array(3)
                  .fill(0)
                  .map((_, i) => (
                    <Skeleton key={i} className='h-16' />
                  ))}
              </div>
            ) : !transactionsData?.transactions?.length ? (
              <div className='py-8 text-center text-gray-500'>
                No transactions found for the selected filters.
              </div>
            ) : (
              <>
                <TransactionTable
                  transactions={transactionsData.transactions}
                  onUpdate={refetchTransactions}
                  onSort={handleSort}
                  sortBy={filters.sortBy}
                  sortOrder={filters.sortOrder}
                />

                {transactionsData.totalPages > 1 && (
                  <Pagination className='mt-6'>
                    <PaginationContent>
                      {page > 1 && (
                        <PaginationItem>
                          <PaginationPrevious href='#' onClick={() => handlePageChange(page - 1)} />
                        </PaginationItem>
                      )}

                      {Array.from({ length: transactionsData.totalPages }, (_, i) => i + 1)
                        .filter(
                          (p) =>
                            p <= 2 ||
                            p >= transactionsData.totalPages - 1 ||
                            Math.abs(p - page) <= 1
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

                      {page < transactionsData.totalPages && (
                        <PaginationItem>
                          <PaginationNext href='#' onClick={() => handlePageChange(page + 1)} />
                        </PaginationItem>
                      )}
                    </PaginationContent>
                  </Pagination>
                )}
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AccountDetailsPage;
