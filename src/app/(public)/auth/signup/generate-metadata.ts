import { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Sign Up - Create Your Expense Tracker Account',
    description:
      'Sign up for a free Expense Tracker account and start managing your finances like a pro. Track expenses, create budgets, and get AI-powered insights.',
    keywords: [
      'sign up',
      'create account',
      'expense tracker account',
      'free expense tracker',
      'personal finance software'
    ],
    openGraph: {
      title: 'Sign Up - Create Your Expense Tracker Account',
      description: 'Join Expense Tracker today and take the first step towards financial clarity.',
      url: 'https://expense-pro.khatriutsav.com/auth/signup',
      type: 'website',
      images: [
        {
          url: 'https://expense-pro.khatriutsav.com/og-image-signup.png',
          width: 1200,
          height: 630,
          alt: 'Expense Tracker Sign Up Page'
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Sign Up - Create Your Expense Tracker Account',
      description: 'Join Expense Tracker today and take the first step towards financial clarity.',
      images: ['https://expense-pro.khatriutsav.com/og-image-signup.png']
    },
    alternates: {
      canonical: 'https://expense-pro.khatriutsav.com/auth/signup',
    },
  };
}
