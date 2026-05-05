const { v4: uuidv4 } = require('uuid');
const Notification = require('../models/Notification');
const UserPreference = require('../models/UserPreference');
const logger = require('../config/logger');
const orchestrationService = require('./orchestration.service');

class IngestionService {
  async ingestEvent(eventData) {
    try {
      const eventId = `evt_${uuidv4()}`;
      const { event_type, user_id, priority, metadata, preferred_channels, schedule_time } = eventData;

      // Verify user exists or create default preferences
      let userPref = await UserPreference.findOne({ user_id });
      const User = require('../models/User');
      const userDoc = await User.findById(user_id);
      
      if (!userPref) {
        // Create new preferences with email
        userPref = await UserPreference.create({
          user_id,
          email: userDoc?.email || null,
          preferences: this.getDefaultPreferences()
        });
        
        logger.info('Created user preferences with email', { 
          user_id, 
          email: userDoc?.email 
        });
      } else if (!userPref.email && userDoc?.email) {
        // Update existing preferences with email if missing
        userPref.email = userDoc.email;
        await userPref.save();
        
        logger.info('Updated user preferences with email', { 
          user_id, 
          email: userDoc.email 
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
      // Try to find by event_id first (string), then by _id if it's a valid ObjectId
      let notification = await Notification.findOne({ event_id: identifier }).lean();
      
      // If not found and identifier looks like an ObjectId, try finding by _id
      if (!notification && identifier.match(/^[0-9a-fA-F]{24}$/)) {
        notification = await Notification.findById(identifier).lean();
      }

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
