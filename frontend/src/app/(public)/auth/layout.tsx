import React, { Suspense } from 'react';
import { Inter } from 'next/font/google';
import Loader from '@/components/ui/loader';
import { Metadata } from 'next';
import ReactQueryProvider from '@/components/providers/provider';

import '../../globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Expense Pro | Authentication',
  description:
    'Expense Pro is Efficiently manage income and expense for various accounts. Analyze accounts with insightful dashboards, charts, and reports. Import and share account data, generate statements, and more.',
  icons: [
    {
      rel: 'icon',
      type: 'image/png',
      sizes: '96x96',
      url: '/favicon-96x96.png'
    },
    { rel: 'icon', type: 'image/svg+xml', url: '/favicon.svg' },
    { rel: 'shortcut icon', url: '/favicon.ico' },
    { rel: 'apple-touch-icon', sizes: '180x180', url: '/apple-touch-icon.png' }
  ],
  manifest: '/site.webmanifest',
  appleWebApp: {
    title: 'Expense Pro'
  }
};

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang='en'>
      <body
        suppressHydrationWarning={true}
        className={inter.className + ' bg-background text-foreground'}
      >
        <ReactQueryProvider>
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
        </ReactQueryProvider>
      </body>
    </html>
  );
};

export default AuthLayout;
