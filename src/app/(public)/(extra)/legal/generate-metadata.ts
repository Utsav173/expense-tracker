import { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Legal Information - Expense Tracker',
    description:
      'Understand the legal terms and policies governing the use of Expense Tracker, including Privacy Policy and Terms of Service.',
    keywords: [
      'legal',
      'privacy policy',
      'terms of service',
      'data privacy',
      'user agreement',
      'expense tracker legal'
    ],
    openGraph: {
      title: 'Legal Information - Expense Tracker',
      description:
        'Understand the legal terms and policies governing the use of Expense Tracker, including Privacy Policy and Terms of Service.',
      url: 'https://expense-pro.khatriutsav.com/legal',
      type: 'website',
      images: [
        {
          url: 'https://expense-pro.khatriutsav.com/og-image.png', // Placeholder, consider a specific legal OG image
          width: 1200,
          height: 630,
          alt: 'Expense Tracker Legal Information'
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Legal Information - Expense Tracker',
      description:
        'Understand the legal terms and policies governing the use of Expense Tracker, including Privacy Policy and Terms of Service.',
      images: ['https://expense-pro.khatriutsav.com/og-image.png'] // Placeholder
    },
    alternates: {
      canonical: 'https://expense-pro.khatriutsav.com/legal'
    }
  };
}
