const { v4: uuidv4 } = require('uuid');
const Notification = require('../models/Notification');
const UserPreference = require('../models/UserPreference');
const logger = require('../config/logger');
const orchestrationService = require('./orchestration.service.mongo');

class IngestionService {
  async ingestEvent(eventData) {
    try {
      const eventId = `evt_${uuidv4()}`;
      const { event_type, user_id, priority, metadata, preferred_channels, schedule_time } = eventData;

      // Verify user exists or create default preferences
      let user = await UserPreference.findOne({ user_id });
      if (!user) {
        user = await UserPreference.create({
          user_id,
          preferences: this.getDefaultPreferences()
        });
      }

      // Create notification
      const notification = await Notification.create({
        event_id: eventId,
        event_type,
        user_id,
        priority: priority || 'normal',
        metadata: metadata || {},
        preferred_channels,
        schedule_time,
        status: 'received'
      });

      logger.info('Event ingested', {
        event_id: eventId,
        notification_id: notification._id,
        event_type
      });

      // Process immediately if not scheduled
      if (!schedule_time || new Date(schedule_time) <= new Date()) {
        setImmediate(() => {
          orchestrationService.processNotification(notification._id.toString())
            .catch(err => logger.error('Error processing notification:', err));
        });
      }

      return {
        event_id: eventId,
        notification_id: notification._id.toString(),
        status: 'accepted'
      };

    } catch (error) {
      logger.error('Error ingesting event:', error);
      throw error;
    }
  }

  async getNotificationStatus(identifier) {
    try {
      const notification = await Notification.findOne({
        $or: [
          { _id: identifier },
          { event_id: identifier }
        ]
      }).lean();

      if (!notification) {
        return null;
      }

      return {
        event_id: notification.event_id,
        event_type: notification.event_type,
        user_id: notification.user_id,
        priority: notification.priority,
        status: notification.status,
        channels: notification.channels,
        schedule_time: notification.schedule_time,
        created_at: notification.created_at,
        updated_at: notification.updated_at,
        processed_at: notification.processed_at
      };

    } catch (error) {
      logger.error('Error fetching notification status:', error);
      throw error;
    }
  }

  async processScheduledNotifications() {
    try {
      const notifications = await Notification.find({
        status: 'scheduled',
        schedule_time: { $lte: new Date() }
      }).limit(100);

      logger.info(`Processing ${notifications.length} scheduled notifications`);

      for (const notification of notifications) {
        orchestrationService.processNotification(notification._id.toString())
          .catch(err => logger.error('Error processing scheduled notification:', err));
      }

    } catch (error) {
      logger.error('Error processing scheduled notifications:', error);
    }
  }

  getDefaultPreferences() {
    const channels = ['email', 'sms', 'push', 'inapp'];
    const categories = ['marketing', 'transactional', 'security', 'system'];
    const preferences = [];

    for (const channel of channels) {
      for (const category of categories) {
        preferences.push({
          channel,
          category,
          enabled: category !== 'marketing' // Marketing opt-in by default
        });
      }
    }

    return preferences;
  }
}

module.exports = new IngestionService();
