import nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import { HTTPException } from 'hono/http-exception';
import {
  WelcomeEmailTemp,
  billReminderEmailTemp,
  budgetAlertEmailTemp,
  forgotPasswordTemp,
  goalReminderEmailTemp,
} from '../utils/email.utils';
import { config } from '../config';

// Define a type for email options for better structure
interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export class EmailService {
  private transporter: Mail;

  constructor() {
    // Configure the transporter once
    // TODO: Replace with configuration loading later (Step 5)
    if (!config.GMAIL_USERNAME || !config.GMAIL_PASS) {
      console.warn(
        'EmailService: GMAIL_USERNAME or GMAIL_PASS environment variables not set. Email sending will likely fail.',
      );
      // Create a dummy transporter or throw an error if email is critical
      this.transporter = nodemailer.createTransport({
        jsonTransport: true, // Doesn't send emails, just generates messages
      });
    } else {
      this.transporter = nodemailer.createTransport({
        service: 'gmail', // Or use SMTP host/port/user/pass from env vars
        auth: {
          user: config.GMAIL_USERNAME,
          pass: config.GMAIL_PASS, // Use App Password for Gmail
        },
      });
    }
  }

  /**
   * Sends an email using the configured transporter.
   * Logs errors but doesn't throw to avoid blocking primary operations.
   * @param options - Email options (to, subject, html).
   */
  async sendMail(options: EmailOptions): Promise<void> {
    const mailOptions = {
      from: `"Expense Tracker" <${config.GMAIL_USERNAME || 'noreply@example.com'}>`, // Use a display name and configured sender
      to: options.to,
      subject: options.subject,
      html: options.html,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`Email sent: ${options.subject} to ${options.to}. Response: ${info.response}`);
    } catch (error: any) {
      console.error(`Failed to send email "${options.subject}" to ${options.to}:`, error.message);
      // Decide if this should throw or just log. Logging for now.
      // throw new HTTPException(500, { message: `Failed to send email: ${error.message}` });
    }
  }

  /**
   * Sends the welcome email.
   */
  async sendWelcomeEmail(username: string, email: string): Promise<void> {
    const loginPageUrl = config.LOGINPAGE || '#'; // Get URL from env
    const html = WelcomeEmailTemp(username, loginPageUrl, email);
    await this.sendMail({
      to: email,
      subject: 'Welcome to Expense Tracker!',
      html: html,
    });
  }

  /**
   * Sends the forgot password email.
   */
  async sendForgotPasswordEmail(username: string, email: string, token: string): Promise<void> {
    const resetPageUrl = config.RESETPAGE || '#'; // Get URL from env
    const resetLink = `${resetPageUrl}?token=${token}`;
    const html = forgotPasswordTemp(username, resetLink, email);
    await this.sendMail({
      to: email,
      subject: 'Expense Tracker - Reset Your Password',
      html: html,
    });
  }

  /**
   * Sends the account share notification email.
   */
  async sendShareNotificationEmail(
    targetEmail: string,
    accountName: string,
    sharerName?: string,
  ): Promise<void> {
    const subject = `Expense Tracker: Account Shared - ${accountName}`;
    const html = `<p>Hello,</p><p>The Expense Tracker account "<strong>${accountName}</strong>"${
      sharerName ? ` shared by ${sharerName}` : ''
    } has been shared with you.</p><p>You can now view its details within the app.</p>`; // Simple template
    await this.sendMail({
      to: targetEmail,
      subject: subject,
      html: html,
    });
  }

  async sendBudgetAlertEmail(
    userEmail: string,
    username: string,
    budgetDetails: {
      categoryName: string;
      budgetedAmount: number;
      spentAmount: number;
      period: string;
      currency: string;
    },
    alertType: 'approaching' | 'exceeded',
  ): Promise<void> {
    const html = budgetAlertEmailTemp(username, budgetDetails, alertType);
    const subject =
      alertType === 'exceeded'
        ? `Budget Exceeded: ${budgetDetails.categoryName}`
        : `Budget Alert: ${budgetDetails.categoryName}`;
    await this.sendMail({
      to: userEmail,
      subject: subject,
      html: html,
    });
  }

  async sendGoalReminderEmail(
    userEmail: string,
    username: string,
    goalDetails: {
      goalName: string;
      targetDate: string;
      remainingAmount: number;
      currency: string;
    },
  ): Promise<void> {
    const html = goalReminderEmailTemp(username, goalDetails);
    await this.sendMail({
      to: userEmail,
      subject: `Saving Goal Reminder: ${goalDetails.goalName}`,
      html: html,
    });
  }

  async sendBillReminderEmail(
    userEmail: string,
    username: string,
    billDetails: {
      description: string;
      amount: number;
      dueDate: string;
      currency: string;
    },
  ): Promise<void> {
    const html = billReminderEmailTemp(username, billDetails);
    await this.sendMail({
      to: userEmail,
      subject: `Upcoming Bill Reminder: ${billDetails.description}`,
      html: html,
    });
  }
}

// Export a singleton instance
export const emailService = new EmailService();
