import React from 'react';
import { Inter } from 'next/font/google';
import { Metadata } from 'next';
import ReactQueryProvider from '@/components/providers/provider';
import { cn } from '@/lib/utils';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Expense Pro: AI-Powered Expense Tracker & Smart Finance Manager',
  description:
    'Take control of your finances with Expense Pro. Track expenses, manage budgets, monitor investments, and get AI-driven insights. Sign up free today!',
  keywords:
    'expense tracker, budget app, personal finance, investment tracking, AI finance, money management, financial planning, savings goals, debt management',
  openGraph: {
    title: 'Expense Pro: AI-Powered Expense Tracker & Smart Finance Manager',
    description:
      'Simplify your financial life. Track, budget, invest, and get AI insights with Expense Pro.',
    type: 'website',
    url: 'https://pro-expense.vercel.app',
    images: [
      {
        url: 'https://pro-expense.vercel.app/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Expense Pro Dashboard'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Expense Pro: AI-Powered Expense Tracker & Smart Finance Manager',
    description:
      'Simplify your financial life. Track, budget, invest, and get AI insights with Expense Pro.',
    images: ['https://pro-expense.vercel.app/og-image.png']
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
