import { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Terms of Service - Expense Tracker',
    description:
      'Read the Terms of Service for Expense Tracker. Understand your rights and responsibilities when using our financial management application.',
    keywords: [
      'terms of service',
      'terms and conditions',
      'legal agreement',
      'expense tracker terms'
    ],
    openGraph: {
      title: 'Terms of Service - Expense Tracker',
      description:
        'Our Terms of Service outline the rules and guidelines for using Expense Tracker.',
      url: 'https://expense-pro.vercel.app/legal/terms-of-service',
      type: 'website',
      images: [
        {
          url: 'https://expense-pro.vercel.app/og-image-terms.png',
          width: 1200,
          height: 630,
          alt: 'Expense Tracker Terms of Service'
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Terms of Service - Expense Tracker',
      description: 'Understand the terms and conditions for using Expense Tracker.',
      images: ['https://expense-pro.vercel.app/og-image-terms.png']
    },
    verification: {
      google: '4b4H3hr3KG4V1J6eRzWhNZDf84yIPAcR1x32o0EpF8U'
    }
  };
}
