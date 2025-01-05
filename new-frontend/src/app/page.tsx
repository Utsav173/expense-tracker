'use client';
import { Button } from '@/components/ui/button';
import { accountGetAll } from '@/lib/endpoints/accounts';
import { authLogOut } from '@/lib/endpoints/auth';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { removeAuthToken } from './(auth)/actions';
import toast from 'react-hot-toast';
import Loader from '@/components/ui/loader';

function AccountList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => accountGetAll({ sortBy: 'createdAt', sortOrder: 'asc', page: 1, limit: 10 }),
    retry: false,
  });

  if (isLoading) {
    return <Loader />;
  }

  if (error) {
    return <div>Error in fetching account list</div>;
  }

  const handleLogout = () => {
    authLogOut()
      .then(async () => {
        localStorage.removeItem('token');
        await removeAuthToken();
        toast.success('Successfully logged out!');
        window.location.href = '/login';
      })
      .catch(() => {
        toast.error('Error in logging out');
      });
  };

  return (
    <div className='p-4'>
      <div className='flex items-center justify-between'>
        <h1 className='text-xl font-bold'>Accounts</h1>
        <Button asChild>
          <Link href='/create-account'> Create Account</Link>
        </Button>
        <Button onClick={handleLogout}>Logout</Button>
      </div>
      <div className='grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3'>
        {data?.accounts?.map((acc: any) => (
          <div key={acc.id} className='rounded-lg border p-4 shadow-md'>
            <Link href={`/transactions?accountId=${acc.id}`}>
              <h2 className='text-lg font-semibold'>{acc.name}</h2>
              <p>
                {acc.currency} {acc.balance}
              </p>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AccountList;
