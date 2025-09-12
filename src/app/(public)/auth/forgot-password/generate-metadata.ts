import { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Forgot Password - Expense Tracker',
    description:
      'Forgot your password? Enter your email address to receive a link to reset your password and regain access to your Expense Tracker account.',
    keywords: [
      'forgot password',
      'reset password',
      'expense tracker account recovery',
      'password recovery'
    ],
    openGraph: {
      title: 'Forgot Password - Expense Tracker',
      description: 'Reset your password for your Expense Tracker account.',
      url: 'https://expense-pro.khatriutsav.com/auth/forgot-password',
      type: 'website',
      images: [
        {
          url: 'https://expense-pro.khatriutsav.com/og-image-forgot-password.png',
          width: 1200,
          height: 630,
          alt: 'Expense Tracker Forgot Password Page'
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Forgot Password - Expense Tracker',
      description: 'Reset your password for your Expense Tracker account.',
      images: ['https://expense-pro.khatriutsav.com/og-image-forgot-password.png']
    }
  };
}
