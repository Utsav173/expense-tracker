import React, { Suspense } from 'react';

import { Inter } from 'next/font/google';
import ReactQueryProvider from '@/components/provider';
import '../../globals.css';
import Loader from '@/components/ui/loader';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Authentication',
  description: 'Authentication for your Expense Manager application'
};

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang='en'>
      <body suppressHydrationWarning={true} className={inter.className}>
        <ReactQueryProvider>
          <Suspense fallback={<Loader />}>
            <div className='flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 px-4 py-16 sm:px-6 lg:px-8'>
              <div className='w-full max-w-lg space-y-8 rounded-xl border border-gray-100 bg-white p-8 shadow-2xl'>
                <div className='text-center'>
                  <h1 className='bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-3xl font-bold text-transparent'>
                    Expense Tracker
                  </h1>
                </div>
                {children}
              </div>
            </div>
          </Suspense>
        </ReactQueryProvider>
      </body>
    </html>
  );
};

export default AuthLayout;
