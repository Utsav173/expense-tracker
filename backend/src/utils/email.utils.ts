// src/utils/email.utils.ts

/**
 * Generates the HTML content for a welcome email.
 * @param username - The name of the new user.
 * @param loginpage - The URL to the login page.
 * @param email - The user's email address.
 * @returns HTML string for the email body.
 */
export function WelcomeEmailTemp(username: string, loginpage: string, email: string): string {
  // Basic validation
  const safeUsername = username || 'Valued User';
  const safeLoginpage = loginpage || '#'; // Default link if none provided
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
    .logo { text-align: center; margin-bottom: 25px; } /* Add logo img src if available */
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
  // Basic validation
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
    .logo { text-align: center; margin-bottom: 25px; } /* Add logo img src if available */
    .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid #EEEEEE; }
    .header h1 { font-size: 28px; margin: 0; color: #2672FF; }
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
