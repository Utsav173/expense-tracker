import { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Expense Tracker | Master Your Money with AI-Powered Insights',
    description:
      'Take control of your finances with an AI-powered expense tracker. Get predictive insights, automated budgeting, and actionable advice to achieve your financial goals.',
    keywords: [
      'expense tracker',
      'ai finance',
      'personal finance',
      'budgeting app',
      'money management',
      'financial planning'
    ],
    openGraph: {
      title: 'Expense Tracker | Master Your Money with AI-Powered Insights',
      description:
        'Take control of your finances with an AI-powered expense tracker. Get predictive insights, automated budgeting, and actionable advice to achieve your financial goals.',
      url: 'https://expense-pro.khatriutsav.com',
      type: 'website',
      images: [
        {
          url: 'https://expense-pro.khatriutsav.com/og-image.png',
          width: 1200,
          height: 630,
          alt: 'Expense Tracker Landing Page'
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Expense Tracker | Master Your Money with AI-Powered Insights',
      description:
        'Take control of your finances with an AI-powered expense tracker. Get predictive insights, automated budgeting, and actionable advice to achieve your financial goals.',
      images: ['https://expense-pro.khatriutsav.com/og-image.png']
    },
    verification: {
      google: 'tNXFFpZE1VOHdcWpBlnAsX7avQThqRD6wjolUQaG4rU'
    },
    alternates: {
      canonical: 'https://expense-pro.khatriutsav.com',
    },
  };
}
