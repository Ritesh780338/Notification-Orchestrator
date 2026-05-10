const logger = require('../config/logger');
const InAppNotification = require('../models/InAppNotification');

class InAppAdapter {
  /**
   * Send in-app notification (store in database)
   */
  async send(userId, title, body, metadata = {}) {
    try {
      console.log('[InAppAdapter] Sending notification:', {
        userId,
        title,
        body,  // Show full body in logs
        metadata
      });

      // Create notification in database
      const notification = await InAppNotification.create({
        user_id: userId,
        title,
        body,
        event_type: metadata.event_type || 'notification',
        priority: metadata.priority || 'normal',
        metadata,
        read: false,
        created_at: new Date()
      });

      logger.info('✅ In-app notification created', {
        notificationId: notification._id,
        userId,
        title
      });

      console.log('[InAppAdapter] Notification created successfully:', notification._id);

      return {
        success: true,
        messageId: notification._id.toString(),
        notificationId: notification._id,
        provider: 'inapp-database'
      };
    } catch (error) {
      logger.error('❌ In-app notification failed:', {
        error: error.message,
        userId
      });
      console.error('[InAppAdapter] Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get notifications for a user
   */
  async getNotifications(userId, options = {}) {
    try {
      const {
        limit = 50,
        skip = 0,
        unreadOnly = false
      } = options;

      const query = { user_id: userId };
      if (unreadOnly) {
        query.read = false;
      }

      const notifications = await InAppNotification
        .find(query)
        .sort({ created_at: -1 })
        .limit(limit)
        .skip(skip)
        .lean();

      const unreadCount = await InAppNotification.countDocuments({
        user_id: userId,
        read: false
      });

      return {
        success: true,
        notifications,
        unreadCount,
        total: notifications.length
      };
    } catch (error) {
      logger.error('Error fetching in-app notifications:', error);
      return {
        success: false,
        error: error.message,
        notifications: [],
        unreadCount: 0
      };
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId, userId) {
    try {
      const notification = await InAppNotification.findOneAndUpdate(
        { _id: notificationId, user_id: userId },
        { read: true, read_at: new Date() },
        { new: true }
      );

      if (!notification) {
        return { success: false, error: 'Notification not found' };
      }

      logger.info('Notification marked as read', { notificationId, userId });

      return { success: true, notification };
    } catch (error) {
      logger.error('Error marking notification as read:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId) {
    try {
      const result = await InAppNotification.updateMany(
        { user_id: userId, read: false },
        { read: true, read_at: new Date() }
      );

      logger.info('All notifications marked as read', {
        userId,
        count: result.modifiedCount
      });

      return {
        success: true,
        count: result.modifiedCount
      };
    } catch (error) {
      logger.error('Error marking all notifications as read:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId, userId) {
    try {
      const notification = await InAppNotification.findOneAndDelete({
        _id: notificationId,
        user_id: userId
      });

      if (!notification) {
        return { success: false, error: 'Notification not found' };
      }

      logger.info('Notification deleted', { notificationId, userId });

      return { success: true };
    } catch (error) {
      logger.error('Error deleting notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get unread count for a user
   */
  async getUnreadCount(userId) {
    try {
      const count = await InAppNotification.countDocuments({
        user_id: userId,
        read: false
      });

      return { success: true, count };
    } catch (error) {
      logger.error('Error getting unread count:', error);
      return { success: false, count: 0 };
    }
  }

  /**
   * Verify in-app adapter
   */
  async verify() {
    try {
      // Check if we can connect to database
      await InAppNotification.countDocuments().limit(1);
      logger.info('In-app adapter verified successfully');
      return true;
    } catch (error) {
      logger.error('In-app adapter verification failed:', error);
      return false;
    }
  }
}

module.exports = new InAppAdapter();
