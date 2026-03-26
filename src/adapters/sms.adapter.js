const logger = require('../config/logger');

class SMSAdapter {
  /**
   * Send SMS notification (Mock implementation for demo)
   * In production, integrate with Twilio, AWS SNS, or similar
   */
  async send(phoneNumber, message) {
    try {
      // Mock SMS sending
      logger.info('SMS sent (mock)', {
        phoneNumber,
        messageLength: message.length
      });

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 100));

      // Simulate 95% success rate
      const success = Math.random() > 0.05;

      if (success) {
        return {
          success: true,
          messageId: `sms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          provider: 'mock'
        };
      } else {
        throw new Error('SMS provider temporarily unavailable');
      }
    } catch (error) {
      logger.error('SMS sending failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Verify SMS configuration
   */
  async verify() {
    logger.info('SMS adapter verified (mock mode)');
    return true;
  }
}

module.exports = new SMSAdapter();
