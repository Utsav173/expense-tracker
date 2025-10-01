import { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Help Center - Expense Tracker',
    description:
      'Find answers to frequently asked questions and learn how to use Expense Tracker to its full potential. Get help with getting started, managing transactions, budgeting, and more.',
    keywords: [
      'help center',
      'faq',
      'expense tracker guide',
      'how to use expense tracker',
      'support',
      'troubleshooting'
    ],
    openGraph: {
      title: 'Help Center - Expense Tracker',
      description: 'Your guide to mastering Expense Tracker. Find answers and tutorials here.',
      url: 'https://expense-pro.khatriutsav.com/help',
      type: 'website',
      images: [
        {
          url: 'https://expense-pro.khatriutsav.com/og-image-help.png',
          width: 1200,
          height: 630,
          alt: 'Expense Tracker Help Center'
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Help Center - Expense Tracker',
      description: 'Your guide to mastering Expense Tracker. Find answers and tutorials here.',
      images: ['https://expense-pro.khatriutsav.com/og-image-help.png']
    },
    alternates: {
      canonical: 'https://expense-pro.khatriutsav.com/help'
    }
  };
}
