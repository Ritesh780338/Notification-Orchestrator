const nodemailer = require('nodemailer');
const logger = require('../config/logger');

class EmailAdapter {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false // Allow self-signed certificates
      }
    });
  }

  /**
   * Send email notification
   */
  async send(recipient, subject, body) {
    try {
      // Validate configuration
      if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
        throw new Error('Email configuration missing. Check SMTP_HOST, SMTP_USER, and SMTP_PASSWORD in .env');
      }

      console.log('[EmailAdapter] Attempting to send email:', {
        recipient,
        subject,
        from: process.env.SMTP_FROM || 'noreply@notificationorchestrator.com',
        smtpHost: process.env.SMTP_HOST,
        smtpPort: process.env.SMTP_PORT,
        smtpUser: process.env.SMTP_USER
      });

      // Create professional HTML version of the email
      const htmlBody = this.createEmailTemplate(subject, body);

      const mailOptions = {
        from: `NotifyHub <${process.env.SMTP_FROM || 'noreply@notificationorchestrator.com'}>`,
        to: recipient,
        subject: subject,
        text: body,
        html: htmlBody,
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      logger.info('✅ Email sent successfully', {
        messageId: info.messageId,
        recipient,
        subject
      });

      console.log('[EmailAdapter] Email sent successfully:', {
        messageId: info.messageId,
        response: info.response
      });

      return {
        success: true,
        messageId: info.messageId,
        response: info.response,
        recipient,
        subject
      };
    } catch (error) {
      logger.error('❌ Email sending failed:', {
        error: error.message,
        code: error.code,
        command: error.command,
        recipient
      });
      
      console.error('[EmailAdapter] Email error details:', {
        message: error.message,
        code: error.code,
        command: error.command,
        stack: error.stack
      });
      
      return {
        success: false,
        error: error.message,
        recipient
      };
    }
  }

  /**
   * Create professional email template
   */
  createEmailTemplate(subject, body) {
    // Convert plain text to HTML paragraphs
    const bodyHtml = body
      .split('\n\n')
      .map(para => `<p style="margin: 0 0 16px 0; line-height: 1.6;">${para.replace(/\n/g, '<br>')}</p>`)
      .join('');

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${subject}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, sans-serif !important;}
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 32px 40px; text-align: center;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="text-align: center;">
                    <div style="display: inline-block; background-color: rgba(255, 255, 255, 0.2); border-radius: 50%; width: 64px; height: 64px; line-height: 64px; margin-bottom: 16px;">
                      <span style="font-size: 32px;">🔔</span>
                    </div>
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">NotifyHub</h1>
                    <p style="margin: 8px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px; font-weight: 500;">Notification Orchestrator</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Subject Banner -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 24px 40px; border-bottom: 3px solid #6366f1;">
              <h2 style="margin: 0; color: #1f2937; font-size: 22px; font-weight: 600; line-height: 1.3;">${subject}</h2>
            </td>
          </tr>
          
          <!-- Body Content -->
          <tr>
            <td style="padding: 40px; color: #374151; font-size: 16px; line-height: 1.6;">
              ${bodyHtml}
            </td>
          </tr>
          
          <!-- Call to Action (if needed) -->
          <tr>
            <td style="padding: 0 40px 40px 40px; text-align: center;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                <tr>
                  <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 8px; text-align: center;">
                    <a href="#" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px;">View Details</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Divider -->
          <tr>
            <td style="padding: 0 40px;">
              <div style="border-top: 1px solid #e5e7eb;"></div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #1f2937; padding: 32px 40px; text-align: center;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="text-align: center;">
                    <p style="margin: 0 0 12px 0; color: #9ca3af; font-size: 14px; line-height: 1.5;">
                      This email was sent by <strong style="color: #d1d5db;">NotifyHub</strong> Notification Orchestrator
                    </p>
                    <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 12px;">
                      Centralized Multi-Channel Notification Management Service
                    </p>
                    <div style="margin: 16px 0;">
                      <a href="#" style="display: inline-block; margin: 0 8px; color: #9ca3af; text-decoration: none; font-size: 12px;">Unsubscribe</a>
                      <span style="color: #4b5563;">•</span>
                      <a href="#" style="display: inline-block; margin: 0 8px; color: #9ca3af; text-decoration: none; font-size: 12px;">Preferences</a>
                      <span style="color: #4b5563;">•</span>
                      <a href="#" style="display: inline-block; margin: 0 8px; color: #9ca3af; text-decoration: none; font-size: 12px;">Help</a>
                    </div>
                    <p style="margin: 16px 0 0 0; color: #6b7280; font-size: 11px;">
                      © 2026 NotifyHub. All rights reserved.<br>
                      Developed by Ritesh Sharma (240410700085)
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
        </table>
        
        <!-- Email Client Support Text -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 20px auto 0;">
          <tr>
            <td style="text-align: center; padding: 0 20px;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px; line-height: 1.5;">
                If you're having trouble viewing this email, please check your spam folder or contact support.
              </p>
            </td>
          </tr>
        </table>
        
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  /**
   * Verify email configuration
   */
  async verify() {
    try {
      await this.transporter.verify();
      logger.info('Email adapter verified successfully');
      return true;
    } catch (error) {
      logger.error('Email adapter verification failed:', error);
      return false;
    }
  }
}

module.exports = new EmailAdapter();
