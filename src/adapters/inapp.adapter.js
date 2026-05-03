const logger = require('../config/logger');

class InAppAdapter {
  async send(userId, title, body) {
    try {
      logger.info('In-app notification sent (mock)', { userId, title });
      await new Promise(resolve => setTimeout(resolve, 50));
      
      return {
        success: true,
        messageId: `inapp_${Date.now()}`,
        provider: 'mock'
      };
    } catch (error) {
      logger.error('In-app notification failed:', error);
      return { success: false, error: error.message };
    }
  }

  async verify() {
    return true;
  }
}

module.exports = new InAppAdapter();
