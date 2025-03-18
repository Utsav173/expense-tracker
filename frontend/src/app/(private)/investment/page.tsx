'use client';
import { useQuery } from '@tanstack/react-query';
import { investmentAccountGetAll } from '@/lib/endpoints/investmentAccount';
import { useState } from 'react';
import Loader from '@/components/ui/loader';

const InvestmentPage = () => {
  const [page, setPage] = useState(1);
  const {
    data: investmentAccounts,
    isLoading,
    error
  } = useQuery({
    queryKey: ['investmentAccounts', { page }],
    queryFn: () => investmentAccountGetAll({ page, limit: 10 }),
    retry: false
  });
  const handlePageChange = (page: number) => {
    setPage(page);
  };

  if (isLoading) {
    return <Loader />;
  }

  if (error) {
    return <div>Error fetching investment accounts: {error.message}</div>;
  }
  return (
    <div className='p-4'>
      <h1 className='text-xl font-bold'>Investment Accounts</h1>
      <div className='mt-4'>
        {investmentAccounts?.data?.map((account) => (
          <div key={account.id} className='rounded-lg border p-4 shadow-md'>
            <p className='font-semibold'>{account.name}</p>
            <p>Platform : {account.platform}</p>
            <p>Currency : {account.currency}</p>
          </div>
        ))}
        <div className='mt-4 flex items-center justify-center gap-2'>
          {investmentAccounts?.pagination?.totalPages &&
            Array.from({ length: investmentAccounts?.pagination?.totalPages }, (_, i) => i + 1).map(
              (page) => (
                <button
                  className='rounded-sm border px-2 py-1'
                  key={page}
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </button>
              )
            )}
        </div>
      </div>
    </div>
  );
};

export default InvestmentPage;
