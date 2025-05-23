import {
  startOfDay,
  endOfDay,
  subDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfYear,
  endOfYear,
  subYears,
  formatISO,
  format,
  isValid as isValidDateFn,
  isEqual,
  parseISO as dateFnsParseISO,
} from 'date-fns';
import memoize from 'lodash/memoize';
import { toZonedTime } from 'date-fns-tz';
import * as chrono from 'chrono-node';

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

const APP_TIMEZONE = 'UTC';

const memoizedStartOfDay = memoize(
  (date: Date): Date => startOfDay(toZonedTime(date, APP_TIMEZONE)),
);
const memoizedEndOfDay = memoize((date: Date): Date => endOfDay(toZonedTime(date, APP_TIMEZONE)));

export function parseNaturalLanguageDateRange(
  description: string | undefined | null,
  referenceDateInput?: Date,
  timezone: string = APP_TIMEZONE,
): DateRange | null {
  if (!description) return null;

  const trimmedDesc = description.trim();
  if (trimmedDesc === '') return null;

  const referenceDate = referenceDateInput || new Date();
  const zonedRefDate = toZonedTime(referenceDate, timezone);
  const lowerDesc = trimmedDesc.toLowerCase();

  try {
    const todayStart = memoizedStartOfDay(zonedRefDate);
    const todayEnd = memoizedEndOfDay(zonedRefDate);

    const naturalLanguageMap: Record<string, () => DateRange | null> = {
      today: () => ({ startDate: todayStart, endDate: todayEnd }),
      yesterday: () => {
        const yesterday = subDays(zonedRefDate, 1);
        return { startDate: memoizedStartOfDay(yesterday), endDate: memoizedEndOfDay(yesterday) };
      },
      'last 7 days': () => ({
        startDate: memoizedStartOfDay(subDays(zonedRefDate, 6)),
        endDate: todayEnd,
      }),
      'past 7 days': () => ({
        startDate: memoizedStartOfDay(subDays(zonedRefDate, 6)),
        endDate: todayEnd,
      }),
      'last 30 days': () => ({
        startDate: memoizedStartOfDay(subDays(zonedRefDate, 29)),
        endDate: todayEnd,
      }),
      'past 30 days': () => ({
        startDate: memoizedStartOfDay(subDays(zonedRefDate, 29)),
        endDate: todayEnd,
      }),
      'this week': () => ({
        startDate: startOfWeek(zonedRefDate, { weekStartsOn: 1 }),
        endDate: memoizedEndOfDay(endOfWeek(zonedRefDate, { weekStartsOn: 1 })),
      }),
      'current week': () => ({
        startDate: startOfWeek(zonedRefDate, { weekStartsOn: 1 }),
        endDate: memoizedEndOfDay(endOfWeek(zonedRefDate, { weekStartsOn: 1 })),
      }),
      'last week': () => {
        const lastWeekStart = startOfWeek(subDays(zonedRefDate, 7), { weekStartsOn: 1 });
        return {
          startDate: lastWeekStart,
          endDate: memoizedEndOfDay(endOfWeek(lastWeekStart, { weekStartsOn: 1 })),
        };
      },
      'previous week': () => {
        const lastWeekStart = startOfWeek(subDays(zonedRefDate, 7), { weekStartsOn: 1 });
        return {
          startDate: lastWeekStart,
          endDate: memoizedEndOfDay(endOfWeek(lastWeekStart, { weekStartsOn: 1 })),
        };
      },
      'this month': () => ({
        startDate: startOfMonth(zonedRefDate),
        endDate: memoizedEndOfDay(endOfMonth(zonedRefDate)),
      }),
      'current month': () => ({
        startDate: startOfMonth(zonedRefDate),
        endDate: memoizedEndOfDay(endOfMonth(zonedRefDate)),
      }),
      'last month': () => {
        const lastMonthStart = startOfMonth(subMonths(zonedRefDate, 1));
        return { startDate: lastMonthStart, endDate: memoizedEndOfDay(endOfMonth(lastMonthStart)) };
      },
      'previous month': () => {
        const lastMonthStart = startOfMonth(subMonths(zonedRefDate, 1));
        return { startDate: lastMonthStart, endDate: memoizedEndOfDay(endOfMonth(lastMonthStart)) };
      },
      'this year': () => ({
        startDate: startOfYear(zonedRefDate),
        endDate: memoizedEndOfDay(endOfYear(zonedRefDate)),
      }),
      'current year': () => ({
        startDate: startOfYear(zonedRefDate),
        endDate: memoizedEndOfDay(endOfYear(zonedRefDate)),
      }),
      'last year': () => {
        const lastYearStart = startOfYear(subYears(zonedRefDate, 1));
        return { startDate: lastYearStart, endDate: memoizedEndOfDay(endOfYear(lastYearStart)) };
      },
      'previous year': () => {
        const lastYearStart = startOfYear(subYears(zonedRefDate, 1));
        return { startDate: lastYearStart, endDate: memoizedEndOfDay(endOfYear(lastYearStart)) };
      },
      'this quarter': () => {
        const currentQuarter = Math.floor(zonedRefDate.getMonth() / 3);
        const quarterStart = new Date(zonedRefDate.getFullYear(), currentQuarter * 3, 1);
        const quarterEnd = new Date(zonedRefDate.getFullYear(), (currentQuarter + 1) * 3, 0);
        return {
          startDate: memoizedStartOfDay(quarterStart),
          endDate: memoizedEndOfDay(quarterEnd),
        };
      },
      'last quarter': () => {
        const currentQuarter = Math.floor(zonedRefDate.getMonth() / 3);
        let prevQuarterYear = zonedRefDate.getFullYear();
        let prevQuarter = currentQuarter - 1;
        if (prevQuarter < 0) {
          prevQuarter = 3;
          prevQuarterYear--;
        }
        const quarterStart = new Date(prevQuarterYear, prevQuarter * 3, 1);
        const quarterEnd = new Date(prevQuarterYear, (prevQuarter + 1) * 3, 0);
        return {
          startDate: memoizedStartOfDay(quarterStart),
          endDate: memoizedEndOfDay(quarterEnd),
        };
      },
    };

    if (naturalLanguageMap[lowerDesc]) {
      const range = naturalLanguageMap[lowerDesc]();
      if (range) {
        return range;
      }
    }

    const chronoResults = chrono.parse(trimmedDesc, zonedRefDate, { forwardDate: true });

    if (chronoResults && chronoResults.length > 0) {
      const result = chronoResults[0];

      if (result.start) {
        const startDate = result.start.date();
        let endDate = result.end ? result.end.date() : result.start.date();

        if (
          !result.end &&
          result.start.isCertain('day') &&
          result.start.isCertain('month') &&
          result.start.isCertain('year')
        ) {
          endDate = startDate;
        }

        if (isValidDateFn(startDate) && isValidDateFn(endDate)) {
          let finalStartDate = memoizedStartOfDay(startDate);
          let finalEndDate = memoizedEndOfDay(endDate);

          if (isEqual(startOfDay(startDate), startOfDay(endDate))) {
            finalEndDate = memoizedEndOfDay(startDate);
          }

          if (finalStartDate > finalEndDate) {
            [finalStartDate, finalEndDate] = [finalEndDate, finalStartDate];
          }
          return { startDate: finalStartDate, endDate: finalEndDate };
        }
      }
    }

    const parts = trimmedDesc.split(',');
    if (parts.length === 1 && /^\d{4}-\d{2}-\d{2}$/.test(parts[0])) {
      const date = dateFnsParseISO(parts[0]);
      if (isValidDateFn(date)) {
        return { startDate: memoizedStartOfDay(date), endDate: memoizedEndOfDay(date) };
      }
    } else if (
      parts.length === 2 &&
      /^\d{4}-\d{2}-\d{2}$/.test(parts[0].trim()) &&
      /^\d{4}-\d{2}-\d{2}$/.test(parts[1].trim())
    ) {
      const startDate = dateFnsParseISO(parts[0].trim());
      const endDate = dateFnsParseISO(parts[1].trim());
      if (isValidDateFn(startDate) && isValidDateFn(endDate)) {
        let finalStartDate = memoizedStartOfDay(startDate);
        let finalEndDate = memoizedEndOfDay(endDate);
        if (finalStartDate > finalEndDate) {
          [finalStartDate, finalEndDate] = [finalEndDate, finalStartDate];
        }
        return { startDate: finalStartDate, endDate: finalEndDate };
      }
    }
    return null;
  } catch (error) {
    console.error(`Critical error parsing date "${description}":`, error);
    return null;
  }
}

export function formatDateRange(range: DateRange | null, formatStr: string = 'yyyy-MM-dd'): string {
  if (!range) return 'Invalid date range';
  try {
    const startFormatted = format(range.startDate, formatStr);
    const endFormatted = format(range.endDate, formatStr);
    if (isEqual(startOfDay(range.startDate), startOfDay(range.endDate))) {
      return startFormatted;
    } else {
      return `${startFormatted} to ${endFormatted}`;
    }
  } catch (e) {
    console.error('Error formatting date range:', e);
    return `${formatISO(range.startDate)} to ${formatISO(range.endDate)}`;
  }
}

export function formatDateRangeForQuery(range: DateRange): { startDate: string; endDate: string } {
  const formatDate = (date: Date): string => format(date, 'yyyy-MM-dd HH:mm:ss.SSS');
  return {
    startDate: formatDate(range.startDate),
    endDate: formatDate(range.endDate),
  };
}
