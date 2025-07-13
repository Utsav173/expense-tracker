import { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Login - Expense Tracker',
    description:
      'Log in to your Expense Tracker account to manage your finances, track expenses, and achieve your financial goals.',
    keywords: ['login', 'sign in', 'expense tracker login', 'financial management login'],
    openGraph: {
      title: 'Login - Expense Tracker',
      description: 'Securely log in to your Expense Tracker account.',
      url: 'https://expense-pro.vercel.app/auth/login',
      type: 'website',
      images: [
        {
          url: 'https://expense-pro.vercel.app/og-image-login.png',
          width: 1200,
          height: 630,
          alt: 'Expense Tracker Login'
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Login - Expense Tracker',
      description: 'Access your Expense Tracker account securely.',
      images: ['https://expense-pro.vercel.app/og-image-login.png']
    },
    verification: {
      google: '4b4H3hr3KG4V1J6eRzWhNZDf84yIPAcR1x32o0EpF8U'
    }
  };
}
