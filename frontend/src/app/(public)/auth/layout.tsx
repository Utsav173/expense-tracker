import React from 'react';
import Loader from '@/components/ui/loader';
import { Suspense } from 'react';
import { GoogleAnalytics } from '@next/third-parties/google';
import { BGPattern } from '@/components/landing/bg-pattern';
import { AuthPageTitle } from '@/components/auth/auth-page-title';

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <Suspense fallback={<Loader />}>
      <div className='relative flex min-h-screen items-center justify-center bg-transparent px-4 py-16 sm:px-6 lg:px-8'>
        <BGPattern variant='dots' mask='fade-center' />
        <div className='border-border bg-card dark:border-border dark:bg-card w-full max-w-lg space-y-2 rounded-xl border p-8 shadow-2xl'>
          <AuthPageTitle title='Expense Tracker' />
          {children}
        </div>
      </div>
      <GoogleAnalytics gaId='GTM-NRXZ2WPR' />
    </Suspense>
  );
};

export default AuthLayout;
