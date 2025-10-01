import { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Reset Password - Expense Tracker',
    description:
      'Reset your password for your Expense Tracker account. Enter your new password to regain access.',
    keywords: [
      'reset password',
      'new password',
      'expense tracker account recovery',
      'update password'
    ],
    openGraph: {
      title: 'Reset Password - Expense Tracker',
      description: 'Create a new password for your Expense Tracker account.',
      url: 'https://expense-pro.khatriutsav.com/auth/reset-password',
      type: 'website',
      images: [
        {
          url: 'https://expense-pro.khatriutsav.com/og-image-reset-password.png',
          width: 1200,
          height: 630,
          alt: 'Expense Tracker Reset Password Page'
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Reset Password - Expense Tracker',
      description: 'Create a new password for your Expense Tracker account.',
      images: ['https://expense-pro.khatriutsav.com/og-image-reset-password.png']
    },
    alternates: {
      canonical: 'https://expense-pro.khatriutsav.com/auth/reset-password'
    }
  };
}
