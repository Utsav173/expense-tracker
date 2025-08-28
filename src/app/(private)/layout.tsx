import React from 'react';
import { Metadata } from 'next';
import SidebarLayout from '@/components/layout/sidebar-layout';
import '../globals.css';
import { FloatingActionButtons } from '@/components/layout/FloatingActionButtons';

export const metadata: Metadata = {
  title: 'Expense Pro',
  description:
    'Expense Pro is Efficiently manage income and expense for various accounts. Analyze accounts with insightful dashboards, charts, and reports. Import and share account data, generate statements, and more.',
  icons: [
    { rel: 'icon', type: 'image/png', sizes: '96x96', url: '/favicon-96x96.png' },
    { rel: 'icon', type: 'image/svg+xml', url: '/favicon.svg' },
    { rel: 'shortcut icon', url: '/favicon.ico' },
    { rel: 'apple-touch-icon', sizes: '180x180', url: '/apple-touch-icon.png' }
  ],
  manifest: '/site.webmanifest',
  appleWebApp: {
    title: 'Expense Pro'
  }
};

export default async function PrivateRoutesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SidebarLayout>{children}</SidebarLayout>
      <FloatingActionButtons />
    </>
  );
}
