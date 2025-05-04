import {
  differenceInDays,
  differenceInYears,
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
  sub,
  isValid,
  format,
} from 'date-fns';
import { HTTPException } from 'hono/http-exception';
import { db } from '../database';
import { sql } from 'drizzle-orm';

/**
 * Calculates the start and end dates of the interval immediately preceding the given interval.
 * @param startDateStr - The start date of the current interval (YYYY-MM-DD or parsable string).
 * @param endDateStr - The end date of the current interval (YYYY-MM-DD or parsable string).
 * @returns Object with { prevStartDate: Date, prevEndDate: Date } or null if dates are invalid.
 */
export function getPreviousInterval(
  startDateStr: string,
  endDateStr: string,
): { prevStartDate: Date; prevEndDate: Date } | null {
  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);

  if (!isValid(startDate) || !isValid(endDate)) {
    console.error('Invalid dates passed to getPreviousInterval');
    return null;
  }

  const daysDiff = differenceInDays(endDate, startDate);

  let prevStartDate: Date;
  let prevEndDate: Date;

  if (daysDiff <= 1) {
    prevStartDate = sub(startDate, { days: 1 });
    prevEndDate = endOfDay(prevStartDate);
  } else if (daysDiff <= 7) {
    prevStartDate = sub(startDate, { weeks: 1 });
    prevEndDate = endOfDay(sub(endDate, { weeks: 1 }));
  } else if (daysDiff >= 28 && daysDiff <= 31) {
    prevStartDate = sub(startDate, { months: 1 });
    prevEndDate = endOfDay(sub(endDate, { months: 1 }));
  } else if (daysDiff >= 365 && daysDiff <= 366) {
    prevStartDate = sub(startDate, { years: 1 });
    prevEndDate = endOfDay(sub(endDate, { years: 1 }));
  } else {
    const intervalDays = daysDiff + 1;
    prevStartDate = sub(startDate, { days: intervalDays });
    prevEndDate = sub(endDate, { days: intervalDays });
    prevEndDate = endOfDay(prevEndDate);
  }

  prevStartDate = startOfDay(prevStartDate);

  return { prevStartDate, prevEndDate };
}

export const formatDateInternal = (date: Date): string => {
  return format(date, 'yyyy-MM-dd HH:mm:ss.SSS');
};

/**
 * Calculates the start and end date strings based on a duration string or custom range.
 * @param interval - Duration string ('today', 'thisWeek', 'thisMonth', 'thisYear', 'all') or custom range ('YYYY-MM-DD,YYYY-MM-DD').
 * @returns Object with { startDate: string, endDate: string } in 'yyyy-MM-dd HH:mm:ss.SSS' format.
 */
export async function getIntervalValue(interval: string | undefined): Promise<{
  startDate: string;
  endDate: string;
}> {
  let startDateTime: number;
  let endDateTime: number;
  const now = new Date();

  if (interval && interval.includes(',')) {
    const [startStr, endStr] = interval.split(',');
    const parsedStartDate = new Date(startStr);
    const parsedEndDate = new Date(endStr);

    if (!isValid(parsedStartDate) || !isValid(parsedEndDate) || parsedStartDate >= parsedEndDate) {
      throw new HTTPException(400, { message: 'Invalid custom date range format or order.' });
    }
    startDateTime = startOfDay(parsedStartDate).getTime();
    endDateTime = endOfDay(parsedEndDate).getTime();
  } else {
    switch (interval) {
      case 'today':
        startDateTime = startOfDay(now).getTime();
        endDateTime = endOfDay(now).getTime();
        break;
      case 'thisMonth':
        startDateTime = startOfMonth(now).getTime();
        endDateTime = endOfMonth(now).getTime();
        break;
      case 'thisWeek':
        startDateTime = startOfWeek(now).getTime();
        endDateTime = endOfWeek(now).getTime();
        break;
      case 'thisYear':
        startDateTime = startOfYear(now).getTime();
        endDateTime = endOfYear(now).getTime();
        break;
      case 'all':
        try {
          const result = await db.execute<{ min: string | null }>(
            sql`SELECT MIN("createdAt") as min FROM "transaction"`,
          );
          const firstTransactionDateStr = result.rows?.[0]?.min;
          const firstTransactionDate = firstTransactionDateStr
            ? new Date(firstTransactionDateStr)
            : null;

          if (firstTransactionDate && isValid(firstTransactionDate)) {
            startDateTime = startOfYear(firstTransactionDate).getTime();
          } else {
            startDateTime = startOfYear(now).getTime();
          }
        } catch (err: any) {
          console.error('Error fetching min transaction date:', err);
          startDateTime = startOfYear(now).getTime();
        }
        endDateTime = endOfDay(now).getTime();
        break;
      default:
        startDateTime = startOfMonth(now).getTime();
        endDateTime = endOfMonth(now).getTime();
        break;
    }
  }

  return {
    startDate: formatDateInternal(new Date(startDateTime)),
    endDate: formatDateInternal(new Date(endDateTime)),
  };
}

/**
 * Generates a SQL string representing the previous date interval.
 * @param startDateStr - Start date of the current interval.
 * @param endDateStr - End date of the current interval.
 * @returns SQL string like "'YYYY-MM-DD HH:MI:SS.ms'::timestamp AND 'YYYY-MM-DD HH:MI:SS.ms'::timestamp".
 */
export function getSQLInterval(startDateStr: string, endDateStr: string): string {
  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);

  if (!isValid(startDate) || !isValid(endDate)) {
    throw new Error('Invalid date format provided to getSQLInterval');
  }

  const formatDateForSQL = (date: Date) => format(date, 'yyyy-MM-dd HH:mm:ss.SSS');

  const daysDiff = differenceInDays(endDate, startDate);

  let prevStartDate: Date;
  let prevEndDate: Date;

  if (daysDiff <= 1) {
    prevStartDate = sub(startDate, { days: 1 });
    prevEndDate = sub(endDate, { days: 1 });
  } else if (daysDiff <= 7) {
    prevStartDate = sub(startDate, { weeks: 1 });
    prevEndDate = sub(endDate, { weeks: 1 });
  } else if (daysDiff <= 31) {
    prevStartDate = sub(startDate, { months: 1 });
    prevEndDate = sub(endDate, { months: 1 });
  } else if (daysDiff <= 366) {
    prevStartDate = sub(startDate, { years: 1 });
    prevEndDate = sub(endDate, { years: 1 });
  } else {
    const yearsDiff = differenceInYears(endDate, startDate);
    prevStartDate = sub(startDate, { years: yearsDiff });
    prevEndDate = sub(endDate, { years: yearsDiff });
  }

  return `'${formatDateForSQL(prevStartDate)}'::timestamp AND '${formatDateForSQL(
    prevEndDate,
  )}'::timestamp`;
}

/**
 * Determines the appropriate date truncation level for SQL based on interval duration.
 * @param duration - The duration string (e.g., 'today', 'thisWeek', 'YYYY-MM-DD,YYYY-MM-DD').
 * @returns SQL string for date_trunc function (e.g., 'day', 'month', 'year').
 */
export const getDateTruncate = (duration: string | undefined): string => {
  let startDate: Date | null = null;
  let endDate: Date | null = null;

  if (duration && duration.includes(',')) {
    const [startStr, endStr] = duration.split(',');
    startDate = new Date(startStr);
    endDate = new Date(endStr);
    if (!isValid(startDate) || !isValid(endDate)) {
      startDate = null;
      endDate = null;
    }
  }

  if (startDate && endDate) {
    const days = differenceInDays(endDate, startDate);
    if (days <= 31) return `date_trunc('day', "createdAt"::timestamp)::date`;
    if (days <= 366) return `date_trunc('month', "createdAt"::timestamp)::date`;
    return `date_trunc('year', "createdAt"::timestamp)::date`;
  }

  switch (duration) {
    case 'today':
      return `date_trunc('hour', "createdAt"::timestamp)::timestamp`;
    case 'thisWeek':
    case 'thisMonth':
      return `date_trunc('day', "createdAt"::timestamp)::date`;
    case 'thisYear':
      return `date_trunc('month', "createdAt"::timestamp)::date`;
    case 'all':
      return `date_trunc('year', "createdAt"::timestamp)::date`;
    default:
      return `date_trunc('day', "createdAt"::timestamp)::date`;
  }
};

/**
 * Determines the SQL date formatting string based on interval duration.
 * @param duration - The duration string.
 * @returns SQL formatting string (e.g., 'Mon DD', 'Mon YYYY', 'YYYY').
 */
export const getDateFormatting = (duration: string | undefined): string => {
  if (duration && duration.includes(',')) {
    const [startStr, endStr] = duration.split(',');
    const startDate = new Date(startStr);
    const endDate = new Date(endStr);
    if (isValid(startDate) && isValid(endDate)) {
      const days = differenceInDays(endDate, startDate);
      if (days <= 31) return `TO_CHAR(date::date, 'Mon DD')`;
      if (days <= 366) return `TO_CHAR(date::date, 'Mon YYYY')`;
      return `TO_CHAR(date::date, 'YYYY')`;
    }
  }

  switch (duration) {
    case 'today':
      return `TO_CHAR(date::timestamp, 'HH12:MI AM')`;
    case 'thisWeek':
    case 'thisMonth':
      return `TO_CHAR(date::date, 'Mon DD')`;
    case 'thisYear':
      return `TO_CHAR(date::date, 'Mon YYYY')`;
    case 'all':
      return `TO_CHAR(date::date, 'YYYY')`;
    default:
      return `TO_CHAR(date::date, 'Mon DD')`;
  }
};

/**
 * Determines the ORDER BY clause based on the date truncation level.
 * @param dateTruncateSQL - The SQL string used for date_trunc.
 * @returns SQL string for ORDER BY clause (e.g., 'date_interval').
 */
export const getOrderBy = (dateTruncateSQL: string): string => {
  if (dateTruncateSQL.includes('HH24')) {
    return `date`;
  }
  if (dateTruncateSQL.includes('YYYY-MM-DD')) {
    return `date`;
  }
  if (dateTruncateSQL.includes('YYYY-MM')) {
    return `date`;
  }
  if (dateTruncateSQL.includes('YYYY')) {
    return `date`;
  }
  return 'date';
};
