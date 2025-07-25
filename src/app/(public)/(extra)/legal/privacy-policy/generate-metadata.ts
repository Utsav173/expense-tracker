import { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Privacy Policy - Expense Tracker',
    description:
      'Read the privacy policy for Expense Tracker. Learn how we collect, use, and protect your personal and financial information.',
    keywords: [
      'privacy policy',
      'data privacy',
      'expense tracker privacy',
      'financial data security'
    ],
    openGraph: {
      title: 'Privacy Policy - Expense Tracker',
      description: 'Understand our commitment to your data privacy and security.',
      url: 'https://expense-pro.vercel.app/legal/privacy-policy',
      type: 'website',
      images: [
        {
          url: 'https://expense-pro.vercel.app/og-image-privacy.png',
          width: 1200,
          height: 630,
          alt: 'Expense Tracker Privacy Policy'
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Privacy Policy - Expense Tracker',
      description: 'Your privacy is our priority. Learn about our data handling practices.',
      images: ['https://expense-pro.vercel.app/og-image-privacy.png']
    },
    verification: {
      google: '4b4H3hr3KG4V1J6eRzWhNZDf84yIPAcR1x32o0EpF8U'
    }
  };
}
