import { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Contact Support - Expense Tracker',
    description:
      'Get in touch with the Expense Tracker support team. Whether you have a question, a feature request, or need help with the app, we are here to assist you.',
    keywords: [
      'contact support',
      'expense tracker help',
      'customer service',
      'technical support',
      'feature request',
      'report a bug'
    ],
    openGraph: {
      title: 'Contact Support - Expense Tracker',
      description: 'Need help? Contact the Expense Tracker support team for assistance.',
      url: 'https://expense-pro.khatriutsav.com/support/contact',
      type: 'website',
      images: [
        {
          url: 'https://expense-pro.khatriutsav.com/og-image-contact.png',
          width: 1200,
          height: 630,
          alt: 'Expense Tracker Contact Support Page'
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Contact Support - Expense Tracker',
      description: 'Need help? Contact the Expense Tracker support team for assistance.',
      images: ['https://expense-pro.khatriutsav.com/og-image-contact.png']
    },
    alternates: {
      canonical: 'https://expense-pro.khatriutsav.com/support/contact'
    }
  };
}
