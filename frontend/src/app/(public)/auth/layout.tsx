import React from 'react';
import Loader from '@/components/ui/loader';
import { Suspense } from 'react';

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <Suspense fallback={<Loader />}>
      <div className='dark:from-background dark:to-background flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 px-4 py-16 sm:px-6 lg:px-8'>
        <div className='border-border bg-card dark:border-border dark:bg-card w-full max-w-lg space-y-2 rounded-xl border p-8 shadow-2xl'>
          <h1 className='bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-center text-3xl font-bold text-transparent select-none'>
            Expense Tracker
          </h1>
          {children}
        </div>
      </div>
    </Suspense>
  );
};

export default AuthLayout;
