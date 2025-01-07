// src/app/accounts/[id]/page.tsx
'use client';
import { useQuery } from '@tanstack/react-query';
import { accountGetById } from '@/lib/endpoints/accounts';
import { useRouter } from 'next/navigation';
import { transactionGetAll } from '@/lib/endpoints/transactions';
import TransactionTable from '@/components/transactions-table';
import Loader from '@/components/ui/loader';

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

interface Account {
  id: string;
  name: string;
  balance: number;
  currency: string;
}

const AccountDetailsPage = ({ params }: { params: { id: string } }) => {
  const { id } = params;
  const router = useRouter();
  const {
    data: account,
    isLoading: isAccountLoading,
    error: accountError
  } = useQuery({
    queryKey: ['account', id],
    queryFn: () => accountGetById(id),
    retry: false
  });

  const {
    data: transactions,
    isLoading: isTransactionLoading,
    error: transactionError
  } = useQuery({
    queryKey: ['accountTransactions', id],
    queryFn: () => transactionGetAll({ accountId: id, pageSize: 10 }),
    retry: false
  });
  if (isAccountLoading) {
    return <Loader />;
  }

  if (accountError) {
    return <div>Failed to load the account</div>;
  }

  if (isTransactionLoading) {
    return <Loader />;
  }
  if (transactionError) {
    return <div>Failed to load the transaction data</div>;
  }
  return (
    <div className='p-4'>
      <h1>{account?.name}</h1>
      <p>Balance : {account?.balance}</p>
      {transactions?.transactions && <TransactionTable transactions={transactions?.transactions} />}
      <button className='mt-4 text-blue-500 hover:underline' onClick={() => router.back()}>
        {' '}
        Back{' '}
      </button>
    </div>
  );
};

export default AccountDetailsPage;
