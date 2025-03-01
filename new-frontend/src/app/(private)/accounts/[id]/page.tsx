'use client';

import { useQuery } from '@tanstack/react-query';
import { accountGetById, accountGetCustomAnalytics } from '@/lib/endpoints/accounts';
import { useRouter } from 'next/navigation';
import { transactionGetAll, transactionGetIncomeExpenseChart } from '@/lib/endpoints/transactions';
import { categoryGetAll } from '@/lib/endpoints/category';
import { format, startOfWeek, startOfMonth } from 'date-fns';
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
import { AnalyticsCards, IncomeExpenseChart } from '@/components/account';
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
import { useAccountFilterState } from '@/components/account/hooks/useAccountFilterState';

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
  } = useAccountFilterState(unwrappedSearchParams, router, id);

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
            : 'thisMonth',
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

  // Preset date range handler
  const handlePreset = (preset: string) => {
    let from, to;
    const today = new Date();
    switch (preset) {
      case 'today':
        from = today;
        to = today;
        break;
      case 'thisWeek':
        from = startOfWeek(today);
        to = today;
        break;
      case 'thisMonth':
        from = startOfMonth(today);
        to = today;
        break;
      default:
        return;
    }
    handleDateRangeSelect({ from, to });
    applyDateRange();
  };

  // Reset filters handler
  const handleResetFilters = () => {
    setSearchQuery('');
    handleCategoryChange('all');
    handleIncomeTypeChange('all');
    handleClearDateRange();
    handleSort('date');
    updateURL({});
  };

  // Error handling
  if (!id) {
    showError('Account ID is required');
    return <div className='p-4'>Invalid account ID</div>;
  }

  return (
    <div className='min-h-screen'>
      <div className='mx-auto max-w-7xl space-y-6 p-4'>
        {/* Analytics Cards */}
        <AnalyticsCards
          analytics={customAnalytics}
          isLoading={isAnalyticsLoading}
          account={account}
        />

        {/* Income vs Expense Chart */}
        <section className='rounded-xl bg-white shadow-sm'>
          <IncomeExpenseChart data={transformedChartData} isLoading={isChartLoading} />
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
              {/* Search Bar */}
              <div className='col-span-4'>
                <Input
                  type='text'
                  placeholder='Search transactions...'
                  value={filters.searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className='w-full rounded-md border border-gray-300 p-2'
                />
              </div>

              {/* Filter Controls */}
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

                {/* Date Range Filter with Presets */}
                <div>
                  <DateRangePicker
                    dateRange={filters.tempDateRange}
                    setDateRange={handleDateRangeSelect}
                  />
                  <div className='mt-2 flex flex-wrap gap-2'>
                    <Button variant='outline' size='sm' onClick={() => handlePreset('today')}>
                      Today
                    </Button>
                    <Button variant='outline' size='sm' onClick={() => handlePreset('thisWeek')}>
                      This Week
                    </Button>
                    <Button variant='outline' size='sm' onClick={() => handlePreset('thisMonth')}>
                      This Month
                    </Button>
                  </div>
                </div>

                {/* Action Buttons */}
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
                  <Button variant='outline' size='sm' onClick={handleResetFilters}>
                    Reset Filters
                  </Button>
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
