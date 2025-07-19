'use client';

import { useQuery } from '@tanstack/react-query';
import { goalGetAll } from '@/lib/endpoints/goal';
import { useState } from 'react';
import Loader from '@/components/ui/loader';
import CommonTable from '@/components/ui/CommonTable';
import { createGoalColumns } from '@/components/goal/goal-columns';
import { usePagination } from '@/hooks/usePagination';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useToast } from '@/lib/hooks/useToast';
import AddGoalModal from '@/components/modals/add-goal-modal';
import { Button } from '@/components/ui/button';
import { PlusCircle, Search } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { useDebounce } from 'use-debounce';

const GoalPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { showError } = useToast();
  const { user } = useAuth();

  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebounce(search, 600);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState<string | undefined>(searchParams.get('sortBy') || undefined);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | undefined>(
    (searchParams.get('sortOrder') as 'asc' | 'desc') || undefined
  );

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
      if (sortBy) currentParams.set('sortBy', sortBy);
      else currentParams.delete('sortBy');
      if (sortOrder) currentParams.set('sortOrder', sortOrder);
      else currentParams.delete('sortOrder');

      const newUrl = `${pathname}?${currentParams.toString()}`;
      router.push(newUrl, { scroll: false });
    }
  );

  const {
    data: goals,
    isLoading,
    isPending,
    error,
    refetch
  } = useQuery({
    queryKey: ['goals', page, sortBy, sortOrder, debouncedSearch],
    queryFn: () => goalGetAll({ page, limit: 10, sortBy, sortOrder, q: debouncedSearch }),
    retry: false,
    enabled: !!user
  });

  const handleSortChange = (sorting: any) => {
    if (sorting.length > 0) {
      setSortBy(sorting[0].id);
      setSortOrder(sorting[0].desc ? 'desc' : 'asc');
    } else {
      setSortBy(undefined);
      setSortOrder(undefined);
    }
  };

  const goalColumns = createGoalColumns({ user, refetchGoals: refetch });

  if ((isLoading && !isPending) || !user) {
    return <Loader />;
  }

  if (error) {
    showError(`Failed to get Goal Details : ${(error as Error).message}`);
    return null;
  }

  return (
    <div className='mx-auto w-full max-w-7xl space-y-4 p-3 pt-4 md:space-y-6'>
      <div className='flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center'>
        <h1 className='text-2xl font-semibold md:text-3xl'>Goals</h1>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <PlusCircle className='mr-2 h-4 w-4' /> Add Goal
        </Button>
      </div>

      <div className='relative flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4'>
        <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
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
        currentPage={page}
        onPageChange={handlePageChange}
        enablePagination
        sortBy={sortBy}
        sortOrder={sortOrder}
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
