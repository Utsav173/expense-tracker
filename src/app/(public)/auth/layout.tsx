import React from 'react';
import Loader from '@/components/ui/loader';
import { Suspense } from 'react';
import { GoogleAnalytics } from '@next/third-parties/google';
import { AuthPageTitle } from '@/components/auth/auth-page-title';

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <Suspense fallback={<Loader />}>
      <div className='bg-background relative flex min-h-screen items-center justify-center p-4'>
        <div className='from-primary/10 via-background to-secondary/10 absolute inset-0 -z-10 bg-gradient-to-br' />
        <div className='bg-card w-full max-w-md space-y-2 rounded-xl border p-6 shadow-2xl backdrop-blur-sm select-none sm:p-8'>
          <AuthPageTitle title='Expense Pro' />
          {children}
        </div>
      </div>
      <GoogleAnalytics gaId='GTM-NRXZ2WPR' />
    </Suspense>
  );
};

export default AuthLayout;
