'use client';
import { useQuery } from '@tanstack/react-query';
import { goalGetAll } from '@/lib/endpoints/goal';
import { useState } from 'react';
import Loader from '@/components/ui/loader';

const GoalPage = () => {
  const [page, setPage] = useState(1);

  const {
    data: goals,
    isLoading,
    error
  } = useQuery({
    queryKey: ['goals', { page }],
    queryFn: () => goalGetAll({ page, limit: 10 }),
    retry: false
  });

  const handlePageChange = (page: number) => {
    setPage(page);
  };

  if (isLoading) {
    return <Loader />;
  }

  if (error) {
    return <div>Error fetching goals: {error.message}</div>;
  }

  return (
    <div className='p-4'>
      <h1 className='text-xl font-bold'>Goals</h1>
      <div className='mt-4'>
        {goals?.data?.map((goal) => (
          <div key={goal.id} className='rounded-lg border p-4 shadow-md'>
            <p className='font-semibold'>{goal.name}</p>
            <p>Target Amount : {goal.targetAmount}</p>
            <p>Saved Amount : {goal.savedAmount}</p>
            <p>Target Date : {goal.targetDate}</p>
          </div>
        ))}
        <div className='mt-4 flex items-center justify-center gap-2'>
          {goals?.pagination?.totalPages &&
            Array.from({ length: goals?.pagination?.totalPages }, (_, i) => i + 1).map((page) => (
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

export default GoalPage;
