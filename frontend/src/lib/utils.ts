import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { startOfMonth, startOfYear, subMonths, startOfDay, endOfDay } from 'date-fns';
import { DateRange } from 'react-day-picker';

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

export const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

export const getTimestampsForRange = (
  timeRangeOption: string,
  customDateRange?: DateRange
): { startTimestamp?: number; endTimestamp?: number } => {
  const now = new Date();
  let startDate: Date | null = null;
  let endDate: Date | null = endOfDay(now);

  switch (timeRangeOption) {
    case 'thisMonth':
      startDate = startOfMonth(now);
      break;
    case '3m':
      startDate = startOfMonth(subMonths(now, 2));
      break;
    case 'ytd':
      startDate = startOfYear(now);
      break;
    case '12m':
      startDate = startOfMonth(subMonths(now, 11));
      break;
    case 'thisYear':
      startDate = startOfYear(now);
      break;
    case 'custom':
      if (customDateRange?.from && customDateRange?.to) {
        startDate = startOfDay(customDateRange.from);
        endDate = endOfDay(customDateRange.to);
      } else {
        return {};
      }
      break;
    case 'all':
    default:
      return {};
  }

  const startTimestamp = startDate ? Math.floor(startDate.getTime() / 1000) : undefined;
  const endTimestamp = endDate ? Math.floor(endDate.getTime() / 1000) : undefined;

  return { startTimestamp, endTimestamp };
};
