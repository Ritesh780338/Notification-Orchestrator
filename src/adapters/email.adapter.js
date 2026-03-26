const nodemailer = require('nodemailer');
const logger = require('../config/logger');

class EmailAdapter {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }

  /**
   * Send email notification
   */
  async send(recipient, subject, body) {
    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || 'noreply@notificationorchestrator.com',
        to: recipient,
        subject: subject,
        text: body,
        html: body.replace(/\n/g, '<br>'),
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      logger.info('Email sent successfully', {
        messageId: info.messageId,
        recipient
      });

      return {
        success: true,
        messageId: info.messageId,
        response: info.response
      };
    } catch (error) {
      logger.error('Email sending failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
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
