
import { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Verify OTP - Expense Tracker',
    description: 'Verify your One-Time Password for Expense Tracker.',
  };
}
