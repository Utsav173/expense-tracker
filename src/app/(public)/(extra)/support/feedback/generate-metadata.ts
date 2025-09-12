import { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Share Your Feedback - Expense Tracker',
    description:
      'We value your opinion! Share your feedback and suggestions to help us improve Expense Tracker and make it even better for you.',
    keywords: [
      'feedback',
      'suggestions',
      'expense tracker feedback',
      'improve app',
      'user experience'
    ],
    openGraph: {
      title: 'Share Your Feedback - Expense Tracker',
      description: 'Help us improve Expense Tracker by sharing your valuable feedback.',
      url: 'https://expense-pro.khatriutsav.com/support/feedback',
      type: 'website',
      images: [
        {
          url: 'https://expense-pro.khatriutsav.com/og-image.png',
          width: 1200,
          height: 630,
          alt: 'Expense Tracker Feedback Page'
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Share Your Feedback - Expense Tracker',
      description: 'Help us improve Expense Tracker by sharing your valuable feedback.',
      images: ['https://expense-pro.khatriutsav.com/og-image.png']
    }
  };
}
