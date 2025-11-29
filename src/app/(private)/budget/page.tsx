'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { budgetGetAll } from '@/lib/endpoints/budget';
import CommonTable from '@/components/ui/CommonTable';
import { budgetColumns } from '@/components/budget/budget-columns';
import AddBudgetModal from '@/components/modals/add-budget-modal';
import { Button } from '@/components/ui/button';
import { useInvalidateQueries } from '@/hooks/useInvalidateQueries';
import type { BudgetAPI } from '@/lib/api/api-types';
import { useUrlState } from '@/hooks/useUrlState';
import { SortingState } from '@tanstack/react-table';
import { Input } from '@/components/ui/input';
import QueryErrorDisplay from '@/components/ui/query-error-display';
import { Icon } from '@/components/ui/icon';
import BudgetOverview from '@/components/budget/budget-overview';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

import { subMonths } from 'date-fns';

const initialUrlState = {
  page: 1,
  sortBy: 'year',
  sortOrder: 'desc' as 'asc' | 'desc',
  q: ''
};

const BudgetPage = () => {
  const invalidate = useInvalidateQueries();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [period, setPeriod] = useState<string>('thisMonth');

  const { state, setState, handlePageChange, searchQuery, setSearchQuery } =
    useUrlState(initialUrlState);

  const { data, isError, error, refetch, isPending } = useQuery({
    queryKey: ['budgets', state.q, state.page, state.sortBy, state.sortOrder],
    queryFn: () =>
      budgetGetAll({
        page: state.page,
        limit: 10,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder,
        q: state.q
      }),
    retry: false
  });

  const handleBudgetAdded = () => {
    invalidate(['budgets', state.page, state.sortBy, state.sortOrder]);
    invalidate(['budget-summary', selectedMonth, selectedYear]);
    refetch();
  };

  const handleSort = (newSortingState: SortingState) => {
    if (newSortingState.length > 0) {
      const { id, desc } = newSortingState[0];
      setState({ sortBy: id, sortOrder: desc ? 'desc' : 'asc', page: 1 });
    } else {
      setState({ sortBy: 'year', sortOrder: 'desc', page: 1 });
    }
  };

  if (isError) {
    return <QueryErrorDisplay error={error} message="We couldn't load your budget data." />;
  }

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];

  const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - 2 + i);

  return (
    <div className='mx-auto w-full max-w-7xl space-y-8 p-3 pt-4 md:space-y-8'>
      {/* Header Section */}
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Budgets</h1>
          <p className='text-muted-foreground mt-1 text-sm'>
            Manage your spending limits and track your progress.
          </p>
        </div>
        <div className='flex flex-col gap-2 sm:flex-row sm:items-center'>
          <div className='flex flex-wrap gap-2'>
            <Select
              value={period}
              onValueChange={(val) => {
                setPeriod(val);
                if (val === 'thisMonth') {
                  setSelectedMonth(currentDate.getMonth() + 1);
                  setSelectedYear(currentDate.getFullYear());
                } else if (val === 'lastMonth') {
                  const lastMonth = subMonths(currentDate, 1);
                  setSelectedMonth(lastMonth.getMonth() + 1);
                  setSelectedYear(lastMonth.getFullYear());
                } else if (val === 'thisYear') {
                  setSelectedMonth(1); // Set to January as default when switching back to custom
                  setSelectedYear(currentDate.getFullYear());
                } else if (val === 'custom') {
                  // Reset to current month/year when switching to custom
                  setSelectedMonth(currentDate.getMonth() + 1);
                  setSelectedYear(currentDate.getFullYear());
                }
              }}
            >
              <SelectTrigger className='w-[140px]'>
                <SelectValue placeholder='Period' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='thisMonth'>This Month</SelectItem>
                <SelectItem value='lastMonth'>Last Month</SelectItem>
                <SelectItem value='thisYear'>This Year</SelectItem>
                <SelectItem value='custom'>Custom Month</SelectItem>
              </SelectContent>
            </Select>

            {period === 'custom' && (
              <>
                <Select
                  value={selectedMonth.toString()}
                  onValueChange={(val) => setSelectedMonth(Number(val))}
                >
                  <SelectTrigger className='w-[120px]'>
                    <SelectValue placeholder='Month' />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((m) => (
                      <SelectItem key={m.value} value={m.value.toString()}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={selectedYear.toString()}
                  onValueChange={(val) => setSelectedYear(Number(val))}
                >
                  <SelectTrigger className='w-[100px]'>
                    <SelectValue placeholder='Year' />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((y) => (
                      <SelectItem key={y} value={y.toString()}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}
          </div>

          <Button
            variant='planning'
            className='w-full sm:w-auto'
            onClick={() => setIsAddModalOpen(true)}
          >
            <Icon name='plus' className='mr-2 h-4 w-4' /> Add Budget
          </Button>
        </div>
      </div>

      {/* Overview Section */}
      <BudgetOverview month={selectedMonth} year={selectedYear} period={period} />

      {/* List Section */}
      <div className='space-y-4'>
        <div className='flex items-center justify-between'>
          <h2 className='text-xl font-semibold tracking-tight'>All Budgets</h2>
          <div className='relative w-full max-w-xs'>
            <Icon
              name='search'
              className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2'
            />
            <Input
              type='text'
              placeholder='Search categories...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='pl-9'
            />
          </div>
        </div>

        <CommonTable<BudgetAPI.Budget>
          tableId='budgets-table'
          data={data?.data || []}
          columns={budgetColumns}
          loading={isPending}
          totalRecords={data?.pagination.total || 0}
          pageSize={10}
          currentPage={state.page}
          onPageChange={handlePageChange}
          onSortChange={handleSort}
          enablePagination
          sortBy={state.sortBy}
          sortOrder={state.sortOrder}
        />
      </div>

      <AddBudgetModal
        isOpen={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onBudgetAdded={handleBudgetAdded}
        hideTriggerButton
      />
    </div>
  );
};

export default BudgetPage;
