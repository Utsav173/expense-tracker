import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { startOfMonth, startOfYear, subMonths, startOfDay, endOfDay } from 'date-fns';
import { DateRange } from 'react-day-picker';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  amount: number | null | undefined,
  currencyCode: string = 'INR',
  mode?: 'standard' | 'scientific' | 'engineering' | 'compact' | undefined
): string {
  const numAmount = Number(amount ?? 0);

  try {
    if (isNaN(numAmount)) {
      console.warn(`Invalid amount provided to formatCurrency: ${amount}`);
      return `${currencyCode} 0.00`;
    }

    const options: Intl.NumberFormatOptions = {
      style: 'currency',
      currency: currencyCode,
      maximumFractionDigits: 2
    };

    if (mode) {
      options.notation = mode;
    }

    if (Math.abs(numAmount) >= 999_999) {
      options.notation = 'compact';
      options.compactDisplay = 'short';
    }

    return new Intl.NumberFormat('en-IN', options).format(numAmount);
  } catch (error) {
    console.error('Error formatting currency:', error);
    return `${currencyCode} ${numAmount.toFixed(2)}`;
  }
}

export const getDynamicFontSize = (text: string, baseSize = 3, minSize = 1.5, maxLength = 12) => {
  const length = text.length;
  if (length <= maxLength) {
    return `${baseSize}rem`;
  }
  const newSize = baseSize - (length - maxLength) * 0.15;
  return `${Math.max(newSize, minSize)}rem`;
};

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

export const safeJsonParse = (input: any): any => {
  if (typeof input === 'string') {
    try {
      return JSON.parse(input);
    } catch (e) {
      console.warn('safeJsonParse: Could not parse string as JSON:', input);
      return null;
    }
  }
  return input;
};
