'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { budgetGetAll } from '@/lib/endpoints/budget';
import { usePagination } from '@/hooks/usePagination';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import CommonTable from '@/components/ui/CommonTable';
import { budgetColumns } from '@/components/budget/budget-columns';
import AddBudgetModal from '@/components/modals/add-budget-modal';
import Loader from '@/components/ui/loader';
import { useToast } from '@/lib/hooks/useToast';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useInvalidateQueries } from '@/hooks/useInvalidateQueries';

const BudgetPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { showError } = useToast();
  const invalidate = useInvalidateQueries();

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

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['budgets', page],
    queryFn: () => budgetGetAll('all', { page, limit: 10 }),
    retry: false
  });

  const handleBudgetAdded = () => {
    invalidate(['budgets', page]);
    refetch();
  };

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
        <Button onClick={() => setIsAddModalOpen(true)}>
          <PlusCircle className='mr-2 h-4 w-4' /> Add Budget
        </Button>
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
