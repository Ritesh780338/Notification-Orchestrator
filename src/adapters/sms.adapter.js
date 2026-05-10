const axios = require('axios');
const logger = require('../config/logger');

class SMSAdapter {
  constructor() {
    this.apiKey = process.env.SMS_API_KEY;
    this.provider = process.env.SMS_PROVIDER || 'mock';
    this.senderId = process.env.SMS_SENDER_ID || 'ALERTS';
    this.route = process.env.SMS_ROUTE || '2'; // Default to OTP route
    this.baseUrl = 'https://app.smslocal.in/api';
  }

  /**
   * Send SMS notification via SMS Local
   */
  async send(phoneNumber, message, templateId = null) {
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

      // SMS Local implementation
      if (this.provider === 'smslocal') {
        // Clean phone number (remove +91 if present, SMS Local expects 10 digits)
        const cleanNumber = phoneNumber.replace(/^\+91/, '').replace(/^91/, '').replace(/\D/g, '');
        
        if (cleanNumber.length !== 10) {
          throw new Error('Invalid Indian phone number. Must be 10 digits.');
        }

        // URL encode the message
        const encodedMessage = encodeURIComponent(message);
        
        // Build query parameters
        const params = new URLSearchParams({
          key: this.apiKey,
          route: this.route,
          sender: this.senderId,
          number: cleanNumber,
          sms: encodedMessage
        });

        // Add template ID if provided (required for DLT compliance)
        if (templateId) {
          params.append('templateid', templateId);
        } else if (process.env.SMS_DEFAULT_TEMPLATE_ID) {
          params.append('templateid', process.env.SMS_DEFAULT_TEMPLATE_ID);
        }

        const url = `${this.baseUrl}/smsapi?${params.toString()}`;

        logger.info('Sending SMS via SMS Local', {
          phoneNumber: cleanNumber,
          route: this.route,
          sender: this.senderId,
          messageLength: message.length
        });

        const response = await axios.get(url, {
          validateStatus: function (status) {
            return status < 500; // Don't throw on 4xx errors
          }
        });

        // Log full response for debugging
        logger.info('SMS Local API Response', {
          status: response.status,
          data: response.data
        });

        // Parse response - numeric value means success (message ID)
        const responseData = response.data.toString().trim();
        const messageId = parseInt(responseData);

        // Check for error codes
        const errorCodes = {
          '101': 'Invalid user',
          '102': 'Invalid sender ID',
          '103': 'Invalid contact(s)',
          '104': 'Invalid route',
          '105': 'Invalid message',
          '106': 'Spam blocked',
          '107': 'Promotional block',
          '108': 'Low credits in the specified route',
          '109': 'Promotional route will be working from 9am to 8:45pm only',
          '110': 'Invalid DLT Template ID',
          '111': 'No SMSC'
        };

        if (errorCodes[responseData]) {
          throw new Error(`SMS Local Error ${responseData}: ${errorCodes[responseData]}`);
        }

        // If response is a number and not an error code, it's the message ID
        if (!isNaN(messageId) && messageId > 200) {
          logger.info('SMS sent successfully via SMS Local', {
            phoneNumber: cleanNumber,
            messageId: messageId
          });

          return {
            success: true,
            messageId: messageId.toString(),
            provider: 'smslocal',
            phoneNumber: cleanNumber,
            response: responseData
          };
        } else {
          throw new Error(`Unexpected response from SMS Local: ${responseData}`);
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
   * Get delivery report for a sent SMS
   */
  async getDeliveryReport(messageId) {
    try {
      if (this.provider !== 'smslocal') {
        throw new Error('Delivery report only available for smslocal provider');
      }

      const url = `${this.baseUrl}/dlrapi?key=${this.apiKey}&messageid=${messageId}`;
      
      const response = await axios.get(url);
      
      logger.info('SMS Local Delivery Report', {
        messageId,
        data: response.data
      });

      // Response format: [["Number 1","Status 1","Time 1"],["Number 2","Status 2","Time 2"]]
      return {
        success: true,
        messageId,
        deliveryReport: response.data
      };
      
    } catch (error) {
      logger.error('Failed to get delivery report:', {
        error: error.message,
        messageId
      });
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Check available credits for a route
   */
  async checkCredits(route = null) {
    try {
      if (this.provider !== 'smslocal') {
        throw new Error('Credits check only available for smslocal provider');
      }

      const checkRoute = route || this.route;
      const url = `${this.baseUrl}/creditapi?key=${this.apiKey}&route=${checkRoute}`;
      
      const response = await axios.get(url);
      
      logger.info('SMS Local Credits Check', {
        route: checkRoute,
        data: response.data
      });

      // Response format: {"Route":"Route Name","Credits":"Credit Amount"}
      return {
        success: true,
        route: checkRoute,
        credits: response.data
      };
      
    } catch (error) {
      logger.error('Failed to check credits:', {
        error: error.message,
        route: route || this.route
      });
      
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
    try {
      if (this.provider === 'mock') {
        logger.info('SMS adapter verified (mock mode)');
        return true;
      }

      if (this.provider === 'smslocal') {
        if (!this.apiKey || this.apiKey === 'your_sms_api_key') {
          logger.error('SMS Local API key not configured');
          return false;
        }
        
        // Try to check credits to verify API key
        const creditsCheck = await this.checkCredits();
        
        if (creditsCheck.success) {
          logger.info('SMS adapter verified (SMS Local configured)', {
            credits: creditsCheck.credits
          });
          return true;
        } else {
          logger.error('SMS Local API key verification failed');
          return false;
        }
      }

      return false;
    } catch (error) {
      logger.error('SMS adapter verification failed:', error);
      return false;
    }
  }
}

module.exports = new SMSAdapter();
