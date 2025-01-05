'use client';
import { useQuery } from '@tanstack/react-query';
import { apiFetchDebts, debtsMarkAsPaid } from '@/lib/endpoints/debt';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import Loader from '@/components/ui/loader';

const DebtsPage = () => {
  const [duration, setDuration] = useState('thisMonth');
  const [page, setPage] = useState(1);
  const {
    data: debts,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['debts', { duration, page }],
    queryFn: () => apiFetchDebts({ duration, page, pageSize: 10 }),
    retry: false,
  });
  const handlePageChange = (page: number) => {
    setPage(page);
  };

  const handlePaid = async (id: string) => {
    await debtsMarkAsPaid(id);
  };

  if (isLoading) {
    return <Loader />;
  }

  if (error) {
    return <div>Error fetching debts: {error.message}</div>;
  }

  return (
    <div className='p-4'>
      <h1 className='text-xl font-bold'>Debts</h1>
      <div className='mt-4 flex gap-2'>
        <select onChange={(e) => setDuration(e.target.value)}>
          <option value='today'>Today</option>
          <option value='thisWeek'>This Week</option>
          <option value='thisMonth'>This Month</option>
          <option value='thisYear'>This Year</option>
          <option value='all'>All</option>
        </select>
      </div>
      <div className='mt-4'>
        {debts?.data?.map((debt) => (
          <div key={debt.id} className='rounded-lg border p-4 shadow-md'>
            <p className='font-semibold'>{debt.description}</p>
            <p>Amount : {debt.amount}</p>
            <p>Premium Amount : {debt.premiumAmount}</p>
            <p>Due Date: {debt.dueDate}</p>
            <p>Type: {debt.type}</p>
            {debt.isPaid ? (
              <p className='text-green-500'>Paid</p>
            ) : (
              <Button size='sm' onClick={() => handlePaid(debt.id)}>
                {' '}
                Mark as Paid
              </Button>
            )}
          </div>
        ))}
        <div className='mt-4 flex items-center justify-center gap-2'>
          {debts?.totalPages &&
            Array.from({ length: debts?.totalPages }, (_, i) => i + 1).map((page) => (
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

export default DebtsPage;
