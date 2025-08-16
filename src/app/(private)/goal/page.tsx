'use client';

import { useQuery } from '@tanstack/react-query';
import { goalGetAll } from '@/lib/endpoints/goal';
import { useState, useEffect } from 'react';
import Loader from '@/components/ui/loader';
import CommonTable from '@/components/ui/CommonTable';
import { createGoalColumns } from '@/components/goal/goal-columns';
import { useUrlState } from '@/hooks/useUrlState';
import AddGoalModal from '@/components/modals/add-goal-modal';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/providers/auth-provider';
import { Input } from '@/components/ui/input';
import { useDebounce } from 'use-debounce';
import QueryErrorDisplay from '@/components/ui/query-error-display';
import { Icon } from '@/components/ui/icon';
import { SortingState } from '@tanstack/react-table';

const initialUrlState = {
  page: 1,
  sortBy: 'createdAt',
  sortOrder: 'desc' as 'asc' | 'desc',
  q: ''
};

const GoalPage = () => {
  const { session, isLoading: userIsLoading } = useAuth();
  const user = session?.user;

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const { state, setState, handlePageChange } = useUrlState(initialUrlState);

  const [search, setSearch] = useState(state.q);
  const [debouncedSearch] = useDebounce(search, 600);

  useEffect(() => {
    setState({ q: debouncedSearch, page: 1 });
  }, [debouncedSearch, setState]);

  const {
    data: goals,
    isLoading,
    isPending,
    error,
    refetch
  } = useQuery({
    queryKey: ['goals', state.page, state.sortBy, state.sortOrder, debouncedSearch],
    queryFn: () =>
      goalGetAll({
        page: state.page,
        limit: 10,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder,
        q: debouncedSearch
      }),
    retry: false,
    enabled: !!user
  });

  const handleSortChange = (sorting: SortingState) => {
    if (sorting.length > 0) {
      const { id, desc } = sorting[0];
      setState({ sortBy: id, sortOrder: desc ? 'desc' : 'asc' });
    } else {
      setState({ sortBy: 'createdAt', sortOrder: 'desc' });
    }
  };

  const goalColumns = createGoalColumns({ user, refetchGoals: refetch });

  if ((isLoading && !isPending) || userIsLoading || !user) {
    return <Loader />;
  }

  if (error) {
    return <QueryErrorDisplay error={error} message="We couldn't load your goal data." />;
  }

  return (
    <div className='mx-auto w-full max-w-7xl space-y-4 p-3 pt-4 md:space-y-6'>
      <div className='flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center'>
        <h1 className='text-2xl font-semibold md:text-3xl'>Goals</h1>
        <Button
          variant='planning'
          className='h-10 px-4 py-2'
          onClick={() => setIsAddModalOpen(true)}
        >
          <Icon name='piggyBank' className='mr-2 h-4 w-4' /> Add Goal
        </Button>
      </div>

      <div className='relative flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4'>
        <Icon
          name='search'
          className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2'
        />
        <Input
          type='text'
          placeholder='Search Goals...'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className='max-w-full grow pl-9'
        />
      </div>

      <CommonTable
        tableId='goals-table'
        data={goals?.data || []}
        columns={goalColumns}
        loading={isLoading}
        totalRecords={goals?.pagination?.total || 0}
        pageSize={10}
        currentPage={state.page}
        onPageChange={handlePageChange}
        enablePagination
        sortBy={state.sortBy}
        sortOrder={state.sortOrder}
        onSortChange={handleSortChange}
      />

      <AddGoalModal
        isOpen={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onGoalAdded={refetch}
        hideTriggerButton
      />
    </div>
  );
};

export default GoalPage;
