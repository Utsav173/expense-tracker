import { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Verify Invitation - Expense Tracker',
    description:
      'Verify your invitation to join Expense Tracker. Confirm your access to a shared account or special features.',
    keywords: [
      'verify invitation',
      'expense tracker invitation',
      'shared account access',
      'invitation token'
    ],
    openGraph: {
      title: 'Verify Invitation - Expense Tracker',
      description: 'Confirm your invitation to Expense Tracker.',
      url: 'https://expense-pro.khatriutsav.com/auth/verify-invitation',
      type: 'website',
      images: [
        {
          url: 'https://expense-pro.khatriutsav.com/og-image.png',
          width: 1200,
          height: 630,
          alt: 'Expense Tracker Verify Invitation Page'
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Verify Invitation - Expense Tracker',
      description: 'Confirm your invitation to Expense Tracker.',
      images: ['https://expense-pro.khatriutsav.com/og-image.png']
    },
    alternates: {
      canonical: 'https://expense-pro.khatriutsav.com/auth/verify-invitation',
    },
  };
}
