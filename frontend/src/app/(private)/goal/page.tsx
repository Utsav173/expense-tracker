'use client';

import { useQuery } from '@tanstack/react-query';
import { goalGetAll } from '@/lib/endpoints/goal';
import { useState, useEffect } from 'react';
import Loader from '@/components/ui/loader';
import CommonTable from '@/components/ui/CommonTable';
import { createGoalColumns } from '@/components/goal/goal-columns';
import { usePagination } from '@/hooks/usePagination';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useToast } from '@/lib/hooks/useToast';
import AddGoalModal from '@/components/modals/add-goal-modal';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const GoalPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { showError } = useToast();
  const { user } = useAuth();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

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

  const {
    data: goals,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['goals', page],
    queryFn: () => goalGetAll({ page, limit: 10 }),
    retry: false,
    enabled: !!user
  });

  const goalColumns = createGoalColumns({ user, refetchGoals: refetch });

  if (isLoading || !user) {
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
        <Button onClick={() => setIsAddModalOpen(true)} size='sm'>
          <PlusCircle className='mr-2 h-4 w-4' /> Add Goal
        </Button>
      </div>

      <CommonTable
        data={goals?.data || []}
        columns={goalColumns}
        loading={isLoading}
        totalRecords={goals?.pagination?.total || 0}
        pageSize={10}
        currentPage={page}
        onPageChange={handlePageChange}
        enablePagination
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
