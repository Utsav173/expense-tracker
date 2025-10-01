import { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Pricing - Expense Tracker | Unlock Pro Features',
    description:
      'Choose the perfect plan for your financial journey. Start for free with essential expense tracking tools or upgrade to Pro for a lifetime of advanced AI-powered features.',
    keywords: [
      'expense tracker pricing',
      'finance app cost',
      'budgeting app price',
      'pro plan',
      'lifetime access',
      'financial management tools'
    ],
    openGraph: {
      title: 'Pricing - Expense Tracker | Unlock Pro Features',
      description:
        'Explore our simple pricing and unlock a lifetime of financial clarity with a single purchase.',
      url: 'https://expense-pro.khatriutsav.com/pricing',
      type: 'website',
      images: [
        {
          url: 'https://expense-pro.khatriutsav.com/og-image-pricing.png',
          width: 1200,
          height: 630,
          alt: 'Expense Tracker Pricing Page'
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Pricing - Expense Tracker | Unlock Pro Features',
      description:
        'Explore our simple pricing and unlock a lifetime of financial clarity with a single purchase.',
      images: ['https://expense-pro.khatriutsav.com/og-image-pricing.png']
    },
    alternates: {
      canonical: 'https://expense-pro.khatriutsav.com/pricing'
    }
  };
}
