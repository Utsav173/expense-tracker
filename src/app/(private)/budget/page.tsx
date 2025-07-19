'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { budgetGetAll } from '@/lib/endpoints/budget';
import CommonTable from '@/components/ui/CommonTable';
import { budgetColumns } from '@/components/budget/budget-columns';
import AddBudgetModal from '@/components/modals/add-budget-modal';
import Loader from '@/components/ui/loader';
import { useToast } from '@/lib/hooks/useToast';
import { Button } from '@/components/ui/button';
import { PlusCircle, Search } from 'lucide-react';
import { useInvalidateQueries } from '@/hooks/useInvalidateQueries';
import { Budget } from '@/lib/types';
import { useUrlState } from '@/hooks/useUrlState';
import { SortingState } from '@tanstack/react-table';
import { Input } from '@/components/ui/input';
import { useDebounce } from 'use-debounce';

const BudgetPage = () => {
  const { showError } = useToast();
  const invalidate = useInvalidateQueries();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebounce(search, 600);

  const { state, setState, handlePageChange } = useUrlState({
    page: 1,
    sortBy: 'year',
    sortOrder: 'desc' as 'asc' | 'desc'
  });

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['budgets', debouncedSearch, state.page, state.sortBy, state.sortOrder],
    queryFn: () =>
      budgetGetAll('all', {
        page: state.page,
        limit: 10,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder,
        q: debouncedSearch
      }),
    retry: false
  });

  const handleBudgetAdded = () => {
    invalidate(['budgets', state.page, state.sortBy, state.sortOrder]);
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

  if (isLoading) {
    return <Loader />;
  }

  if (isError) {
    showError(`Failed to get Budgets Details : ${(error as Error).message}`);
    return null;
  }

  return (
    <div className='mx-auto w-full max-w-7xl space-y-4 p-3 pt-4 md:space-y-6'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <h1 className='text-3xl font-semibold'>Budgets</h1>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <PlusCircle className='mr-2 h-4 w-4' /> Add Budget
        </Button>
      </div>

      <div className='relative flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4'>
        <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
        <Input
          type='text'
          placeholder='Search Budgets...'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className='max-w-full grow pl-9'
        />
      </div>

      <CommonTable<Budget>
        tableId='budgets-table'
        data={data?.data || []}
        columns={budgetColumns}
        loading={isLoading}
        totalRecords={data?.pagination.total || 0}
        pageSize={10}
        currentPage={state.page}
        onPageChange={handlePageChange}
        onSortChange={handleSort}
        enablePagination
        sortBy={state.sortBy}
        sortOrder={state.sortOrder}
      />

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
