import SidebarLayout from '@/components/sidebar-layout';
import React from 'react';

import { Inter } from 'next/font/google';
import ReactQueryProvider from '@/components/provider';
import { Metadata } from 'next';
import '../globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Expense Manager',
  description: 'Generated by create next app'
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en'>
      <body suppressHydrationWarning={true} className={inter.className}>
        <ReactQueryProvider>
          <SidebarLayout>{children}</SidebarLayout>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
