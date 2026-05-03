const logger = require('../config/logger');

class SMSAdapter {
  async send(phoneNumber, message) {
    try {
      logger.info('SMS sent (mock)', { phoneNumber, messageLength: message.length });
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return {
        success: true,
        messageId: `sms_${Date.now()}`,
        provider: 'mock'
      };
    } catch (error) {
      logger.error('SMS sending failed:', error);
      return { success: false, error: error.message };
    }
  }

  async verify() {
    return true;
  }
}

module.exports = new SMSAdapter();
