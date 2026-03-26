const pool = require('../config/database');
const logger = require('../config/logger');
const templateService = require('./template.service');
const preferenceService = require('./preference.service');
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
      in_app: inappAdapter
    };
  }

  /**
   * Process notification event
   */
  async processNotification(notificationId) {
    try {
      // Fetch notification details
      const notification = await this.getNotification(notificationId);
      
      if (!notification) {
        throw new Error('Notification not found');
      }

      // Check if scheduled for future
      if (notification.schedule_time && new Date(notification.schedule_time) > new Date()) {
        logger.info('Notification scheduled for future', { notificationId });
        await this.updateNotificationStatus(notificationId, 'scheduled');
        return;
      }

      // Update status to queued
      await this.updateNotificationStatus(notificationId, 'queued');

      // Determine channels
      const channels = await this.determineChannels(notification);

      if (channels.length === 0) {
        logger.warn('No channels available for notification', { notificationId });
        await this.updateNotificationStatus(notificationId, 'suppressed');
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
        await this.updateNotificationStatus(notificationId, 'delivered');
      } else if (anySucceeded) {
        await this.updateNotificationStatus(notificationId, 'sent');
      } else {
        await this.updateNotificationStatus(notificationId, 'failed');
      }

      logger.info('Notification processed', {
        notificationId,
        channels: channels.length,
        succeeded: results.filter(r => r.status === 'fulfilled').length
      });

    } catch (error) {
      logger.error('Error processing notification:', error);
      await this.updateNotificationStatus(notificationId, 'failed');
      throw error;
    }
  }

  /**
   * Determine which channels to use
   */
  async determineChannels(notification) {
    const { user_id, event_type, priority, preferred_channels } = notification;
    
    // Get user info
    const userResult = await pool.query(
      'SELECT email, phone, push_token FROM users WHERE id = $1',
      [user_id]
    );
    
    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }
    
    const user = userResult.rows[0];
    const availableChannels = [];

    // Determine category based on event type
    const category = this.getEventCategory(event_type);

    // Check each channel
    const channelsToCheck = preferred_channels || ['email', 'sms', 'push', 'in_app'];
    
    for (const channel of channelsToCheck) {
      // Check if user has contact info for channel
      if (channel === 'email' && !user.email) continue;
      if (channel === 'sms' && !user.phone) continue;
      if (channel === 'push' && !user.push_token) continue;

      // Check user preferences
      const allowed = await preferenceService.isChannelAllowed(user_id, channel, category);
      if (!allowed) {
        logger.info('Channel blocked by user preference', { user_id, channel, category });
        continue;
      }

      // Check rate limiting (skip for critical priority)
      if (priority !== 'critical') {
        const withinLimit = await checkRateLimit(user_id, channel);
        if (!withinLimit) {
          logger.warn('Rate limit exceeded', { user_id, channel });
          continue;
        }
      }

      // Check quiet hours (skip for critical and security)
      if (priority !== 'critical' && category !== 'security') {
        if (isQuietHours() && (channel === 'sms' || channel === 'push')) {
          logger.info('Skipping channel due to quiet hours', { channel });
          continue;
        }
      }

      availableChannels.push(channel);
    }

    return availableChannels;
  }

  /**
   * Send notification to specific channel
   */
  async sendToChannel(notification, channel) {
    const { id, user_id, event_type, metadata } = notification;

    try {
      // Get template
      const template = await templateService.getTemplate(event_type, channel);
      
      if (!template) {
        logger.warn('Template not found', { event_type, channel });
        await this.logDelivery(id, channel, 'failed', 0, null, 'Template not found');
        return false;
      }

      // Render template
      const rendered = templateService.renderTemplate(template, metadata);

      // Get user contact info
      const userResult = await pool.query(
        'SELECT email, phone, push_token FROM users WHERE id = $1',
        [user_id]
      );
      const user = userResult.rows[0];

      // Send with retry
      const result = await retryWithBackoff(async () => {
        return await this.sendViaAdapter(channel, user, rendered);
      }, 3, 1000);

      // Log delivery
      await this.logDelivery(
        id,
        channel,
        result.success ? 'delivered' : 'failed',
        1,
        rendered.body,
        result.error || null,
        result
      );

      // Increment rate limit counter
      if (result.success) {
        await incrementRateLimit(user_id, channel);
      }

      return result.success;

    } catch (error) {
      logger.error('Channel delivery failed:', { channel, error: error.message });
      await this.logDelivery(id, channel, 'failed', 3, null, error.message);
      return false;
    }
  }

  /**
   * Send via appropriate adapter
   */
  async sendViaAdapter(channel, user, rendered) {
    const adapter = this.adapters[channel];
    
    if (!adapter) {
      throw new Error(`Adapter not found for channel: ${channel}`);
    }

    switch (channel) {
      case 'email':
        return await adapter.send(user.email, rendered.subject, rendered.body);
      case 'sms':
        return await adapter.send(user.phone, rendered.body);
      case 'push':
        return await adapter.send(user.push_token, rendered.subject || 'Notification', rendered.body);
      case 'in_app':
        return await adapter.send(user.id, rendered.subject || 'Notification', rendered.body);
      default:
        throw new Error(`Unknown channel: ${channel}`);
    }
  }

  /**
   * Get notification by ID
   */
  async getNotification(notificationId) {
    const result = await pool.query(
      'SELECT * FROM notifications WHERE id = $1',
      [notificationId]
    );
    return result.rows[0];
  }

  /**
   * Update notification status
   */
  async updateNotificationStatus(notificationId, status) {
    await pool.query(
      'UPDATE notifications SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [status, notificationId]
    );
  }

  /**
   * Log delivery attempt
   */
  async logDelivery(notificationId, channel, status, attemptCount, renderedContent, errorMessage, providerResponse = null) {
    await pool.query(
      `INSERT INTO delivery_logs 
       (notification_id, channel, status, attempt_count, rendered_content, error_message, provider_response, sent_at, delivered_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 
         CASE WHEN $3 IN ('sent', 'delivered') THEN CURRENT_TIMESTAMP ELSE NULL END,
         CASE WHEN $3 = 'delivered' THEN CURRENT_TIMESTAMP ELSE NULL END)`,
      [notificationId, channel, status, attemptCount, renderedContent, errorMessage, 
       providerResponse ? JSON.stringify(providerResponse) : null]
    );
  }

  /**
   * Determine event category
   */
  getEventCategory(eventType) {
    const categoryMap = {
      user_signup: 'transactional',
      order_placed: 'transactional',
      order_shipped: 'transactional',
      password_reset: 'security',
      security_alert: 'security',
      login_alert: 'security',
      promotional: 'marketing',
      newsletter: 'marketing',
      system_maintenance: 'system_alerts',
      account_update: 'transactional'
    };

    return categoryMap[eventType] || 'transactional';
  }
}

module.exports = new OrchestrationService();
