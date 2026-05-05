const axios = require('axios');
const logger = require('../config/logger');

class SMSAdapter {
  constructor() {
    this.apiKey = process.env.SMS_API_KEY;
    this.provider = process.env.SMS_PROVIDER || 'mock';
    this.baseUrl = 'https://www.fast2sms.com/dev/bulkV2';
  }

  /**
   * Send SMS notification via Fast2SMS
   */
  async send(phoneNumber, message) {
    try {
      // If mock provider, use mock implementation
      if (this.provider === 'mock') {
        logger.info('📱 SMS sent (mock mode)', { 
          phoneNumber, 
          messageLength: message.length,
          preview: message.substring(0, 50) + '...'
        });
        await new Promise(resolve => setTimeout(resolve, 100));
        
        return {
          success: true,
          messageId: `sms_mock_${Date.now()}`,
          provider: 'mock',
          phoneNumber,
          message: 'SMS sent in mock mode (no actual SMS sent)'
        };
      }

      // Fast2SMS implementation
      if (this.provider === 'fast2sms') {
        // Clean phone number (remove +91 if present, Fast2SMS expects 10 digits)
        const cleanNumber = phoneNumber.replace(/^\+91/, '').replace(/^91/, '').replace(/\D/g, '');
        
        if (cleanNumber.length !== 10) {
          throw new Error('Invalid Indian phone number. Must be 10 digits.');
        }

        const response = await axios.post(
          this.baseUrl,
          {
            route: 'v3',
            sender_id: 'TXTIND',
            message: message,
            language: 'english',
            flash: 0,
            numbers: cleanNumber
          },
          {
            headers: {
              'authorization': this.apiKey,
              'Content-Type': 'application/json'
            },
            validateStatus: function (status) {
              return status < 500; // Don't throw on 4xx errors
            }
          }
        );

        // Log full response for debugging
        logger.info('Fast2SMS API Response', {
          status: response.status,
          data: response.data
        });

        if (response.data && response.data.return === true) {
          logger.info('SMS sent successfully via Fast2SMS', {
            phoneNumber: cleanNumber,
            messageId: response.data.request_id
          });

          return {
            success: true,
            messageId: response.data.request_id,
            provider: 'fast2sms',
            response: response.data
          };
        } else {
          const errorMsg = response.data.message || JSON.stringify(response.data) || 'SMS sending failed';
          throw new Error(errorMsg);
        }
      }

      throw new Error(`Unsupported SMS provider: ${this.provider}`);
      
    } catch (error) {
      logger.error('SMS sending failed:', {
        error: error.message,
        phoneNumber,
        provider: this.provider
      });
      
      return {
        success: false,
        error: error.message,
        provider: this.provider
      };
    }
  }

  /**
   * Verify SMS configuration
   */
  async verify() {
    try {
      if (this.provider === 'mock') {
        logger.info('SMS adapter verified (mock mode)');
        return true;
      }

      if (this.provider === 'fast2sms') {
        if (!this.apiKey || this.apiKey === 'your_sms_api_key') {
          logger.error('Fast2SMS API key not configured');
          return false;
        }
        
        logger.info('SMS adapter verified (Fast2SMS configured)');
        return true;
      }

      return false;
    } catch (error) {
      logger.error('SMS adapter verification failed:', error);
      return false;
    }
  }
}

module.exports = new SMSAdapter();
