import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currencyCode: string = 'INR'): string {
  try {
    return new Intl.NumberFormat('en-IN', {
      // en-IN for Indian, en-US, etc.
      style: 'currency',
      currency: currencyCode
    }).format(amount);
  } catch (error) {
    // Fallback if Intl.NumberFormat isn't supported or currency is invalid.
    console.error('Error formatting currency:', error);
    return `${currencyCode} ${amount.toFixed(2)}`;
  }
}
