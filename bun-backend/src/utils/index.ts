import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from 'date-fns';
import { AnyColumn, sql } from 'drizzle-orm';
import sharp from 'sharp';

export async function compressImage(imageData: any) {
  try {
    const ext = imageData.mimetype.split('/')[1];
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif'];

    if (!allowedExtensions.includes(ext)) {
      throw new Error('Invalid image file format');
    }

    const reducedFile = await sharp(imageData.buffer)
      .resize(250, 250)
      .toBuffer();

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

export function forgotPasswordTemp(
  username: any,
  resetPasswordLink: any,
  email: any
) {
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

export function getIntervalValue(interval: any) {
  let startDate;
  let endDate;

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
      startDate = startOfYear(new Date('2000-01-01')).getTime();
      endDate = endOfDay(new Date()).getTime();
      break;

    default:
      startDate = startOfYear(new Date('1995-01-01')).getTime();
      endDate = endOfDay(new Date()).getTime();
      break;
  }
  const formatDate = (date: any) => {
    return format(date, 'yyyy-MM-dd HH:mm:ss.SSS');
  };
  return {
    startDate: formatDate(new Date(startDate)),
    endDate: formatDate(new Date(endDate)),
  };
}

export const getDateTruncate = (duration: string | undefined) => {
  switch (duration) {
    case 'today':
      return `TO_CHAR("createdAt"::timestamp, 'HH12') || TO_CHAR("createdAt"::timestamp, 'AM')`;
    case 'thisWeek':
      return `TO_CHAR("createdAt"::timestamp,'Day')`;
    case 'thisMonth':
      return `TO_CHAR("createdAt"::timestamp,'YYYY-MM-DD')`;
    case 'thisYear':
      return `TO_CHAR("createdAt"::timestamp,'MM-Mon')`;
    case 'all':
      return `TO_CHAR("createdAt"::timestamp,'YYYY')`;
    default:
      return `TO_CHAR("createdAt"::timestamp,'YYYY-MM-DD')`;
  }
};

export const increment = (
  column: AnyColumn,
  value: number | null | undefined
) => {
  return sql`${column} + ${value}`;
};
