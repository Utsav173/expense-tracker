import { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Contact Support - Expense Tracker',
    description:
      "Have questions or need help with Expense Tracker? Contact our support team for assistance with your account, features, or any issues you're facing.",
    keywords: [
      'contact expense tracker',
      'expense tracker support',
      'get help with budgeting app',
      'customer service finance app'
    ],
    openGraph: {
      title: 'Contact Support - Expense Tracker',
      description: 'Reach out to our dedicated support team for any inquiries or assistance.',
      url: 'https://expense-pro.vercel.app/support/contact',
      type: 'website',
      images: [
        {
          url: 'https://expense-pro.vercel.app/og-image-contact.png',
          width: 1200,
          height: 630,
          alt: 'Expense Tracker Contact Support'
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Contact Support - Expense Tracker',
      description:
        'Have questions or need help with Expense Tracker? Contact our support team for assistance.',
      images: ['https://expense-pro.vercel.app/og-image-contact.png']
    },
    verification: {
      google: '4b4H3hr3KG4V1J6eRzWhNZDf84yIPAcR1x32o0EpF8U'
    }
  };
}
