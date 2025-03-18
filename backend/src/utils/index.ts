import {
  add,
  differenceInDays,
  differenceInMonths,
  differenceInYears,
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
  sub,
} from 'date-fns';
import { sql } from 'drizzle-orm';
import sharp from 'sharp';
import { Analytics } from '../database/schema';
import { db } from '../database';

export async function compressImage(imageData: any) {
  try {
    // Check if imageData exists and has the expected properties
    if (!imageData || !imageData.type) {
      throw new Error('Invalid image data');
    }

    const ext = imageData.type.split('/')[1];
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif'];

    if (!allowedExtensions.includes(ext)) {
      throw new Error('Invalid image file format');
    }

    // Use arrayBuffer() instead of buffer for FormData file objects
    const buffer = await imageData.arrayBuffer();
    const reducedFile = await sharp(Buffer.from(buffer)).resize(250, 250).toBuffer();

    const size = reducedFile.length / (1024 * 1024); // Calculate size in MB

    if (size > 2) {
      throw new Error('Image size too large');
    }

    return {
      error: false,
      data: `data:image/${ext};base64,${reducedFile.toString('base64')}`,
    };
  } catch (error) {
    return {
      error: true,
      data: error instanceof Error ? error.message : 'Something went wrong',
    };
  }
}
export function WelcomeEmailTemp(username: any, loginpage: any, email: any) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Welcome to Expense Manager</title>
  <style>
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      background-color: #F2F2F2;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      padding: 20px;
      background-color: #FFFFFF;
      border-radius: 10px;
      box-shadow: 0px 0px 10px 0px rgba(0, 0, 0, 0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 20px;
    }
    .header h1 {
      font-size: 36px;
      margin: 0;
      color: #2672FF;
    }
    .content {
      font-size: 18px;
      line-height: 1.6;
      margin-bottom: 30px;
    }
    .button {
      display: block;
      margin: 0 auto;
      background-color: #FFFFFF;
      text-align: center;
      font-size: 18px;
      font-weight: bold;
      padding: 12px 30px;
      border-radius: 30px;
      text-decoration: none;
      transition: border 0.2s ease;
      border: 1px solid transparent;
    }
    
    .button:hover {
      border: 1px solid #214B8F;
    }
    .footer {
      font-size: 14px;
      color: #999999;
      text-align: center;
      margin-top: 30px;
    }
    .footer p {
      margin: 5px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to Expense Manager!</h1>
    </div>
    <div class="content">
      <p>Hi <strong>${username}</strong>,</p>
      <p>Thank you for signing up for Expense Manager. We're excited to have you as a user!</p>
      <p>With Expense Manager, you can easily track your expenses and stay on top of your budget. To get started, simply log in to your account and start adding your expenses.</p>
      <p>Log in to your account by clicking the button below:</p>
      <a href="${loginpage}" class="button">Log In</a>
    </div>
    <div class="footer">
      <p>This email was sent to <strong>${email}</strong>. If you did not sign up for Expense Manager, please ignore this email.</p>
      <p>If you have any questions or need assistance, feel free to contact our support team at support@expensemanager.com.</p>
    </div>
  </div>
</body>
</html>
`;
}

export function forgotPasswordTemp(username: any, resetPasswordLink: any, email: any) {
  return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Forgot Password - Expense Manager</title>
        <style>
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            background-color: #F2F2F2;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 20px auto;
            padding: 20px;
            background-color: #FFFFFF;
            border-radius: 10px;
            box-shadow: 0px 0px 10px 0px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 20px;
          }
          .header h1 {
            font-size: 36px;
            margin: 0;
            color: #2672FF;
          }
          .content {
            font-size: 18px;
            line-height: 1.6;
            margin-bottom: 30px;
          }
          .button {
            display: block;
            margin: 0 auto;
            background-color: #FFFFFF;
            text-align: center;
            font-size: 18px;
            font-weight: bold;
            padding: 12px 30px;
            border-radius: 30px;
            text-decoration: none;
            transition: border 0.2s ease;
            border: 1px solid transparent;
          }
          
          .button:hover {
            border: 1px solid #214B8F;
          }
          
          .footer {
            font-size: 14px;
            color: #999999;
            text-align: center;
            margin-top: 30px;
          }
          .footer p {
            margin: 5px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Forgot Password - Expense Manager</h1>
          </div>
          <div class="content">
            <p>Hi <strong>${username}</strong>,</p>
            <p>We received a request to reset your Expense Manager account password. To reset your password, please click the button below:</p>
            <a href="${resetPasswordLink}" class="button">Reset Password</a>
            <p>If you did not request a password reset, you can safely ignore this email.</p>
          </div>
          <div class="footer">
            <p>This email was sent to <strong>${email}</strong>. If you did not request a password reset, please ignore this email.</p>
            <p>If you have any questions or need assistance, feel free to contact our support team at support@expensemanager.com.</p>
          </div>
        </div>
      </body>
    </html>`;
}

export async function getIntervalValue(interval: any) {
  let startDate: any;
  let endDate: any;

  if (interval?.split(',').length == 2) {
    startDate = new Date(interval.split(',')[0]).getTime();
    endDate = new Date(interval.split(',')[1]).getTime();
  } else {
    switch (interval) {
      case 'today':
        startDate = startOfDay(new Date()).getTime();
        endDate = endOfDay(new Date()).getTime();
        break;

      case 'thisMonth':
        startDate = startOfMonth(new Date()).getTime();
        endDate = endOfMonth(new Date()).getTime();
        break;

      case 'thisWeek':
        startDate = startOfWeek(new Date()).getTime();
        endDate = endOfWeek(new Date()).getTime();
        break;

      case 'thisYear':
        startDate = startOfYear(new Date()).getTime();
        endDate = endOfYear(new Date()).getTime();
        break;

      case 'all':
        const data: any = await db
          .execute(sql`select min("createdAt") from "transaction"`)
          .catch((err) => {
            console.log(err);
          });
        startDate = startOfYear(new Date(String(data[0].min))).getTime();
        endDate = endOfDay(new Date()).getTime();
        break;

      default:
        startDate = startOfYear(new Date(0)).getTime();
        endDate = endOfDay(new Date()).getTime();
        break;
    }
  }

  const formatDate = (date: any) => {
    return format(date, 'yyyy-MM-dd HH:mm:ss.SSS');
  };
  return {
    startDate: formatDate(new Date(startDate)),
    endDate: formatDate(new Date(endDate)),
  };
}

export function getSQLInterval(startDate: any, endDate: any) {
  startDate = new Date(startDate);
  endDate = new Date(endDate);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    throw new Error('Invalid date format');
  }

  const days = differenceInDays(endDate, startDate);
  const years = differenceInYears(endDate, startDate);

  switch (true) {
    case days <= 1 && days > 0: // "today"
      return `'${format(
        sub(startDate, { days: 1 }),
        'yyyy-MM-dd HH:mm:ss.SSS',
      )}'::timestamp AND '${format(
        startDate,
        'yyyy-MM-dd HH:mm:ss.SSS',
      )}'::timestamp - INTERVAL '1 second'`;
    case days <= 7 && days > 1: // "week"
      return `'${format(
        sub(startDate, { weeks: 1 }),
        'yyyy-MM-dd HH:mm:ss.SSS',
      )}'::timestamp AND '${format(
        startDate,
        'yyyy-MM-dd HH:mm:ss.SSS',
      )}'::timestamp - INTERVAL '1 second'`;
    case days <= 30: // "month"
      return `'${format(
        sub(startDate, { months: 1 }),
        'yyyy-MM-dd HH:mm:ss.SSS',
      )}'::timestamp AND '${format(
        startDate,
        'yyyy-MM-dd HH:mm:ss.SSS',
      )}'::timestamp - INTERVAL '1 second'`;
    case years >= 5: // "5 years"
      return `'${format(
        sub(Date.now(), { years: 5 }),
        'yyyy-MM-dd HH:mm:ss.SSS',
      )}'::timestamp AND '${format(
        Date.now(),
        'yyyy-MM-dd HH:mm:ss.SSS',
      )}'::timestamp - INTERVAL '1 second'`;
    case years >= 1: // "year"
      return `'${format(
        sub(startDate, { years: 1 }),
        'yyyy-MM-dd HH:mm:ss.SSS',
      )}'::timestamp AND '${format(
        startDate,
        'yyyy-MM-dd HH:mm:ss.SSS',
      )}'::timestamp - INTERVAL '1 second'`;
    default:
      return `'${format(
        sub(startDate, { months: 1 }),
        'yyyy-MM-dd HH:mm:ss.SSS',
      )}'::timestamp AND '${format(
        startDate,
        'yyyy-MM-dd HH:mm:ss.SSS',
      )}'::timestamp - INTERVAL '1 second'`;
  }
}

export const getDateTruncate = (duration: string | undefined) => {
  if (duration?.split(',').length == 2) {
    let startDate = new Date(duration.split(',')[0]).getTime();
    let endDate = new Date(duration.split(',')[1]).getTime();

    const difference = endDate - startDate;
    const days = difference / (1000 * 3600 * 24);

    // For ranges less than a month, group by day
    if (days <= 31) {
      return `TO_CHAR("createdAt"::timestamp, 'YYYY-MM-DD')`;
    }
    // For ranges greater than a month but less than a year, group by month
    else if (days <= 366) {
      return `TO_CHAR("createdAt"::timestamp, 'YYYY-MM')`;
    }
    // For ranges greater than a year, group by year
    else {
      return `TO_CHAR("createdAt"::timestamp, 'YYYY')`;
    }
  } else {
    switch (duration) {
      case 'today':
        // For today, group by hour
        return `TO_CHAR("createdAt"::timestamp, 'HH12') || TO_CHAR("createdAt"::timestamp, 'AM')`;
      case 'thisWeek':
        // For the past 7 days, group by day with full date for proper ordering
        return `TO_CHAR("createdAt"::timestamp, 'YYYY-MM-DD')`;
      case 'thisMonth':
        // For month, group by day
        return `TO_CHAR("createdAt"::timestamp, 'YYYY-MM-DD')`;
      case 'thisYear':
        // For year, group by month
        return `TO_CHAR("createdAt"::timestamp, 'YYYY-MM')`;
      case 'all':
        // For all time, group by year
        return `TO_CHAR("createdAt"::timestamp, 'YYYY')`;
      default:
        return `TO_CHAR("createdAt"::timestamp, 'YYYY-MM-DD')`;
    }
  }
};

export const getOrderBy = (dateTruncate: string) => {
  // If the date format includes just the day name, we need to order differently
  if (dateTruncate.includes('Day')) {
    return `CASE 
      WHEN date = 'Sunday' THEN 1
      WHEN date = 'Monday' THEN 2
      WHEN date = 'Tuesday' THEN 3
      WHEN date = 'Wednesday' THEN 4
      WHEN date = 'Thursday' THEN 5
      WHEN date = 'Friday' THEN 6
      WHEN date = 'Saturday' THEN 7
      ELSE 8
    END`;
  }

  // For month names, we need custom ordering too
  if (dateTruncate.includes('Mon')) {
    return `CASE 
      WHEN substring(date, 1, 2) = '01' THEN 1
      WHEN substring(date, 1, 2) = '02' THEN 2
      WHEN substring(date, 1, 2) = '03' THEN 3
      WHEN substring(date, 1, 2) = '04' THEN 4
      WHEN substring(date, 1, 2) = '05' THEN 5
      WHEN substring(date, 1, 2) = '06' THEN 6
      WHEN substring(date, 1, 2) = '07' THEN 7
      WHEN substring(date, 1, 2) = '08' THEN 8
      WHEN substring(date, 1, 2) = '09' THEN 9
      WHEN substring(date, 1, 2) = '10' THEN 10
      WHEN substring(date, 1, 2) = '11' THEN 11
      WHEN substring(date, 1, 2) = '12' THEN 12
      ELSE 13
    END`;
  }

  return 'date';
};

export const getDateFormatting = (duration: string | undefined) => {
  return 'date';
};

export function calcPercentageChange(array: any[]) {
  let sumPercentageChange = 0;
  let validPairsCount = 0;

  // Calculate sum of percentage changes
  for (let i = 1; i < array.length; i++) {
    const current = Number(array[i]);
    const previous = Number(array[i - 1]);

    // Check if both current and previous values are valid (numeric)
    if (!isNaN(current) && !isNaN(previous) && previous !== 0) {
      const percentageChange = ((current - previous) / Math.abs(previous)) * 100;
      sumPercentageChange += percentageChange;
      validPairsCount++;
    }
  }

  // Calculate average percentage change
  const finalChange = validPairsCount > 0 ? sumPercentageChange / validPairsCount : NaN;
  return finalChange;
}

export const increment = (
  column: 'balance' | 'income' | 'expense',
  value: number | null | undefined,
) => {
  return sql`${Analytics[column]} + ${value}`;
};
