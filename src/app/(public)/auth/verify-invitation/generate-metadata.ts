import { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Verify Invitation - Expense Tracker',
    description: 'Verify your invitation to Expense Tracker.'
  };
}
