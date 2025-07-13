import { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Password Reset Email Sent - Expense Tracker',
    description:
      'A password reset link has been sent to your email address. Check your inbox to reset your Expense Tracker password.',
    keywords: [
      'password reset sent',
      'email sent',
      'forgot password confirmation',
      'expense tracker password recovery'
    ],
    openGraph: {
      title: 'Password Reset Email Sent - Expense Tracker',
      description: 'Check your email for instructions to reset your password.',
      url: 'https://expense-pro.vercel.app/auth/forgot-password-sent',
      type: 'website',
      images: [
        {
          url: 'https://expense-pro.vercel.app/og-image-password-sent.png',
          width: 1200,
          height: 630,
          alt: 'Password Reset Email Sent'
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Password Reset Email Sent - Expense Tracker',
      description: 'Your password reset email is on its way. Check your inbox.',
      images: ['https://expense-pro.vercel.app/og-image-password-sent.png']
    },
    verification: {
      google: '4b4H3hr3KG4V1J6eRzWhNZDf84yIPAcR1x32o0EpF8U'
    }
  };
}
