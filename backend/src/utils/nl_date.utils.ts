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
  parse as parseDateFn,
  isValid as isValidDateFn,
  formatISO,
  format,
} from 'date-fns';
import memoize from 'lodash/memoize';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';

/**
 * Represents a date range with start and end dates.
 */
export interface DateRange {
  startDate: Date;
  endDate: Date;
}

const APP_TIMEZONE = 'UTC';

const memoizedStartOfDay = memoize(
  (date: Date): Date => startOfDay(toZonedTime(date, APP_TIMEZONE)),
);

const memoizedEndOfDay = memoize((date: Date): Date => endOfDay(toZonedTime(date, APP_TIMEZONE)));

/**
 * Parses natural language date descriptions or specific date formats into a date range.
 * Handles relative terms like "today", "yesterday", "last week", etc.
 * Also handles specific dates in "YYYY-MM-DD" format and ranges with various separators.
 *
 * This function is production-ready with:
 * - Timezone support
 * - Performance optimization via memoization
 * - Robust error handling
 * - Extensive edge case coverage
 * - Localization support for English date formats
 *
 * @param description - The natural language or formatted date string
 * @param timezone - Optional timezone (defaults to APP_TIMEZONE)
 * @returns A DateRange object { startDate, endDate } or null if parsing fails
 */
export function parseNaturalLanguageDateRange(
  description: string | undefined | null,
  timezone: string = APP_TIMEZONE,
): DateRange | null {
  if (!description) return null;

  const trimmedDesc = description.trim();
  if (trimmedDesc === '') return null;

  try {
    const now = new Date();
    const zonedNow = toZonedTime(now, timezone);
    const todayStart = memoizedStartOfDay(zonedNow);
    const todayEnd = memoizedEndOfDay(zonedNow);
    const lowerDesc = trimmedDesc.toLowerCase();

    const naturalLanguageMap: Record<string, () => DateRange> = {
      today: () => ({
        startDate: todayStart,
        endDate: todayEnd,
      }),
      yesterday: () => {
        const yesterday = subDays(zonedNow, 1);
        return {
          startDate: memoizedStartOfDay(yesterday),
          endDate: memoizedEndOfDay(yesterday),
        };
      },
      'last 7 days': () => ({
        startDate: memoizedStartOfDay(subDays(zonedNow, 6)),
        endDate: todayEnd,
      }),
      'last 30 days': () => ({
        startDate: memoizedStartOfDay(subDays(zonedNow, 29)),
        endDate: todayEnd,
      }),
      'this week': () => ({
        startDate: startOfWeek(zonedNow, { weekStartsOn: 1 }),
        endDate: memoizedEndOfDay(endOfWeek(zonedNow, { weekStartsOn: 1 })),
      }),
      'last week': () => {
        const lastWeekStart = startOfWeek(subDays(zonedNow, 7), { weekStartsOn: 1 });
        return {
          startDate: lastWeekStart,
          endDate: memoizedEndOfDay(endOfWeek(lastWeekStart, { weekStartsOn: 1 })),
        };
      },
      'this month': () => ({
        startDate: startOfMonth(zonedNow),
        endDate: memoizedEndOfDay(endOfMonth(zonedNow)),
      }),
      'last month': () => {
        const lastMonthStart = startOfMonth(subMonths(zonedNow, 1));
        return {
          startDate: lastMonthStart,
          endDate: memoizedEndOfDay(endOfMonth(lastMonthStart)),
        };
      },
      'this year': () => ({
        startDate: startOfYear(zonedNow),
        endDate: memoizedEndOfDay(endOfYear(zonedNow)),
      }),
      'last year': () => {
        const lastYearStart = startOfYear(subYears(zonedNow, 1));
        return {
          startDate: lastYearStart,
          endDate: memoizedEndOfDay(endOfYear(lastYearStart)),
        };
      },

      'current week': () => ({
        startDate: startOfWeek(zonedNow, { weekStartsOn: 1 }),
        endDate: memoizedEndOfDay(endOfWeek(zonedNow, { weekStartsOn: 1 })),
      }),
      'current month': () => ({
        startDate: startOfMonth(zonedNow),
        endDate: memoizedEndOfDay(endOfMonth(zonedNow)),
      }),
      'current year': () => ({
        startDate: startOfYear(zonedNow),
        endDate: memoizedEndOfDay(endOfYear(zonedNow)),
      }),
      'past 7 days': () => ({
        startDate: memoizedStartOfDay(subDays(zonedNow, 6)),
        endDate: todayEnd,
      }),
      'past 30 days': () => ({
        startDate: memoizedStartOfDay(subDays(zonedNow, 29)),
        endDate: todayEnd,
      }),
      'previous week': () => {
        const lastWeekStart = startOfWeek(subDays(zonedNow, 7), { weekStartsOn: 1 });
        return {
          startDate: lastWeekStart,
          endDate: memoizedEndOfDay(endOfWeek(lastWeekStart, { weekStartsOn: 1 })),
        };
      },
      'previous month': () => {
        const lastMonthStart = startOfMonth(subMonths(zonedNow, 1));
        return {
          startDate: lastMonthStart,
          endDate: memoizedEndOfDay(endOfMonth(lastMonthStart)),
        };
      },
      'previous year': () => {
        const lastYearStart = startOfYear(subYears(zonedNow, 1));
        return {
          startDate: lastYearStart,
          endDate: memoizedEndOfDay(endOfYear(lastYearStart)),
        };
      },
    };

    if (naturalLanguageMap[lowerDesc]) {
      try {
        return naturalLanguageMap[lowerDesc]();
      } catch (e) {
        console.warn(`Error processing natural language date "${lowerDesc}":`, e);
      }
    }

    const normalizedDesc = lowerDesc.replace(/\s+/g, ' ').trim();
    for (const [key, handler] of Object.entries(naturalLanguageMap)) {
      if (normalizedDesc === key) {
        try {
          return handler();
        } catch (e) {
          console.warn(`Error processing normalized date "${normalizedDesc}":`, e);
        }
      }
    }

    const rangeSeparators = [',', ' to ', ' through ', ' - ', ' – ', ' — ', '-'];

    for (const separator of rangeSeparators) {
      if (trimmedDesc.includes(separator)) {
        const parts = trimmedDesc.split(separator);
        if (parts.length === 2) {
          try {
            const startPart = parts[0].trim();
            const endPart = parts[1].trim();
            let startDate: Date | undefined = undefined;
            let endDate: Date | undefined = undefined;

            const dateFormats = ['yyyy-MM-dd', 'MM/dd/yyyy', 'dd/MM/yyyy', 'yyyy/MM/dd'];

            for (const format of dateFormats) {
              try {
                startDate = parseDateFn(startPart, format, new Date());
                if (isValidDateFn(startDate)) break;
              } catch {}
            }

            for (const format of dateFormats) {
              try {
                endDate = parseDateFn(endPart, format, new Date());
                if (isValidDateFn(endDate)) break;
              } catch {}
            }

            if (startDate && endDate && isValidDateFn(startDate) && isValidDateFn(endDate)) {
              if (startDate > endDate) {
                [startDate, endDate] = [endDate, startDate];
              }

              return {
                startDate: memoizedStartOfDay(startDate),
                endDate: memoizedEndOfDay(endDate),
              };
            }
          } catch (e) {}
        }
      }
    }

    const dateFormats = ['yyyy-MM-dd', 'MM/dd/yyyy', 'dd/MM/yyyy', 'yyyy/MM/dd'];
    for (const format of dateFormats) {
      try {
        const singleDate = parseDateFn(trimmedDesc, format, new Date());
        if (isValidDateFn(singleDate)) {
          return {
            startDate: memoizedStartOfDay(singleDate),
            endDate: memoizedEndOfDay(singleDate),
          };
        }
      } catch {}
    }

    if (lowerDesc.includes('quarter')) {
      try {
        if (lowerDesc === 'this quarter' || lowerDesc === 'current quarter') {
          const currentQuarter = Math.floor(zonedNow.getMonth() / 3);
          const quarterStart = new Date(zonedNow.getFullYear(), currentQuarter * 3, 1);
          const quarterEnd = new Date(zonedNow.getFullYear(), (currentQuarter + 1) * 3, 0);
          return {
            startDate: memoizedStartOfDay(quarterStart),
            endDate: memoizedEndOfDay(quarterEnd),
          };
        } else if (lowerDesc === 'last quarter' || lowerDesc === 'previous quarter') {
          const currentQuarter = Math.floor(zonedNow.getMonth() / 3);
          let prevQuarterYear = zonedNow.getFullYear();
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
        }
      } catch (e) {
        console.warn(`Error processing quarter date "${lowerDesc}":`, e);
      }
    }

    const daysAgoMatch = lowerDesc.match(/^(\d+)\s*days?\s*ago$/);
    if (daysAgoMatch && daysAgoMatch[1]) {
      try {
        const daysAgo = parseInt(daysAgoMatch[1], 10);
        if (!isNaN(daysAgo) && daysAgo >= 0) {
          const pastDate = subDays(zonedNow, daysAgo);
          return {
            startDate: memoizedStartOfDay(pastDate),
            endDate: memoizedEndOfDay(pastDate),
          };
        }
      } catch (e) {
        console.warn(`Error processing "days ago" format "${lowerDesc}":`, e);
      }
    }

    const lastXDaysMatch = lowerDesc.match(/^(?:last|past)\s+(\d+)\s*days?$/);
    if (lastXDaysMatch && lastXDaysMatch[1]) {
      try {
        const days = parseInt(lastXDaysMatch[1], 10);
        if (!isNaN(days) && days > 0) {
          return {
            startDate: memoizedStartOfDay(subDays(zonedNow, days - 1)),
            endDate: todayEnd,
          };
        }
      } catch (e) {
        console.warn(`Error processing "last X days" format "${lowerDesc}":`, e);
      }
    }

    try {
      const monthNames = [
        'january',
        'february',
        'march',
        'april',
        'may',
        'june',
        'july',
        'august',
        'september',
        'october',
        'november',
        'december',
      ];

      const shortMonthNames = [
        'jan',
        'feb',
        'mar',
        'apr',
        'may',
        'jun',
        'jul',
        'aug',
        'sep',
        'oct',
        'nov',
        'dec',
      ];

      const monthPattern = [...monthNames, ...shortMonthNames].join('|');
      const monthYearRegex = new RegExp(`^(${monthPattern})\\s+(\\d{4})$`);

      const monthYearMatch = lowerDesc.match(monthYearRegex);
      if (monthYearMatch) {
        let monthIndex = -1;

        monthIndex = monthNames.indexOf(monthYearMatch[1]);

        if (monthIndex === -1) {
          const abbrevIndex = shortMonthNames.indexOf(monthYearMatch[1]);
          if (abbrevIndex !== -1) {
            monthIndex = abbrevIndex;
          }
        }

        const year = parseInt(monthYearMatch[2], 10);

        if (monthIndex !== -1 && !isNaN(year)) {
          const monthStart = new Date(year, monthIndex, 1);
          const monthEnd = new Date(year, monthIndex + 1, 0);

          return {
            startDate: memoizedStartOfDay(monthStart),
            endDate: memoizedEndOfDay(monthEnd),
          };
        }
      }
    } catch (e) {
      console.warn(`Error processing month-year format "${lowerDesc}":`, e);
    }

    const yearOnlyMatch = /^(\d{4})$/.exec(lowerDesc);
    if (yearOnlyMatch) {
      try {
        const year = parseInt(yearOnlyMatch[1], 10);
        if (!isNaN(year) && year >= 1000 && year <= 9999) {
          const yearStart = new Date(year, 0, 1);
          const yearEnd = new Date(year, 11, 31);

          return {
            startDate: memoizedStartOfDay(yearStart),
            endDate: memoizedEndOfDay(yearEnd),
          };
        }
      } catch (e) {
        console.warn(`Error processing year-only format "${lowerDesc}":`, e);
      }
    }

    const fiscalYearMatch = /^fy\s*(\d{4})$/i.exec(lowerDesc);
    if (fiscalYearMatch) {
      try {
        const year = parseInt(fiscalYearMatch[1], 10);
        if (!isNaN(year) && year >= 1000 && year <= 9999) {
          const fiscalYearStart = new Date(year - 1, 3, 1);
          const fiscalYearEnd = new Date(year, 2, 31);

          return {
            startDate: memoizedStartOfDay(fiscalYearStart),
            endDate: memoizedEndOfDay(fiscalYearEnd),
          };
        }
      } catch (e) {
        console.warn(`Error processing fiscal year format "${lowerDesc}":`, e);
      }
    }

    const seasonMap: Record<string, (year: number) => DateRange> = {
      spring: (year) => ({
        startDate: memoizedStartOfDay(new Date(year, 2, 20)),
        endDate: memoizedEndOfDay(new Date(year, 5, 20)),
      }),
      summer: (year) => ({
        startDate: memoizedStartOfDay(new Date(year, 5, 21)),
        endDate: memoizedEndOfDay(new Date(year, 8, 22)),
      }),
      fall: (year) => ({
        startDate: memoizedStartOfDay(new Date(year, 8, 23)),
        endDate: memoizedEndOfDay(new Date(year, 11, 20)),
      }),
      autumn: (year) => ({
        startDate: memoizedStartOfDay(new Date(year, 8, 23)),
        endDate: memoizedEndOfDay(new Date(year, 11, 20)),
      }),
      winter: (year) => ({
        startDate: memoizedStartOfDay(new Date(year - 1, 11, 21)),
        endDate: memoizedEndOfDay(new Date(year, 2, 19)),
      }),
    };

    const seasonYearMatch = lowerDesc.match(/^(spring|summer|fall|autumn|winter)\s+(\d{4})$/);
    if (seasonYearMatch) {
      try {
        const season = seasonYearMatch[1].toLowerCase();
        const year = parseInt(seasonYearMatch[2], 10);

        if (seasonMap[season] && !isNaN(year) && year >= 1000 && year <= 9999) {
          return seasonMap[season](year);
        }
      } catch (e) {
        console.warn(`Error processing season-year format "${lowerDesc}":`, e);
      }
    }

    console.warn(`Could not parse date range description: "${description}"`);
    return null;
  } catch (error) {
    console.error(
      `Critical error in parseNaturalLanguageDateRange: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    return null;
  }
}

/**
 * Formats a DateRange as a string for display or debugging
 * @param range - The DateRange to format
 * @param format - Optional format string (defaults to ISO format)
 * @returns A string representation of the date range
 */
export function formatDateRange(range: DateRange | null, format: string = 'iso'): string {
  if (!range) return 'Invalid date range';

  try {
    switch (format.toLowerCase()) {
      case 'iso':
        return `${formatISO(range.startDate).split('T')[0]} to ${
          formatISO(range.endDate).split('T')[0]
        }`;
      case 'human':
        return `From ${range.startDate.toLocaleDateString()} to ${range.endDate.toLocaleDateString()}`;
      default:
        return `${formatISO(range.startDate).split('T')[0]} to ${
          formatISO(range.endDate).split('T')[0]
        }`;
    }
  } catch (e) {
    console.error('Error formatting date range:', e);
    return 'Error formatting date range';
  }
}

export function formatDateRangeForQuery(range: DateRange): { startDate: string; endDate: string } {
  const formatDate = (date: Date): string => format(date, 'yyyy-MM-dd HH:mm:ss.SSS');
  return {
    startDate: formatDate(range.startDate),
    endDate: formatDate(range.endDate),
  };
}
