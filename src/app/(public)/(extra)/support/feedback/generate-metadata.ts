import { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Feedback - Expense Pro',
    description:
      'Share your feedback and suggestions for Expense Pro. Help us improve our financial management tools to better suit your needs.',
    keywords: [
      'expense pro feedback',
      'finance app suggestions',
      'budgeting tool improvement',
      'customer feedback'
    ],
    openGraph: {
      title: 'Feedback - Expense Pro',
      description: 'Help us build a better financial tool by sharing your thoughts and ideas.',
      url: 'https://expense-pro.vercel.app/support/feedback',
      type: 'website'
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Feedback - Expense Pro',
      description: 'Have an idea to make Expense Pro better? We would love to hear from you.'
    }
  };
}
