'use client';

import { useQuery } from '@tanstack/react-query';
import { goalGetAll } from '@/lib/endpoints/goal';
import { useState } from 'react';
import Loader from '@/components/ui/loader';
import CommonTable from '@/components/ui/CommonTable';
import { goalColumns } from '@/components/goal/goal-columns';
import { usePagination } from '@/hooks/usePagination';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useToast } from '@/lib/hooks/useToast';
import AddGoalModal from '@/components/modals/add-goal-modal';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

const GoalPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { showError } = useToast();

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
      router.push(newUrl, { scroll: true });
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
    retry: false
  });

  if (isLoading) {
    return <Loader />;
  }

  if (error) {
    showError(`Failed to get Goal Details : ${(error as Error).message}`);
    return null;
  }

  return (
    <div className='container space-y-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-3xl font-semibold'>Goals</h1>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <PlusCircle className='mr-2 h-4 w-4' /> Add Goal
        </Button>
      </div>
      <CommonTable
        data={goals?.data || []}
        columns={goalColumns} // Now correctly used
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
      />
    </div>
  );
};

export default GoalPage;
