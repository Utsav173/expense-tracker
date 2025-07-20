import React from 'react';
import Loader from '@/components/ui/loader';
import { Suspense } from 'react';
import { GoogleAnalytics } from '@next/third-parties/google';
import { AuthPageTitle } from '@/components/auth/auth-page-title';

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <Suspense fallback={<Loader />}>
      <div className='relative flex min-h-screen items-center justify-center bg-transparent px-4 py-16 select-none sm:px-6 lg:px-8'>
        <div className='border-border bg-card/90 dark:border-border dark:bg-card/90 w-full max-w-lg space-y-2 rounded-xl border p-8 shadow-2xl backdrop-blur-sm'>
          <AuthPageTitle title='Expense Tracker' />
          {children}
        </div>
      </div>
      <GoogleAnalytics gaId='GTM-NRXZ2WPR' />
    </Suspense>
  );
};

export default AuthLayout;
