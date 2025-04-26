import React from 'react';

import { Inter } from 'next/font/google';
import { Metadata } from 'next';
import '../globals.css';
import ReactQueryProvider from '@/components/providers/provider';
import SidebarLayout from '@/components/layout/sidebar-layout';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Expense Pro',
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
