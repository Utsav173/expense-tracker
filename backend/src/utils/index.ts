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
  isValid,
} from 'date-fns';
import { sql } from 'drizzle-orm';
import sharp from 'sharp';
import { Analytics } from '../database/schema';
import { db } from '../database';
import { HTTPException } from 'hono/http-exception';

export async function compressImage(imageData: any) {
  try {
    if (!imageData || typeof imageData.arrayBuffer !== 'function') {
      throw new Error('Invalid image data provided.');
    }

    const buffer = await imageData.arrayBuffer();
    if (!buffer || buffer.byteLength === 0) {
      throw new Error('Empty image buffer received.');
    }

    const metadata = await sharp(Buffer.from(buffer)).metadata();
    const format = metadata.format;

    if (!format || !['jpeg', 'jpg', 'png', 'gif', 'webp'].includes(format)) {
      throw new Error(`Invalid image format: ${format}. Allowed: jpg, jpeg, png, gif, webp.`);
    }

    const reducedFile = await sharp(Buffer.from(buffer))
      .resize(250, 250, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 }) // Convert to webp for better compression
      .toBuffer();

    const sizeInMB = reducedFile.length / (1024 * 1024);

    if (sizeInMB > 2) {
      throw new Error('Image size exceeds 2MB limit after compression.');
    }

    return {
      error: false,
      data: `data:image/webp;base64,${reducedFile.toString('base64')}`,
    };
  } catch (error) {
    console.error('Image compression error:', error);
    return {
      error: true,
      data: error instanceof Error ? error.message : 'Image processing failed.',
    };
  }
}

export function WelcomeEmailTemp(username: any, loginpage: any, email: any) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Expense Manager</title>
  <style>
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      background-color: #F5F7FA;
      margin: 0;
      padding: 0;
      color: #333333;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      padding: 30px;
      background-color: #FFFFFF;
      border-radius: 12px;
      box-shadow: 0px 4px 15px rgba(0, 0, 0, 0.1);
    }
    .logo {
      text-align: center;
      margin-bottom: 25px;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 1px solid #EEEEEE;
    }
    .header h1 {
      font-size: 32px;
      margin: 0;
      color: #2672FF;
    }
    .content {
      font-size: 16px;
      line-height: 1.6;
      margin-bottom: 35px;
      color: #555555;
    }
    .content p {
      margin-bottom: 15px;
    }
    .button-container {
      text-align: center;
      margin: 30px 0;
    }
    .button {
      display: inline-block;
      background-color: #2672FF;
      color: white !important;
      text-align: center;
      font-size: 16px;
      font-weight: bold;
      padding: 12px 30px;
      border-radius: 6px;
      text-decoration: none;
      transition: background-color 0.2s ease;
    }
    .button:hover {
      background-color: #1E5CC7;
    }
    .highlights {
      background-color: #F7FAFF;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 30px;
    }
    .highlights h3 {
      color: #2672FF;
      margin-top: 0;
    }
    .highlights ul {
      padding-left: 20px;
      margin-bottom: 0;
    }
    .highlights li {
      margin-bottom: 8px;
    }
    .footer {
      font-size: 14px;
      color: #999999;
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #EEEEEE;
    }
    .footer p {
      margin: 5px 0;
    }
    @media only screen and (max-width: 600px) {
      .container {
        padding: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">

    </div>
    <div class="header">
      <h1>Welcome to Expense Manager!</h1>
    </div>
    <div class="content">
      <p>Hi <strong>${username}</strong>,</p>
      <p>Thank you for signing up for Expense Manager. We're excited to have you join us!</p>

      <div class="highlights">
        <h3>Get Started In Minutes</h3>
        <ul>
          <li>Track all your expenses in one place</li>
          <li>Create custom categories and budgets</li>
          <li>Generate insightful reports</li>
          <li>Set spending alerts and goals</li>
        </ul>
      </div>

      <p>To begin your journey toward better financial management, simply log in to your account and start adding your expenses.</p>

      <div class="button-container">
        <a href="${loginpage}" class="button">Log In To Your Account</a>
      </div>

      <p>If you have any questions or need assistance getting started, our support team is always ready to help!</p>
    </div>
    <div class="footer">
      <p>This email was sent to <strong>${email}</strong>.</p>
      <p>If you did not sign up for Expense Manager, please disregard this email.</p>
      <p>© ${new Date().getFullYear()} Expense Manager | <a href="#" style="color: #999999;">Privacy Policy</a> | <a href="#" style="color: #999999;">Contact Support</a></p>
    </div>
  </div>
</body>
</html>
`;
}

export function forgotPasswordTemp(username: any, resetPasswordLink: any, email: any) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password - Expense Manager</title>
  <style>
     body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      background-color: #F5F7FA;
      margin: 0;
      padding: 0;
      color: #333333;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      padding: 30px;
      background-color: #FFFFFF;
      border-radius: 12px;
      box-shadow: 0px 4px 15px rgba(0, 0, 0, 0.1);
    }
    .logo {
      text-align: center;
      margin-bottom: 25px;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 1px solid #EEEEEE;
    }
    .header h1 {
      font-size: 28px;
      margin: 0;
      color: #2672FF;
    }
    .content {
      font-size: 16px;
      line-height: 1.6;
      margin-bottom: 35px;
      color: #555555;
    }
    .content p {
      margin-bottom: 15px;
    }
    .security-notice {
      background-color: #FFF8E6;
      border-left: 4px solid #FFB400;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .security-notice p {
      margin: 0;
      color: #7A5800;
    }
    .button-container {
      text-align: center;
      margin: 30px 0;
    }
    .button {
      display: inline-block;
      background-color: #2672FF;
      color: white !important;
      text-align: center;
      font-size: 16px;
      font-weight: bold;
      padding: 12px 30px;
      border-radius: 6px;
      text-decoration: none;
      transition: background-color 0.2s ease;
    }
    .button:hover {
      background-color: #1E5CC7;
    }
    .expiry-notice {
      font-size: 14px;
      text-align: center;
      color: #777777;
      margin-top: 15px;
    }
    .footer {
      font-size: 14px;
      color: #999999;
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #EEEEEE;
    }
    .footer p {
      margin: 5px 0;
    }
    @media only screen and (max-width: 600px) {
      .container {
        padding: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">

    </div>
    <div class="header">
      <h1>Reset Your Password</h1>
    </div>
    <div class="content">
      <p>Hi <strong>${username}</strong>,</p>
      <p>We received a request to reset the password for your Expense Manager account. To create a new password, please click the button below:</p>

      <div class="button-container">
        <a href="${resetPasswordLink}" class="button">Reset My Password</a>
      </div>

      <div class="expiry-notice">
        This password reset link will expire in 24 hours.
      </div>

      <div class="security-notice">
        <p><strong>Security Tip:</strong> For your protection, please create a unique password that you don't use for other websites.</p>
      </div>

      <p>If you didn't request a password reset, you can safely ignore this email. Your account security is important to us, so your password will remain unchanged.</p>
    </div>
    <div class="footer">
      <p>This email was sent to <strong>${email}</strong>.</p>
      <p>If you need assistance, please contact our support team at support@expensemanager.com</p>
      <p>© ${new Date().getFullYear()} Expense Manager | <a href="#" style="color: #999999;">Privacy Policy</a> | <a href="#" style="color: #999999;">Contact Support</a></p>
    </div>
  </div>
</body>
</html>`;
}

export async function getIntervalValue(interval: string | undefined): Promise<{
  startDate: string;
  endDate: string;
}> {
  let startDateTime: number;
  let endDateTime: number;
  const now = new Date();

  const formatDateInternal = (date: Date): string => {
    return format(date, 'yyyy-MM-dd HH:mm:ss.SSS');
  };

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
    if (days <= 31) return `TO_CHAR("createdAt"::timestamp, 'YYYY-MM-DD')`;
    if (days <= 366) return `TO_CHAR("createdAt"::timestamp, 'YYYY-MM')`;
    return `TO_CHAR("createdAt"::timestamp, 'YYYY')`;
  }

  switch (duration) {
    case 'today':
      return `TO_CHAR("createdAt"::timestamp, 'YYYY-MM-DD HH24')`;
    case 'thisWeek':
    case 'thisMonth':
      return `TO_CHAR("createdAt"::timestamp, 'YYYY-MM-DD')`;
    case 'thisYear':
      return `TO_CHAR("createdAt"::timestamp, 'YYYY-MM')`;
    case 'all':
      return `TO_CHAR("createdAt"::timestamp, 'YYYY')`;
    default:
      return `TO_CHAR("createdAt"::timestamp, 'YYYY-MM-DD')`;
  }
};

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

export const getDateFormatting = (duration: string | undefined): string => {
  if (duration && duration.includes(',')) {
    const [startStr, endStr] = duration.split(',');
    const startDate = new Date(startStr);
    const endDate = new Date(endStr);
    if (isValid(startDate) && isValid(endDate)) {
      const days = differenceInDays(endDate, startDate);
      if (days <= 31) return `TO_CHAR(date::date, 'Mon DD')`;
      if (days <= 366) return `TO_CHAR(date::date, 'Mon YYYY')`;
      return `date`;
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
      return `date`;
    default:
      return `TO_CHAR(date::date, 'Mon DD')`;
  }
};

export function calcPercentageChange(array: number[]): number {
  let sumPercentageChange = 0;
  let validPairsCount = 0;

  for (let i = 1; i < array.length; i++) {
    const current = Number(array[i]);
    const previous = Number(array[i - 1]);

    if (!isNaN(current) && !isNaN(previous) && previous !== 0) {
      const percentageChange = ((current - previous) / Math.abs(previous)) * 100;
      sumPercentageChange += percentageChange;
      validPairsCount++;
    }
  }

  const finalChange = validPairsCount > 0 ? sumPercentageChange / validPairsCount : 0;
  return isNaN(finalChange) ? 0 : finalChange;
}

export const increment = (
  column: keyof Pick<typeof Analytics, 'balance' | 'income' | 'expense'>,
  value: number | null | undefined,
) => {
  const validValue = Number(value) || 0;
  return sql`${Analytics[column]} + ${validValue}`;
};
