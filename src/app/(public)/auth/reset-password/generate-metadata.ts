import { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Reset Password - Expense Tracker',
    description: 'Set a new password for your Expense Tracker account.',
    keywords: ['reset password', 'new password', 'expense tracker password', 'account security'],
    openGraph: {
      title: 'Reset Password - Expense Tracker',
      description: 'Securely set a new password for your Expense Tracker account.',
      url: 'https://expense-pro.vercel.app/auth/reset-password',
      type: 'website',
      images: [
        {
          url: 'https://expense-pro.vercel.app/og-image-reset-password.png',
          width: 1200,
          height: 630,
          alt: 'Expense Tracker Reset Password'
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Reset Password - Expense Tracker',
      description: 'Set your new Expense Tracker password securely.',
      images: ['https://expense-pro.vercel.app/og-image-reset-password.png']
    },
    verification: {
      google: '4b4H3hr3KG4V1J6eRzWhNZDf84yIPAcR1x32o0EpF8U'
    }
  };
}
