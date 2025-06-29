import { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Pricing Plans - Expense Tracker',
    description:
      'Choose the perfect plan for your financial needs. Start for free and unlock advanced features with our Pro plan.',
    keywords: [
      'expense tracker pricing',
      'finance app cost',
      'budgeting tool plans',
      'free expense tracker'
    ],
    openGraph: {
      title: 'Pricing Plans - Expense Tracker',
      description: 'Affordable and transparent pricing for managing your finances effectively.',
      url: 'https://expense-pro.vercel.app/pricing',
      type: 'website',
      images: [
        {
          url: 'https://expense-pro.vercel.app/og-image-pricing.png',
          width: 1200,
          height: 630,
          alt: 'Expense Tracker Pricing Plans'
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Pricing Plans - Expense Tracker',
      description:
        'Choose the perfect plan for your financial needs. Start for free and unlock advanced features with our Pro plan.',
      images: ['https://expense-pro.vercel.app/og-image-pricing.png']
    },
    verification: {
      google: '4b4H3hr3KG4V1J6eRzWhNZDf84yIPAcR1x32o0EpF8U'
    }
  };
}
