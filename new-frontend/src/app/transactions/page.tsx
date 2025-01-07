// src/app/transactions/page.tsx
'use client';
import TransactionTable from '@/components/transactions-table';
import Loader from '@/components/ui/loader';
import { transactionGetAll } from '@/lib/endpoints/transactions';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

interface Transaction {
  id: string;
  text: string;
  amount: number;
  isIncome: boolean;
  transfer: string;
  category: {
    id: string;
    name: string;
  };
  account: string;
  createdAt: string;
}

const TransactionsPage = () => {
  const [accountId, setAccountId] = useState('');
  const [duration, setDuration] = useState('thisMonth');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const {
    data: transactions,
    isLoading,
    error
  } = useQuery({
    queryKey: ['transactions', { accountId, duration, page, search }],
    queryFn: () => transactionGetAll({ accountId, duration, page, pageSize: 10, q: search }),
    enabled: !!accountId,
    retry: false
  });
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };
  const handlePageChange = (page: number) => {
    setPage(page);
  };
  if (isLoading) {
    return <Loader />;
  }

  if (error) {
    return <div>Error fetching transactions: {error.message}</div>;
  }

  return (
    <div className='p-4'>
      <h1 className='text-xl font-bold'>Transactions</h1>
      <div className='mt-4 flex gap-2'>
        <select onChange={(e) => setAccountId(e.target.value)}>
          <option value=''>Select Account</option>
          <option value='valid-uuid-of-account-1'>Account 1</option>
          <option value='valid-uuid-of-account-2'>Account 2</option>
          <option value='valid-uuid-of-account-3'>Account 3</option>
        </select>
        <select onChange={(e) => setDuration(e.target.value)}>
          <option value='today'>Today</option>
          <option value='thisWeek'>This Week</option>
          <option value='thisMonth'>This Month</option>
          <option value='thisYear'>This Year</option>
          <option value='all'>All</option>
        </select>
        <input type='text' placeholder='search' onChange={handleSearch} />
      </div>
      <div className='mt-4'>
        <TransactionTable transactions={transactions?.transactions} />
        <div className='mt-4 flex items-center justify-center gap-2'>
          {transactions?.totalPages &&
            Array.from({ length: transactions?.totalPages }, (_, i) => i + 1).map((page) => (
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

export default TransactionsPage;
