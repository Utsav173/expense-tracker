import React from 'react';
import { Open_Sans } from 'next/font/google';
import { Metadata, Viewport } from 'next';
import Script from 'next/script';
import ReactQueryProvider from '@/components/providers/provider';
import { AuthProvider } from '@/components/providers/auth-provider';
import { cn } from '@/lib/utils';
import './globals.css';
import { GoogleAnalytics } from '@next/third-parties/google';

const openSans = Open_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans'
});

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
    'money management',
    'budget planner',
    'spending tracker',
    'financial goals',
    'investment tracker',
    'debt management'
  ],
  openGraph: {
    title: 'Expense Tracker - Master Your Money. Effortlessly.',
    description:
      'Expense Pro: Your intelligent partner for mastering personal finance. Automate tracking, gain deep understanding, and achieve your financial goals with unprecedented ease.',
    url: 'https://expense-pro.vercel.app/',
    siteName: 'Expense Tracker',
    images: [
      {
        url: 'https://expense-pro.vercel.app/og-image-home.png',
        width: 1200,
        height: 630,
        alt: 'Expense Tracker Dashboard Mockup'
      },
      {
        url: 'https://expense-pro.vercel.app/og-image-dashboard-desktop-light.webp',
        width: 1200,
        height: 630,
        alt: 'Expense Tracker Dashboard'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Expense Tracker - Master Your Money. Effortlessly.',
    description:
      'Expense Pro: Your intelligent partner for mastering personal finance. Automate tracking, gain deep understanding, and achieve your financial goals with unprecedented ease.',
    images: [
      'https://expense-pro.vercel.app/og-image-home.png',
      'https://expense-pro.vercel.app/og-image-dashboard-desktop-light.webp'
    ]
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

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'oklch(98.5% 0.005 150)' },
    { media: '(prefers-color-scheme: dark)', color: 'oklch(8% 0.015 150)' }
  ]
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en' suppressHydrationWarning>
      <head>
        {/* Google Analytics */}
        <Script
          src='https://www.googletagmanager.com/gtag/js?id=GTM-NRXZ2WPR'
          strategy='afterInteractive'
        />
        <Script id='google-analytics' strategy='afterInteractive'>
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'GTM-NRXZ2WPR');
          `}
        </Script>
      </head>
      <body
        className={cn(openSans.className, 'bg-background text-foreground dark:subtle-noise-bg')}
      >
        <ReactQueryProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ReactQueryProvider>
      </body>
      <GoogleAnalytics gaId='GTM-NRXZ2WPR' />
    </html>
  );
}
