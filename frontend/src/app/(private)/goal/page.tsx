'use client';

import { useQuery } from '@tanstack/react-query';
import { goalGetAll } from '@/lib/endpoints/goal';
import { useState } from 'react';
import Loader from '@/components/ui/loader';
import CommonTable from '@/components/ui/CommonTable';
import { goalColumns } from '@/components/goal/goal-columns';
import { useToast } from '@/lib/hooks/useToast';
import AddGoalModal from '@/components/modals/add-goal-modal';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useInvalidateQueries } from '@/hooks/useInvalidateQueries';
import { SavingGoal } from '@/lib/types';
import { useUrlState } from '@/hooks/useUrlState';
import { SortingState } from '@tanstack/react-table';

const GoalPage = () => {
  const { showError } = useToast();
  const invalidate = useInvalidateQueries();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const { state, setState, handlePageChange } = useUrlState({
    page: 1,
    sortBy: 'targetDate',
    sortOrder: 'asc' as 'asc' | 'desc'
  });

  const {
    data: goals,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['goals', state.page, state.sortBy, state.sortOrder],
    queryFn: () =>
      goalGetAll({
        page: state.page,
        limit: 10,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder
      }),
    retry: false
  });

  const handleGoalAdded = () => {
    invalidate(['goals', state.page, state.sortBy, state.sortOrder]);
    refetch();
  };

  const handleSort = (newSortingState: SortingState) => {
    if (newSortingState.length > 0) {
      const { id, desc } = newSortingState[0];
      setState({ sortBy: id, sortOrder: desc ? 'desc' : 'asc', page: 1 });
    } else {
      setState({ sortBy: 'targetDate', sortOrder: 'asc', page: 1 });
    }
  };

  if (isLoading) {
    return <Loader />;
  }

  if (error) {
    showError(`Failed to get Goal Details : ${(error as Error).message}`);
    return null;
  }

  return (
    <div className='mx-auto w-full max-w-7xl space-y-4 p-3 pt-4 md:space-y-6'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <h1 className='text-3xl font-semibold'>Goals</h1>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <PlusCircle className='mr-2 h-4 w-4' /> Add Goal
        </Button>
      </div>
      <CommonTable<SavingGoal>
        data={goals?.data || []}
        columns={goalColumns}
        loading={isLoading}
        totalRecords={goals?.pagination?.total || 0}
        pageSize={10}
        currentPage={state.page}
        onPageChange={handlePageChange}
        onSortChange={handleSort}
        enablePagination
        sortBy={state.sortBy}
        sortOrder={state.sortOrder}
        mobileTriggerColumns={['name', 'progress']}
      />
      <AddGoalModal
        isOpen={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onGoalAdded={handleGoalAdded}
        hideTriggerButton
      />
    </div>
  );
};

export default GoalPage;
