import { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Forgot Password - Expense Tracker',
    description:
      'Reset your Expense Tracker password. Enter your email address to receive a password reset link.',
    keywords: [
      'forgot password',
      'reset password',
      'expense tracker password reset',
      'account recovery'
    ],
    openGraph: {
      title: 'Forgot Password - Expense Tracker',
      description: 'Easily reset your Expense Tracker password.',
      url: 'https://expense-pro.vercel.app/auth/forgot-password',
      type: 'website',
      images: [
        {
          url: 'https://expense-pro.vercel.app/og-image-forgot-password.png',
          width: 1200,
          height: 630,
          alt: 'Expense Tracker Forgot Password'
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Forgot Password - Expense Tracker',
      description: 'Reset your Expense Tracker password quickly and securely.',
      images: ['https://expense-pro.vercel.app/og-image-forgot-password.png']
    },
    verification: {
      google: '4b4H3hr3KG4V1J6eRzWhNZDf84yIPAcR1x32o0EpF8U'
    }
  };
}
