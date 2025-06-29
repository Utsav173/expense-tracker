import React from 'react';
import { Inter } from 'next/font/google';
import { Metadata } from 'next';
import ReactQueryProvider from '@/components/providers/provider';
import { cn } from '@/lib/utils';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Expense Tracker - Master Your Money. Effortlessly.',
  description:
    'Expense Pro is your intelligent partner for mastering personal finance. Automate tracking, gain deep understanding, and achieve your financial goals with unprecedented ease.',
  keywords: [
    'expense tracker',
    'personal finance',
    'budgeting app',
    'financial management',
    'AI finance',
    'money management'
  ],
  openGraph: {
    title: 'Expense Tracker - Master Your Money. Effortlessly.',
    description:
      'Expense Pro: Your intelligent partner for mastering personal finance. Automate tracking, gain deep understanding, and achieve your financial goals with unprecedented ease.',
    url: 'https://expense-pro.vercel.app/',
    type: 'website',
    images: [
      {
        url: 'https://expense-pro.vercel.app/og-image-home.png',
        width: 1200,
        height: 630,
        alt: 'Expense Tracker Dashboard Mockup'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Expense Tracker - Master Your Money. Effortlessly.',
    description:
      'Expense Pro: Your intelligent partner for mastering personal finance. Automate tracking, gain deep understanding, and achieve your financial goals with unprecedented ease.',
    images: ['https://expense-pro.vercel.app/og-image-home.png']
  },
  verification: {
    google: '4b4H3hr3KG4V1J6eRzWhNZDf84yIPAcR1x32o0EpF8U'
  },
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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body className={cn(inter.className, 'bg-background text-foreground')}>
        <ReactQueryProvider>{children}</ReactQueryProvider>
      </body>
    </html>
  );
}
