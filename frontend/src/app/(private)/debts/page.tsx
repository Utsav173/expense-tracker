'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetchDebts } from '@/lib/endpoints/debt';
import { useState, useEffect, useCallback } from 'react';
import Loader from '@/components/ui/loader';
import CommonTable from '@/components/ui/CommonTable';
import { useToast } from '@/lib/hooks/useToast';
import { Input } from '@/components/ui/input';
import { useDebounce } from 'use-debounce';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { debtColumns } from '@/components/debt/debt-columns';
import AddDebtModal from '@/components/modals/add-debt-modal';
import { useInvalidateQueries } from '@/hooks/useInvalidateQueries';
import { DebtWithDetails } from '@/lib/types';
import { useUrlState } from '@/hooks/useUrlState';
import { SortingState } from '@tanstack/react-table'; // Import SortingState

type DebtTypeFilter = '' | 'given' | 'taken' | 'all' | undefined;

const DebtsPage = () => {
  const { showError } = useToast();
  const invalidate = useInvalidateQueries();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const { state, setState, handlePageChange } = useUrlState<{
    page: number;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
    type: DebtTypeFilter;
    q: string;
  }>({
    page: 1,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    type: 'all',
    q: ''
  });

  const [search, setSearch] = useState(state.q); // Initialize search with state.q
  const [debouncedSearch] = useDebounce(search, 600);

  // Update local search when state.q changes (e.g., from URL)
  useEffect(() => {
    if (state.q !== search) {
      setSearch(state.q);
    }
  }, [state.q]); // Removed dependency on 'search' to avoid loop

  // Update state when debounced search changes
  useEffect(() => {
    if (debouncedSearch !== state.q) {
      setState({ q: debouncedSearch, page: 1 });
    }
  }, [debouncedSearch, state.q, setState]);

  const {
    data: debtsData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['debts', state.page, state.sortBy, state.sortOrder, state.type, state.q],
    queryFn: () =>
      apiFetchDebts({
        page: state.page,
        pageSize: 10,
        q: state.q, // Use state.q for the query
        type: state.type === 'all' ? undefined : state.type,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder
      }),
    retry: false
  });

  const handleDebtAdded = () => {
    invalidate(['debts', state.page, state.sortBy, state.sortOrder, state.type, state.q]);
    invalidate(['outstandingDebtsDashboard']);
    refetch();
  };

  // Updated handleSort to match CommonTable's expected signature
  const handleSort = useCallback(
    (newSortingState: SortingState) => {
      if (newSortingState.length > 0) {
        const { id, desc } = newSortingState[0];
        setState({ sortBy: id, sortOrder: desc ? 'desc' : 'asc', page: 1 });
      } else {
        setState({ sortBy: 'createdAt', sortOrder: 'desc', page: 1 }); // Revert to default or clear
      }
    },
    [setState]
  );

  // Updated handleTypeChange to accept string and cast
  const handleTypeChange = useCallback(
    (value: string) => {
      const newType = value as DebtTypeFilter;
      setState({ type: newType, page: 1 });
    },
    [setState]
  );

  if (isLoading) {
    return <Loader />;
  }

  if (error) {
    showError(`Failed to get Debts Details : ${(error as Error).message}`);
    return null;
  }

  return (
    <div className='mx-auto w-full max-w-7xl space-y-4 p-3 pt-4 md:space-y-6'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <h1 className='text-3xl font-semibold'>Debts</h1>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <PlusCircle className='mr-2 h-4 w-4' /> Add Debt
        </Button>
      </div>

      <div className='flex flex-col gap-4 sm:flex-row'>
        <Input
          type='text'
          placeholder='Search debts by description...'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className='max-w-sm'
        />

        <Select onValueChange={handleTypeChange} value={state.type || 'all'}>
          <SelectTrigger className='w-full sm:w-[180px]'>
            <SelectValue placeholder='Select Type' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Types</SelectItem>
            <SelectItem value='given'>Given (Loaned Out)</SelectItem>
            <SelectItem value='taken'>Taken (Borrowed)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <CommonTable<DebtWithDetails>
        data={debtsData?.data || []}
        columns={debtColumns}
        loading={isLoading}
        totalRecords={debtsData?.totalCount || 0}
        pageSize={10}
        currentPage={state.page}
        onPageChange={handlePageChange}
        onSortChange={handleSort} // Pass the correctly typed handler
        enablePagination
        sortBy={state.sortBy}
        sortOrder={state.sortOrder} // Pass typed sortOrder
        mobileTriggerColumns={['debts.description', 'debts.amount']}
      />

      <AddDebtModal
        isOpen={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onDebtAdded={handleDebtAdded}
        hideTriggerButton
      />
    </div>
  );
};

export default DebtsPage;
