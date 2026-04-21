const Notification = require('../models/Notification');
const UserPreference = require('../models/UserPreference');
const DeliveryLog = require('../models/DeliveryLog');
const logger = require('../config/logger');
const templateService = require('./template.service.mongo');
const preferenceService = require('./preference.service.mongo');
const { checkRateLimit, incrementRateLimit, isQuietHours } = require('../utils/throttle');
const { retryWithBackoff } = require('../utils/retry');
const emailAdapter = require('../adapters/email.adapter');
const smsAdapter = require('../adapters/sms.adapter');
const pushAdapter = require('../adapters/push.adapter');
const inappAdapter = require('../adapters/inapp.adapter');

class OrchestrationService {
  constructor() {
    this.adapters = {
      email: emailAdapter,
      sms: smsAdapter,
      push: pushAdapter,
      inapp: inappAdapter
    };
  }

  async processNotification(notificationId) {
    try {
      const notification = await Notification.findById(notificationId);
      
      if (!notification) {
        throw new Error('Notification not found');
      }

      // Check if scheduled for future
      if (notification.schedule_time && new Date(notification.schedule_time) > new Date()) {
        logger.info('Notification scheduled for future', { notificationId });
        notification.status = 'scheduled';
        await notification.save();
        return;
      }

      // Update status to processing
      notification.status = 'processing';
      await notification.save();

      // Determine channels
      const channels = await this.determineChannels(notification);

      if (channels.length === 0) {
        logger.warn('No channels available for notification', { notificationId });
        notification.status = 'suppressed';
        await notification.save();
        return;
      }

      // Process each channel
      const results = await Promise.allSettled(
        channels.map(channel => this.sendToChannel(notification, channel))
      );

      // Update final status
      const allSucceeded = results.every(r => r.status === 'fulfilled' && r.value);
      const anySucceeded = results.some(r => r.status === 'fulfilled' && r.value);
      
      if (allSucceeded) {
        notification.status = 'delivered';
      } else if (anySucceeded) {
        notification.status = 'sent';
      } else {
        notification.status = 'failed';
      }

      notification.processed_at = new Date();
      await notification.save();

      logger.info('Notification processed', {
        notificationId,
        channels: channels.length,
        succeeded: results.filter(r => r.status === 'fulfilled').length
      });

    } catch (error) {
      logger.error('Error processing notification:', error);
      await Notification.findByIdAndUpdate(notificationId, { status: 'failed' });
      throw error;
    }
  }

  async determineChannels(notification) {
    const { user_id, event_type, priority, preferred_channels } = notification;
    
    const userPref = await UserPreference.findOne({ user_id });
    
    if (!userPref) {
      logger.warn('User preferences not found', { user_id });
      return [];
    }
    
    const availableChannels = [];
    const category = this.getEventCategory(event_type);
    const channelsToCheck = preferred_channels || ['email', 'sms', 'push', 'inapp'];
    
    for (const channel of channelsToCheck) {
      // Check if user has contact info for channel
      if (channel === 'email' && !userPref.email) continue;
      if (channel === 'sms' && !userPref.phone) continue;
      if (channel === 'push' && !userPref.push_token) continue;

      // Check user preferences
      const allowed = await preferenceService.isChannelAllowed(user_id, channel, category);
      if (!allowed) {
        logger.info('Channel blocked by user preference', { user_id, channel, category });
        continue;
      }

      // Check rate limiting (skip for urgent priority)
      if (priority !== 'urgent') {
        const withinLimit = await checkRateLimit(user_id, channel);
        if (!withinLimit) {
          logger.warn('Rate limit exceeded', { user_id, channel });
          continue;
        }
      }

      // Check quiet hours (skip for urgent and security)
      if (priority !== 'urgent' && category !== 'security') {
        if (isQuietHours() && (channel === 'sms' || channel === 'push')) {
          logger.info('Skipping channel due to quiet hours', { channel });
          continue;
        }
      }

      availableChannels.push(channel);
    }

    return availableChannels;
  }

  async sendToChannel(notification, channel) {
    const { _id, user_id, event_type, metadata } = notification;

    try {
      const template = await templateService.getTemplate(event_type, channel);
      
      if (!template) {
        logger.warn('Template not found', { event_type, channel });
        await this.logDelivery(_id, notification.event_id, channel, 'failed', 'Template not found');
        
        // Update notification channels array
        notification.channels.push({
          channel_type: channel,
          status: 'failed',
          error_message: 'Template not found',
          retry_count: 0
        });
        await notification.save();
        
        return false;
      }

      const rendered = templateService.renderTemplate(template, metadata);
      const userPref = await UserPreference.findOne({ user_id });

      const result = await retryWithBackoff(async () => {
        return await this.sendViaAdapter(channel, userPref, rendered);
      }, 3, 1000);

      await this.logDelivery(
        _id,
        notification.event_id,
        channel,
        result.success ? 'delivered' : 'failed',
        result.error || null,
        result
      );

      // Update notification channels array
      notification.channels.push({
        channel_type: channel,
        status: result.success ? 'delivered' : 'failed',
        sent_at: new Date(),
        delivered_at: result.success ? new Date() : null,
        error_message: result.error || null,
        retry_count: result.retryCount || 0
      });
      await notification.save();

      if (result.success) {
        await incrementRateLimit(user_id, channel);
      }

      return result.success;

    } catch (error) {
      logger.error('Channel delivery failed:', { channel, error: error.message });
      await this.logDelivery(_id, notification.event_id, channel, 'failed', error.message);
      
      notification.channels.push({
        channel_type: channel,
        status: 'failed',
        error_message: error.message,
        retry_count: 3
      });
      await notification.save();
      
      return false;
    }
  }

  async sendViaAdapter(channel, userPref, rendered) {
    const adapter = this.adapters[channel];
    
    if (!adapter) {
      throw new Error(`Adapter not found for channel: ${channel}`);
    }

    switch (channel) {
      case 'email':
        return await adapter.send(userPref.email, rendered.subject, rendered.body);
      case 'sms':
        return await adapter.send(userPref.phone, rendered.body);
      case 'push':
        return await adapter.send(userPref.push_token, rendered.subject || 'Notification', rendered.body);
      case 'inapp':
        return await adapter.send(userPref.user_id, rendered.subject || 'Notification', rendered.body);
      default:
        throw new Error(`Unknown channel: ${channel}`);
    }
  }

  async logDelivery(notificationId, eventId, channel, status, errorMessage, providerResponse = null) {
    try {
      await DeliveryLog.create({
        notification_id: notificationId,
        event_id: eventId,
        channel,
        status,
        error_message: errorMessage,
        provider_response: providerResponse,
        timestamp: new Date()
      });
    } catch (error) {
      logger.error('Error logging delivery:', error);
    }
  }

  getEventCategory(eventType) {
    const categoryMap = {
      user_signup: 'transactional',
      order_confirmation: 'transactional',
      password_reset: 'security',
      security_alert: 'security',
      marketing: 'marketing',
      system_notification: 'system'
    };

    return categoryMap[eventType] || 'transactional';
  }
}

module.exports = new OrchestrationService();
