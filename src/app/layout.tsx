import React from 'react';
import { Open_Sans } from 'next/font/google';
import { Metadata, Viewport } from 'next';
import Script from 'next/script';
import ReactQueryProvider from '@/components/providers/provider';
import { AuthProvider } from '@/components/providers/auth-provider';
import { cn } from '@/lib/utils';
import './globals.css';
import { GoogleAnalytics } from '@next/third-parties/google';
import { Organization, WebSite } from 'schema-dts';

const openSans = Open_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans'
});

export const metadata: Metadata = {
  metadataBase: new URL('https://expense-pro.khatriutsav.com'),
  title: 'Expense Tracker | Master Your Money with AI-Powered Insights',
  description:
    'Take control of your finances with an AI-powered expense tracker. Get predictive insights, automated budgeting, and actionable advice to achieve your financial goals.',
  keywords: [
    'expense tracker',
    'ai finance',
    'personal finance',
    'budgeting app',
    'money management',
    'financial planning',
    'spending tracker',
    'investment portfolio',
    'debt management'
  ],
  openGraph: {
    title: 'Expense Tracker | Master Your Money with AI-Powered Insights',
    description:
      'Expense Pro: Your intelligent partner for mastering personal finance. Automate tracking, gain deep understanding, and achieve your financial goals with unprecedented ease.',
    url: 'https://expense-pro.khatriutsav.com/',
    siteName: 'Expense Pro',
    images: [
      {
        url: 'https://expense-pro.khatriutsav.com/og-image-home.png',
        width: 1200,
        height: 630,
        alt: 'Expense Tracker Landing Page'
      },
      {
        url: 'https://expense-pro.khatriutsav.com/og-image-dashboard-desktop-light.webp',
        width: 1200,
        height: 630,
        alt: 'Expense Tracker Dashboard'
      }
    ],
    locale: 'en_US',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Expense Tracker | Master Your Money with AI-Powered Insights',
    description:
      'Expense Pro: Your intelligent partner for mastering personal finance. Automate tracking, gain deep understanding, and achieve your financial goals with unprecedented ease.',
    images: [
      'https://expense-pro.khatriutsav.com/og-image-home.png',
      'https://expense-pro.khatriutsav.com/og-image-dashboard-desktop-light.webp'
    ]
  },
  verification: {
    google: 'tNXFFpZE1VOHdcWpBlnAsX7avQThqRD6wjolUQaG4rU'
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
  },
  robots: {
    index: true,
    follow: true
  },
  alternates: {
    canonical: 'https://expense-pro.khatriutsav.com/'
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

const organizationSchema: Organization = {
  '@type': 'Organization',
  name: 'Expense Pro',
  url: 'https://expense-pro.khatriutsav.com',
  logo: 'https://expense-pro.khatriutsav.com/favicon-96x96.png',
  sameAs: ['https://github.com/utsav-khatri/expense-tracker']
};

const websiteSchema: WebSite = {
  '@type': 'WebSite',
  name: 'Expense Pro',
  url: 'https://expense-pro.khatriutsav.com',
  potentialAction: {
    '@type': 'SearchAction',
    target: 'https://expense-pro.khatriutsav.com/search?q={search_term_string}',
    'query-input': 'required name=search_term_string'
  } as any
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en' suppressHydrationWarning>
      <head>
        <Script
          id='organization-schema'
          type='application/ld+json'
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema)
          }}
        />
        <Script
          id='website-schema'
          type='application/ld+json'
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteSchema)
          }}
        />
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
          <AuthProvider>{children}</AuthProvider>
        </ReactQueryProvider>
      </body>
      <GoogleAnalytics gaId='GTM-NRXZ2WPR' />
    </html>
  );
}
