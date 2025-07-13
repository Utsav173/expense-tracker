import { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Sign Up - Expense Tracker',
    description:
      'Create an account with Expense Tracker to start managing your finances, tracking expenses, and achieving your financial goals.',
    keywords: [
      'sign up',
      'register',
      'create account',
      'expense tracker sign up',
      'financial management registration'
    ],
    openGraph: {
      title: 'Sign Up - Expense Tracker',
      description: 'Join Expense Tracker today and take control of your finances.',
      url: 'https://expense-pro.vercel.app/auth/signup',
      type: 'website',
      images: [
        {
          url: 'https://expense-pro.vercel.app/og-image-signup.png',
          width: 1200,
          height: 630,
          alt: 'Expense Tracker Sign Up'
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Sign Up - Expense Tracker',
      description:
        'Start your financial journey with Expense Tracker. Create your free account now.',
      images: ['https://expense-pro.vercel.app/og-image-signup.png']
    },
    verification: {
      google: '4b4H3hr3KG4V1J6eRzWhNZDf84yIPAcR1x32o0EpF8U'
    }
  };
}
