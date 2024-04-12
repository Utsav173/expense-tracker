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
