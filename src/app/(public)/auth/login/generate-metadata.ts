import { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Sign In | Expense Tracker',
    description:
      'Sign in to your Expense Tracker account to effortlessly manage your finances, track every expense, and stay on top of your financial goals.',
    keywords: [
      'login',
      'sign in',
      'expense tracker login',
      'financial management login',
      'personal finance login',
      'access account'
    ],
    openGraph: {
      title: 'Sign In to Your Expense Tracker | Access Your Financial Dashboard',
      description: 'Securely access your Expense Tracker account to manage your finances.',
      url: 'https://expense-pro.khatriutsav.com/auth/login',
      type: 'website',
      images: [
        {
          url: 'https://expense-pro.khatriutsav.com/og-image-login.png',
          width: 1200,
          height: 630,
          alt: 'Expense Tracker Login Page'
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Sign In to Your Expense Tracker | Access Your Financial Dashboard',
      description: 'Securely access your Expense Tracker account to manage your finances.',
      images: ['https://expense-pro.khatriutsav.com/og-image-login.png']
    },
    verification: {
      google: 'tNXFFpZE1VOHdcWpBlnAsX7avQThqRD6wjolUQaG4rU'
    },
    alternates: {
      canonical: 'https://expense-pro.khatriutsav.com/auth/login'
    }
  };
}
