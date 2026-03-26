const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');
const logger = require('../config/logger');
const orchestrationService = require('./orchestration.service');

class IngestionService {
  /**
   * Ingest notification event
   */
  async ingestEvent(eventData) {
    try {
      const eventId = `evt_${uuidv4()}`;
      
      const { event_type, user_id, priority, metadata, preferred_channels, schedule_time } = eventData;

      // Verify user exists
      const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [user_id]);
      if (userCheck.rows.length === 0) {
        throw new Error('User not found');
      }

      // Insert notification
      const result = await pool.query(
        `INSERT INTO notifications 
         (event_id, event_type, user_id, priority, metadata, preferred_channels, schedule_time, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'received')
         RETURNING id, event_id`,
        [
          eventId,
          event_type,
          user_id,
          priority || 'normal',
          JSON.stringify(metadata || {}),
          preferred_channels || null,
          schedule_time || null
        ]
      );

      const notification = result.rows[0];

      logger.info('Event ingested', {
        event_id: eventId,
        notification_id: notification.id,
        event_type
      });

      // Process immediately if not scheduled
      if (!schedule_time || new Date(schedule_time) <= new Date()) {
        // Process asynchronously
        setImmediate(() => {
          orchestrationService.processNotification(notification.id)
            .catch(err => logger.error('Error processing notification:', err));
        });
      }

      return {
        event_id: eventId,
        notification_id: notification.id,
        status: 'accepted'
      };

    } catch (error) {
      logger.error('Error ingesting event:', error);
      throw error;
    }
  }

  /**
   * Get notification status
   */
  async getNotificationStatus(notificationId) {
    try {
      const notificationResult = await pool.query(
        `SELECT id, event_id, event_type, user_id, priority, status, 
                schedule_time, created_at, updated_at
         FROM notifications 
         WHERE id = $1 OR event_id = $1`,
        [notificationId]
      );

      if (notificationResult.rows.length === 0) {
        return null;
      }

      const notification = notificationResult.rows[0];

      // Get delivery logs
      const logsResult = await pool.query(
        `SELECT channel, status, attempt_count, sent_at, delivered_at, error_message
         FROM delivery_logs
         WHERE notification_id = $1
         ORDER BY created_at DESC`,
        [notification.id]
      );

      return {
        ...notification,
        delivery_logs: logsResult.rows
      };

    } catch (error) {
      logger.error('Error fetching notification status:', error);
      throw error;
    }
  }

  /**
   * Process scheduled notifications
   */
  async processScheduledNotifications() {
    try {
      const result = await pool.query(
        `SELECT id FROM notifications 
         WHERE status = 'scheduled' 
         AND schedule_time <= CURRENT_TIMESTAMP
         LIMIT 100`
      );

      logger.info(`Processing ${result.rows.length} scheduled notifications`);

      for (const row of result.rows) {
        orchestrationService.processNotification(row.id)
          .catch(err => logger.error('Error processing scheduled notification:', err));
      }

    } catch (error) {
      logger.error('Error processing scheduled notifications:', error);
    }
  }
}

module.exports = new IngestionService();
