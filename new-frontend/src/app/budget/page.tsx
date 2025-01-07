'use client';
import { useQuery } from '@tanstack/react-query';
import { budgetGetAll } from '@/lib/endpoints/budget';
import { useState } from 'react';
import Loader from '@/components/ui/loader';

const BudgetPage = () => {
  const [userId, setUserId] = useState('all');
  const [page, setPage] = useState(1);
  const {
    data: budgets,
    isLoading,
    error
  } = useQuery({
    queryKey: ['budgets', { userId, page }],
    queryFn: () => budgetGetAll(userId, { page, limit: 10 }),
    retry: false
  });
  const handlePageChange = (page: number) => {
    setPage(page);
  };

  if (isLoading) {
    return <Loader />;
  }

  if (error) {
    return <div>Error fetching budgets: {error.message}</div>;
  }

  return (
    <div className='p-4'>
      <h1 className='text-xl font-bold'>Budgets</h1>
      <div className='mt-4'>
        {budgets?.data?.map((budget) => (
          <div key={budget.id} className='rounded-lg border p-4 shadow-md'>
            <p>Name : {budget.category.name}</p>
            <p>Amount : {budget.amount}</p>
            <p>
              Month/Year: {budget.month}/{budget.year}
            </p>
          </div>
        ))}
        <div className='mt-4 flex items-center justify-center gap-2'>
          {budgets?.pagination?.totalPages &&
            Array.from({ length: budgets?.pagination?.totalPages }, (_, i) => i + 1).map((page) => (
              <button
                className='rounded-sm border px-2 py-1'
                key={page}
                onClick={() => handlePageChange(page)}
              >
                {page}
              </button>
            ))}
        </div>
      </div>
    </div>
  );
};

export default BudgetPage;
