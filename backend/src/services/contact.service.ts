import { emailService } from './email.service';
import { config } from '../config';

interface ContactFormPayload {
  name: string;
  email: string;
  subject: string;
  message: string;
}

class ContactService {
  async handleContactSubmission(
    payload: ContactFormPayload,
  ): Promise<{ success: boolean; message: string }> {
    const { name, email, subject, message } = payload;

    if (!config.GMAIL_USERNAME) {
      console.warn('ContactService: GMAIL_USERNAME not configured. Cannot send contact email.');
      if (config.NODE_ENV === 'development') {
        console.log('Simulated contact email sending:', payload);
        return { success: true, message: 'Message received (simulated).' };
      }
      return { success: false, message: 'Email service is not configured on the server.' };
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Contact Form Submission</title>
          <style>
              body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f7f6; color: #333; }
              .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); overflow: hidden; }
              .header { background-color: #0ea5e9; /* sky-500 */ color: #ffffff; padding: 25px; text-align: center; }
              .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
              .content { padding: 25px; }
              .content p { margin: 0 0 12px; line-height: 1.6; }
              .content strong { color: #0369a1; /* sky-700 */ }
              .message-section { margin-top: 20px; padding: 15px; background-color: #f8fafc; /* slate-50 */ border-left: 4px solid #0ea5e9; /* sky-500 */ border-radius: 4px; }
              .message-section p { margin: 0; white-space: pre-wrap; word-wrap: break-word; }
              .footer { background-color: #e2e8f0; /* slate-200 */ color: #475569; /* slate-600 */ text-align: center; padding: 15px; font-size: 12px; }
              .footer a { color: #0ea5e9; /* sky-500 */ text-decoration: none; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>New Contact Message from Expense Pro</h1>
              </div>
              <div class="content">
                  <p>You've received a new message through the Expense Pro contact form:</p>
                  <p><strong>From:</strong> ${name}</p>
                  <p><strong>Email:</strong> <a href="mailto:${email}" style="color: #0ea5e9; text-decoration: none;">${email}</a></p>
                  <p><strong>Subject:</strong> ${subject}</p>
                  <div class="message-section">
                      <p><strong>Message:</strong></p>
                      <p>${message.replace(/\n/g, '<br>')}</p>
                  </div>
              </div>
              <div class="footer">
                  <p>This email was sent from the Expense Pro application.</p>
              </div>
          </div>
      </body>
      </html>
    `;

    try {
      await emailService.sendMail({
        to: config.GMAIL_USERNAME,
        subject: `Expense Pro: Contact - ${subject}`,
        html: emailHtml,
        replyTo: email,
      });
      return { success: true, message: 'Your message has been sent successfully!' };
    } catch (error) {
      console.error('Failed to send contact form email:', error);
      return { success: false, message: 'Failed to send message. Please try again later.' };
    }
  }
}

export const contactService = new ContactService();
