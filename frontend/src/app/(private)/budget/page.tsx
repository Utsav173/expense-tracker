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
import { PlusCircle } from 'lucide-react';
import { useInvalidateQueries } from '@/hooks/useInvalidateQueries';
import { Budget } from '@/lib/types';
import { useUrlState } from '@/hooks/useUrlState';
import { SortingState } from '@tanstack/react-table';

const BudgetPage = () => {
  const { showError } = useToast();
  const invalidate = useInvalidateQueries();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const { state, setState, handlePageChange } = useUrlState({
    page: 1,
    sortBy: 'year',
    sortOrder: 'desc' as 'asc' | 'desc'
  });

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['budgets', state.page, state.sortBy, state.sortOrder],
    queryFn: () =>
      budgetGetAll('all', {
        page: state.page,
        limit: 10,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder
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
