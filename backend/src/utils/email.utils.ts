/**
 * Generates the HTML content for a welcome email.
 * @param username - The name of the new user.
 * @param loginpage - The URL to the login page.
 * @param email - The user's email address.
 * @returns HTML string for the email body.
 */
export function WelcomeEmailTemp(username: string, loginpage: string, email: string): string {
  const safeUsername = username || 'Valued User';
  const safeLoginpage = loginpage || '#';
  const safeEmail = email || 'your email address';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Expense Manager</title>
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #F5F7FA; margin: 0; padding: 0; color: #333333; }
    .container { max-width: 600px; margin: 20px auto; padding: 30px; background-color: #FFFFFF; border-radius: 12px; box-shadow: 0px 4px 15px rgba(0, 0, 0, 0.1); }
    .logo { text-align: center; margin-bottom: 25px; }
    .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid #EEEEEE; }
    .header h1 { font-size: 32px; margin: 0; color: #2672FF; }
    .content { font-size: 16px; line-height: 1.6; margin-bottom: 35px; color: #555555; }
    .content p { margin-bottom: 15px; }
    .button-container { text-align: center; margin: 30px 0; }
    .button { display: inline-block; background-color: #2672FF; color: white !important; text-align: center; font-size: 16px; font-weight: bold; padding: 12px 30px; border-radius: 6px; text-decoration: none; transition: background-color 0.2s ease; }
    .button:hover { background-color: #1E5CC7; }
    .highlights { background-color: #F7FAFF; border-radius: 8px; padding: 20px; margin-bottom: 30px; }
    .highlights h3 { color: #2672FF; margin-top: 0; }
    .highlights ul { padding-left: 20px; margin-bottom: 0; }
    .highlights li { margin-bottom: 8px; }
    .footer { font-size: 14px; color: #999999; text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #EEEEEE; }
    .footer p { margin: 5px 0; }
    @media only screen and (max-width: 600px) { .container { padding: 20px; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo"></div>
    <div class="header"><h1>Welcome to Expense Manager!</h1></div>
    <div class="content">
      <p>Hi <strong>${safeUsername}</strong>,</p>
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
      <div class="button-container"><a href="${safeLoginpage}" class="button">Log In To Your Account</a></div>
      <p>If you have any questions or need assistance getting started, our support team is always ready to help!</p>
    </div>
    <div class="footer">
      <p>This email was sent to <strong>${safeEmail}</strong>.</p>
      <p>If you did not sign up for Expense Manager, please disregard this email.</p>
      <p>© ${new Date().getFullYear()} Expense Manager | <a href="#" style="color: #999999;">Privacy Policy</a> | <a href="#" style="color: #999999;">Contact Support</a></p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Generates the HTML content for a forgot password email.
 * @param username - The name of the user.
 * @param resetPasswordLink - The URL for the password reset page.
 * @param email - The user's email address.
 * @returns HTML string for the email body.
 */
export function forgotPasswordTemp(
  username: string,
  resetPasswordLink: string,
  email: string,
): string {
  const safeUsername = username || 'User';
  const safeResetLink = resetPasswordLink || '#';
  const safeEmail = email || 'your email address';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password - Expense Manager</title>
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #F5F7FA; margin: 0; padding: 0; color: #333333; }
    .container { max-width: 600px; margin: 20px auto; padding: 30px; background-color: #FFFFFF; border-radius: 12px; box-shadow: 0px 4px 15px rgba(0, 0, 0, 0.1); }
    .logo { text-align: center; margin-bottom: 25px; }
    .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid #EEEEEE; }
    .header h1 { font-size: 32px; margin: 0; color: #2672FF; }
    .content { font-size: 16px; line-height: 1.6; margin-bottom: 35px; color: #555555; }
    .content p { margin-bottom: 15px; }
    .security-notice { background-color: #FFF8E6; border-left: 4px solid #FFB400; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .security-notice p { margin: 0; color: #7A5800; }
    .button-container { text-align: center; margin: 30px 0; }
    .button { display: inline-block; background-color: #2672FF; color: white !important; text-align: center; font-size: 16px; font-weight: bold; padding: 12px 30px; border-radius: 6px; text-decoration: none; transition: background-color 0.2s ease; }
    .button:hover { background-color: #1E5CC7; }
    .expiry-notice { font-size: 14px; text-align: center; color: #777777; margin-top: 15px; }
    .footer { font-size: 14px; color: #999999; text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #EEEEEE; }
    .footer p { margin: 5px 0; }
    @media only screen and (max-width: 600px) { .container { padding: 20px; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo"></div>
    <div class="header"><h1>Reset Your Password</h1></div>
    <div class="content">
      <p>Hi <strong>${safeUsername}</strong>,</p>
      <p>We received a request to reset the password for your Expense Manager account. To create a new password, please click the button below:</p>
      <div class="button-container"><a href="${safeResetLink}" class="button">Reset My Password</a></div>
      <div class="expiry-notice">This password reset link will expire in 24 hours.</div>
      <div class="security-notice"><p><strong>Security Tip:</strong> For your protection, please create a unique password that you don't use for other websites.</p></div>
      <p>If you didn't request a password reset, you can safely ignore this email. Your account security is important to us, so your password will remain unchanged.</p>
    </div>
    <div class="footer">
      <p>This email was sent to <strong>${safeEmail}</strong>.</p>
      <p>If you need assistance, please contact our support team at support@expensemanager.com</p>
      <p>© ${new Date().getFullYear()} Expense Manager | <a href="#" style="color: #999999;">Privacy Policy</a> | <a href="#" style="color: #999999;">Contact Support</a></p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Generates HTML for a budget alert email.
 * @param username User's name.
 * @param budgetDetails Details like category name, budgeted amount, spent amount, period.
 * @param alertType 'approaching' or 'exceeded'.
 * @returns HTML string.
 */
export function budgetAlertEmailTemp(
  username: string,
  budgetDetails: {
    categoryName: string;
    budgetedAmount: number;
    spentAmount: number;
    period: string;
    currency: string;
  },
  alertType: 'approaching' | 'exceeded',
): string {
  const safeUsername = username || 'User';
  const { categoryName, budgetedAmount, spentAmount, period, currency } = budgetDetails;
  const percentageSpent = budgetedAmount > 0 ? (spentAmount / budgetedAmount) * 100 : 0;
  const subject =
    alertType === 'exceeded'
      ? `Budget Exceeded for ${categoryName}`
      : `Budget Alert for ${categoryName}`;
  const message =
    alertType === 'exceeded'
      ? `You have exceeded your budget of ${currency}${budgetedAmount.toFixed(
          2,
        )} for <strong>${categoryName}</strong> in ${period}. You have spent ${currency}${spentAmount.toFixed(
          2,
        )} (${percentageSpent.toFixed(1)}%).`
      : `You are approaching your budget limit for <strong>${categoryName}</strong> in ${period}. You have spent ${currency}${spentAmount.toFixed(
          2,
        )} of your ${currency}${budgetedAmount.toFixed(2)} budget (${percentageSpent.toFixed(
          1,
        )}%).`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject} - Expense Manager</title>
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #F5F7FA; margin: 0; padding: 0; color: #333333; }
    .container { max-width: 600px; margin: 20px auto; padding: 30px; background-color: #FFFFFF; border-radius: 12px; box-shadow: 0px 4px 15px rgba(0, 0, 0, 0.1); }
    .logo { text-align: center; margin-bottom: 25px; }
    .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid #EEEEEE; }
    .header h1 { font-size: 32px; margin: 0; color: #2672FF; }
    .content { font-size: 16px; line-height: 1.6; margin-bottom: 35px; color: #555555; }
    .content p { margin-bottom: 15px; }
    .budget-details { background-color: ${
      alertType === 'exceeded' ? '#FFE6E6' : '#FFF8E6'
    }; border-left: 4px solid ${
    alertType === 'exceeded' ? '#FF4444' : '#FFB400'
  }; padding: 20px; margin: 20px 0; border-radius: 8px; }
    .budget-details h3 { color: ${
      alertType === 'exceeded' ? '#CC0000' : '#7A5800'
    }; margin-top: 0; margin-bottom: 15px; }
    .budget-details p { margin: 8px 0; color: ${alertType === 'exceeded' ? '#CC0000' : '#7A5800'}; }
    .budget-stats { display: flex; justify-content: space-between; margin-top: 15px; }
    .stat-item { text-align: center; flex: 1; }
    .stat-item strong { display: block; font-size: 18px; margin-bottom: 5px; }
    .stat-item span { font-size: 14px; color: #777777; }
    .button-container { text-align: center; margin: 30px 0; }
    .button { display: inline-block; background-color: #2672FF; color: white !important; text-align: center; font-size: 16px; font-weight: bold; padding: 12px 30px; border-radius: 6px; text-decoration: none; transition: background-color 0.2s ease; }
    .button:hover { background-color: #1E5CC7; }
    .footer { font-size: 14px; color: #999999; text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #EEEEEE; }
    .footer p { margin: 5px 0; }
    @media only screen and (max-width: 600px) { 
      .container { padding: 20px; } 
      .budget-stats { flex-direction: column; gap: 15px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo"></div>
    <div class="header"><h1>${
      alertType === 'exceeded' ? '⚠️ Budget Exceeded' : '📊 Budget Alert'
    }</h1></div>
    <div class="content">
      <p>Hi <strong>${safeUsername}</strong>,</p>
      <p>${message}</p>
      <div class="budget-details">
        <h3>Budget Summary - ${categoryName}</h3>
        <div class="budget-stats">
          <div class="stat-item">
            <strong>${currency}${budgetedAmount.toFixed(2)}</strong>
            <span>Budgeted</span>
          </div>
          <div class="stat-item">
            <strong>${currency}${spentAmount.toFixed(2)}</strong>
            <span>Spent</span>
          </div>
          <div class="stat-item">
            <strong>${percentageSpent.toFixed(1)}%</strong>
            <span>Used</span>
          </div>
        </div>
        <p><strong>Period:</strong> ${period}</p>
      </div>
      <p>${
        alertType === 'exceeded'
          ? 'Consider reviewing your recent expenses in this category to get back on track.'
          : 'Consider reviewing your spending in this category to stay within your budget.'
      }</p>
      <div class="button-container"><a href="#" class="button">View Expense Details</a></div>
    </div>
    <div class="footer">
      <p>This email was sent to <strong>${safeUsername}</strong>.</p>
      <p>To manage your budget alerts, log in to your account settings.</p>
      <p>© ${new Date().getFullYear()} Expense Manager | <a href="#" style="color: #999999;">Privacy Policy</a> | <a href="#" style="color: #999999;">Contact Support</a></p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Generates HTML for a saving goal reminder email.
 * @param username User's name.
 * @param goalDetails Details like goal name, target date, remaining amount.
 * @returns HTML string.
 */
export function goalReminderEmailTemp(
  username: string,
  goalDetails: {
    goalName: string;
    targetDate: string;
    remainingAmount: number;
    currency: string;
  },
): string {
  const safeUsername = username || 'User';
  const { goalName, targetDate, remainingAmount, currency } = goalDetails;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Saving Goal Reminder - Expense Manager</title>
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #F5F7FA; margin: 0; padding: 0; color: #333333; }
    .container { max-width: 600px; margin: 20px auto; padding: 30px; background-color: #FFFFFF; border-radius: 12px; box-shadow: 0px 4px 15px rgba(0, 0, 0, 0.1); }
    .logo { text-align: center; margin-bottom: 25px; }
    .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid #EEEEEE; }
    .header h1 { font-size: 32px; margin: 0; color: #2672FF; }
    .content { font-size: 16px; line-height: 1.6; margin-bottom: 35px; color: #555555; }
    .content p { margin-bottom: 15px; }
    .goal-details { background-color: #E8F5E8; border-left: 4px solid #28A745; padding: 20px; margin: 20px 0; border-radius: 8px; }
    .goal-details h3 { color: #1E7E34; margin-top: 0; margin-bottom: 15px; }
    .goal-details p { margin: 8px 0; color: #1E7E34; }
    .goal-stats { display: flex; justify-content: space-between; margin-top: 15px; }
    .stat-item { text-align: center; flex: 1; }
    .stat-item strong { display: block; font-size: 18px; margin-bottom: 5px; }
    .stat-item span { font-size: 14px; color: #777777; }
    .button-container { text-align: center; margin: 30px 0; }
    .button { display: inline-block; background-color: #2672FF; color: white !important; text-align: center; font-size: 16px; font-weight: bold; padding: 12px 30px; border-radius: 6px; text-decoration: none; transition: background-color 0.2s ease; }
    .button:hover { background-color: #1E5CC7; }
    .footer { font-size: 14px; color: #999999; text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #EEEEEE; }
    .footer p { margin: 5px 0; }
    @media only screen and (max-width: 600px) { 
      .container { padding: 20px; } 
      .goal-stats { flex-direction: column; gap: 15px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo"></div>
    <div class="header"><h1>🎯 Goal Reminder</h1></div>
    <div class="content">
      <p>Hi <strong>${safeUsername}</strong>,</p>
      <p>Just a friendly reminder about your saving goal that's approaching its target date!</p>
      <div class="goal-details">
        <h3>Goal: ${goalName}</h3>
        <div class="goal-stats">
          <div class="stat-item">
            <strong>${currency}${remainingAmount.toFixed(2)}</strong>
            <span>Remaining</span>
          </div>
          <div class="stat-item">
            <strong>${targetDate}</strong>
            <span>Target Date</span>
          </div>
        </div>
      </div>
      <p>You're doing great! Keep up the momentum and you'll reach your goal in no time. Every small contribution brings you closer to achieving your financial objective.</p>
      <div class="button-container"><a href="#" class="button">View Goal Progress</a></div>
      <p>Remember, consistent saving habits are the key to financial success. You've got this!</p>
    </div>
    <div class="footer">
      <p>This email was sent to <strong>${safeUsername}</strong>.</p>
      <p>To manage your goal reminders, log in to your account settings.</p>
      <p>© ${new Date().getFullYear()} Expense Manager | <a href="#" style="color: #999999;">Privacy Policy</a> | <a href="#" style="color: #999999;">Contact Support</a></p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Generates HTML for a bill payment reminder email.
 * @param username User's name.
 * @param billDetails Details like bill description, amount, due date.
 * @returns HTML string.
 */
export function billReminderEmailTemp(
  username: string,
  billDetails: {
    description: string;
    amount: number;
    dueDate: string;
    currency: string;
  },
): string {
  const safeUsername = username || 'User';
  const { description, amount, dueDate, currency } = billDetails;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bill Reminder - Expense Manager</title>
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #F5F7FA; margin: 0; padding: 0; color: #333333; }
    .container { max-width: 600px; margin: 20px auto; padding: 30px; background-color: #FFFFFF; border-radius: 12px; box-shadow: 0px 4px 15px rgba(0, 0, 0, 0.1); }
    .logo { text-align: center; margin-bottom: 25px; }
    .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid #EEEEEE; }
    .header h1 { font-size: 32px; margin: 0; color: #2672FF; }
    .content { font-size: 16px; line-height: 1.6; margin-bottom: 35px; color: #555555; }
    .content p { margin-bottom: 15px; }
    .bill-details { background-color: #FFF3E0; border-left: 4px solid #FF9800; padding: 20px; margin: 20px 0; border-radius: 8px; }
    .bill-details h3 { color: #E65100; margin-top: 0; margin-bottom: 15px; }
    .bill-details p { margin: 8px 0; color: #E65100; }
    .bill-stats { display: flex; justify-content: space-between; margin-top: 15px; }
    .stat-item { text-align: center; flex: 1; }
    .stat-item strong { display: block; font-size: 18px; margin-bottom: 5px; }
    .stat-item span { font-size: 14px; color: #777777; }
    .button-container { text-align: center; margin: 30px 0; }
    .button { display: inline-block; background-color: #2672FF; color: white !important; text-align: center; font-size: 16px; font-weight: bold; padding: 12px 30px; border-radius: 6px; text-decoration: none; transition: background-color 0.2s ease; }
    .button:hover { background-color: #1E5CC7; }
    .reminder-notice { background-color: #F0F8FF; border-left: 4px solid #2672FF; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .reminder-notice p { margin: 0; color: #1E5CC7; }
    .footer { font-size: 14px; color: #999999; text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #EEEEEE; }
    .footer p { margin: 5px 0; }
    @media only screen and (max-width: 600px) { 
      .container { padding: 20px; } 
      .bill-stats { flex-direction: column; gap: 15px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo"></div>
    <div class="header"><h1>📅 Bill Reminder</h1></div>
    <div class="content">
      <p>Hi <strong>${safeUsername}</strong>,</p>
      <p>This is a friendly reminder about your upcoming bill payment that's due soon.</p>
      <div class="bill-details">
        <h3>Upcoming Payment</h3>
        <div class="bill-stats">
          <div class="stat-item">
            <strong>${currency}${amount.toFixed(2)}</strong>
            <span>Amount Due</span>
          </div>
          <div class="stat-item">
            <strong>${dueDate}</strong>
            <span>Due Date</span>
          </div>
        </div>
        <p><strong>Description:</strong> ${description}</p>
      </div>
      <div class="reminder-notice">
        <p><strong>Pro Tip:</strong> Set up automatic payments to never miss a due date and avoid late fees.</p>
      </div>
      <p>Please ensure you have sufficient funds available in your account to cover this payment.</p>
      <div class="button-container"><a href="#" class="button">View All Bills</a></div>
    </div>
    <div class="footer">
      <p>This email was sent to <strong>${safeUsername}</strong>.</p>
      <p>To manage your bill reminders, log in to your account settings.</p>
      <p>© ${new Date().getFullYear()} Expense Manager | <a href="#" style="color: #999999;">Privacy Policy</a> | <a href="#" style="color: #999999;">Contact Support</a></p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Generates the HTML content for an invitation email.
 * @param inviterName - The name of the person sending the invite.
 * @param invitationLink - The registration link for the invitee.
 * @param toEmail - The email address of the invitee.
 * @returns HTML string for the email body.
 */
export function invitationEmailTemp(
  inviterName: string,
  invitationLink: string,
  toEmail: string,
): string {
  const safeInviter = inviterName || 'A friend';
  const safeLink = invitationLink || '#';
  const safeEmail = toEmail || 'your email address';
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're Invited to Expense Manager!</title>
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #F5F7FA; margin: 0; padding: 0; color: #333333; }
    .container { max-width: 600px; margin: 20px auto; padding: 30px; background-color: #FFFFFF; border-radius: 12px; box-shadow: 0px 4px 15px rgba(0, 0, 0, 0.1); }
    .logo { text-align: center; margin-bottom: 25px; }
    .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid #EEEEEE; }
    .header h1 { font-size: 32px; margin: 0; color: #2672FF; }
    .content { font-size: 16px; line-height: 1.6; margin-bottom: 35px; color: #555555; }
    .content p { margin-bottom: 15px; }
    .invite-details { background-color: #F7FAFF; border-radius: 8px; padding: 20px; margin-bottom: 30px; }
    .invite-details h3 { color: #2672FF; margin-top: 0; }
    .invite-details p { margin-bottom: 10px; }
    .button-container { text-align: center; margin: 30px 0; }
    .button { display: inline-block; background-color: #2672FF; color: white !important; text-align: center; font-size: 16px; font-weight: bold; padding: 12px 30px; border-radius: 6px; text-decoration: none; transition: background-color 0.2s ease; }
    .button:hover { background-color: #1E5CC7; }
    .footer { font-size: 14px; color: #999999; text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #EEEEEE; }
    .footer p { margin: 5px 0; }
    @media only screen and (max-width: 600px) { .container { padding: 20px; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo"></div>
    <div class="header"><h1>You're Invited!</h1></div>
    <div class="content">
      <p>Hi there,</p>
      <div class="invite-details">
        <h3>Join Expense Manager</h3>
        <p><strong>${safeInviter}</strong> has invited you to join Expense Manager.</p>
        <p>Click the button below to register and start managing your finances:</p>
        <div class="button-container"><a href="${safeLink}" class="button">Accept Invitation</a></div>
        <p>This invitation will expire in 24 hours.</p>
      </div>
      <p>If you have any questions or need help getting started, our support team is here for you!</p>
    </div>
    <div class="footer">
      <p>This invitation was sent to <strong>${safeEmail}</strong>.</p>
      <p>© ${new Date().getFullYear()} Expense Manager | <a href="#" style="color: #999999;">Privacy Policy</a> | <a href="#" style="color: #999999;">Contact Support</a></p>
    </div>
  </div>
</body>
</html>`;
}
