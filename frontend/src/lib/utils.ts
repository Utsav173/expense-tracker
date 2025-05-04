import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { startOfMonth, startOfYear, subMonths, startOfDay, endOfDay } from 'date-fns';
import { DateRange } from 'react-day-picker';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  amount: number | null | undefined,
  currencyCode: string = 'INR'
): string {
  const numAmount = Number(amount ?? 0);

  try {
    if (isNaN(numAmount)) {
      console.warn(`Invalid amount provided to formatCurrency: ${amount}`);
      return `${currencyCode} 0.00`;
    }

    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currencyCode
    }).format(numAmount);
  } catch (error) {
    console.error('Error formatting currency:', error);

    return `${currencyCode} ${numAmount.toFixed(2)}`;
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

/**
 * Safely parses a string as JSON. If parsing fails or input is not a string,
 * returns the original input or a default error object.
 * @param input The value to parse.
 * @returns The parsed object, the original input, or an error object.
 */
export const safeJsonParse = (input: any): any => {
  if (typeof input === 'string') {
    try {
      return JSON.parse(input);
    } catch (e) {
      console.warn('safeJsonParse: Could not parse string as JSON:', input);

      return { success: false, error: 'Received malformed tool result (not valid JSON).' };
    }
  }

  return input;
};
