// src/utils/nl_date.utils.ts
import {
  startOfDay,
  endOfDay,
  subDays,
  addDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subMonths,
  addMonths,
  startOfYear,
  endOfYear,
  subYears,
  addYears,
  parse as parseDateFn,
  isValid as isValidDateFn,
  format as formatDateFn,
  differenceInDays,
} from 'date-fns';

type DateRange = { startDate: Date; endDate: Date };

/**
 * Parses natural language date descriptions or specific date formats into a date range.
 * Handles relative terms like "today", "yesterday", "last week", "this month", "last month", "this year", "last year".
 * Also handles specific dates "YYYY-MM-DD" and ranges "YYYY-MM-DD,YYYY-MM-DD".
 * @param description - The natural language or formatted date string.
 * @returns A DateRange object { startDate, endDate } or null if parsing fails.
 */
export function parseNaturalLanguageDateRange(
  description: string | undefined | null,
): DateRange | null {
  if (!description) return null;

  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const lowerDesc = description.toLowerCase().trim();

  switch (lowerDesc) {
    case 'today':
      return { startDate: todayStart, endDate: todayEnd };
    case 'yesterday':
      const yesterday = subDays(now, 1);
      return { startDate: startOfDay(yesterday), endDate: endOfDay(yesterday) };
    case 'last 7 days':
      return { startDate: startOfDay(subDays(now, 6)), endDate: todayEnd }; // Includes today
    case 'last 30 days':
      return { startDate: startOfDay(subDays(now, 29)), endDate: todayEnd }; // Includes today
    case 'this week':
      // Assuming week starts on Monday (locale-dependent, adjust if needed)
      return {
        startDate: startOfWeek(now, { weekStartsOn: 1 }),
        endDate: endOfDay(endOfWeek(now, { weekStartsOn: 1 })),
      };
    case 'last week':
      const lastWeekStart = startOfWeek(subDays(now, 7), { weekStartsOn: 1 });
      return {
        startDate: lastWeekStart,
        endDate: endOfDay(endOfWeek(lastWeekStart, { weekStartsOn: 1 })),
      };
    case 'this month':
      return { startDate: startOfMonth(now), endDate: endOfDay(endOfMonth(now)) };
    case 'last month':
      const lastMonthStart = startOfMonth(subMonths(now, 1));
      return { startDate: lastMonthStart, endDate: endOfDay(endOfMonth(lastMonthStart)) };
    case 'this year':
      return { startDate: startOfYear(now), endDate: endOfDay(endOfYear(now)) };
    case 'last year':
      const lastYearStart = startOfYear(subYears(now, 1));
      return { startDate: lastYearStart, endDate: endOfDay(endOfYear(lastYearStart)) };
  }

  // Check for YYYY-MM-DD,YYYY-MM-DD format
  if (lowerDesc.includes(',')) {
    const parts = lowerDesc.split(',');
    if (parts.length === 2) {
      try {
        const start = parseDateFn(parts[0].trim(), 'yyyy-MM-dd', new Date());
        const end = parseDateFn(parts[1].trim(), 'yyyy-MM-dd', new Date());
        if (isValidDateFn(start) && isValidDateFn(end) && start <= end) {
          return { startDate: startOfDay(start), endDate: endOfDay(end) };
        }
      } catch (e) {
        /* ignore format error */
      }
    }
  }

  // Check for YYYY-MM-DD format (single day)
  try {
    const singleDate = parseDateFn(lowerDesc, 'yyyy-MM-dd', new Date());
    if (isValidDateFn(singleDate)) {
      return { startDate: startOfDay(singleDate), endDate: endOfDay(singleDate) };
    }
  } catch (e) {
    /* ignore format error */
  }

  // Add more complex parsing if needed (e.g., "August 2024")

  console.warn(`Could not parse date range description: "${description}"`);
  return null; // Indicate parsing failure
}

/**
 * Formats a DateRange object into a string suitable for database queries.
 * @param range - The DateRange object.
 * @returns Object with { startDate: string, endDate: string } in 'yyyy-MM-dd HH:mm:ss.SSS' format.
 */
export function formatDateRangeForQuery(range: DateRange): { startDate: string; endDate: string } {
  const format = (date: Date): string => formatDateFn(date, 'yyyy-MM-dd HH:mm:ss.SSS');
  return {
    startDate: format(range.startDate),
    endDate: format(range.endDate),
  };
}
