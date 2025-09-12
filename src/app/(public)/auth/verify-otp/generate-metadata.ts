import { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Verify OTP - Expense Tracker',
    description:
      'Verify your One-Time Password (OTP) to complete your email verification or password reset for your Expense Tracker account.',
    keywords: [
      'verify otp',
      'otp verification',
      'email verification',
      'password reset otp',
      'expense tracker security'
    ],
    openGraph: {
      title: 'Verify OTP - Expense Tracker',
      description: 'Enter your OTP to securely verify your identity.',
      url: 'https://expense-pro.khatriutsav.com/auth/verify-otp',
      type: 'website',
      images: [
        {
          url: 'https://expense-pro.khatriutsav.com/og-image-password-sent.png',
          width: 1200,
          height: 630,
          alt: 'Expense Tracker Verify OTP Page'
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Verify OTP - Expense Tracker',
      description: 'Enter your OTP to securely verify your identity.',
      images: ['https://expense-pro.khatriutsav.com/og-image-password-sent.png']
    }
  };
}
