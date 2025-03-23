'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { budgetGetAll } from '@/lib/endpoints/budget';
import { usePagination } from '@/hooks/usePagination';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import CommonTable from '@/components/ui/CommonTable';
import { budgetColumns } from '@/components/budget/budget-columns';
import AddBudgetModal from '@/components/modals/add-budget-modal';
import Loader from '@/components/ui/loader';
import { useToast } from '@/lib/hooks/useToast';
import { Input } from '@/components/ui/input';
import { useDebounce } from 'use-debounce';
import { DateRange } from 'react-day-picker';
import DateRangePicker from '@/components/date-range-picker';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

const BudgetPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { showError } = useToast();

  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebounce(search, 600);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [tempDateRange, setTempDateRange] = useState<DateRange | undefined>();

  const { page, handlePageChange } = usePagination(
    Number(searchParams.get('page')) || 1,
    (params) => {
      const currentParams = new URLSearchParams(searchParams.toString());
      Object.keys(params).forEach((key) => {
        if (params[key] === undefined || params[key] === null || params[key] === '') {
          currentParams.delete(key);
        } else {
          currentParams.set(key.toString(), params[key]);
        }
      });
      const newUrl = `${pathname}?${currentParams.toString()}`;
      router.push(newUrl, { scroll: false });
    }
  );

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

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['budgets', page, debouncedSearch, dateRange], // Include dateRange in queryKey
    queryFn: () =>
      budgetGetAll('all', {
        page,
        limit: 10,
        search: debouncedSearch,
        duration:
          dateRange?.from && dateRange.to
            ? `${format(dateRange.from, 'yyyy-MM-dd')},${format(dateRange.to, 'yyyy-MM-dd')}`
            : ''
      }),
    retry: false
  });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const handleBudgetAdded = () => {
    refetch();
  };

  useEffect(() => {
    handlePageChange(1);
  }, [debouncedSearch]);

  if (isLoading) {
    return <Loader />;
  }

  if (isError) {
    showError(`Failed to get Budgets Details : ${(error as Error).message}`);
    return null;
  }

  return (
    <div className='mx-auto w-full max-w-7xl space-y-4 p-3 md:space-y-6'>
      <div className='flex items-center justify-between gap-4'>
        <h1 className='text-3xl font-semibold'>Budgets</h1>
        <AddBudgetModal
          onBudgetAdded={handleBudgetAdded}
          isOpen={isAddModalOpen}
          onOpenChange={() => setIsAddModalOpen(!isAddModalOpen)}
        />
      </div>
      <div className='flex gap-x-2'>
        <Input
          type='text'
          placeholder='Search by category name...'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className='max-w-sm'
        />
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
      <CommonTable
        data={data?.data || []}
        columns={budgetColumns}
        loading={isLoading}
        totalRecords={data?.pagination.total || 0}
        pageSize={10}
        currentPage={page}
        onPageChange={handlePageChange}
        enablePagination
      />
    </div>
  );
};

export default BudgetPage;
