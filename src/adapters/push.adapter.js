const logger = require('../config/logger');

class PushAdapter {
  async send(deviceToken, title, body) {
    try {
      logger.info('Push notification sent (mock)', { title });
      await new Promise(resolve => setTimeout(resolve, 150));
      
      return {
        success: true,
        messageId: `push_${Date.now()}`,
        provider: 'mock'
      };
    } catch (error) {
      logger.error('Push notification failed:', error);
      return { success: false, error: error.message };
    }
  }

  async verify() {
    return true;
  }
}

module.exports = new PushAdapter();
