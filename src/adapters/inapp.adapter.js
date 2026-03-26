const pool = require('../config/database');
const logger = require('../config/logger');

class InAppAdapter {
  /**
   * Send in-app notification (Store in database for user to retrieve)
   */
  async send(userId, title, body) {
    try {
      // In-app notifications are stored in database
      // In production, you might also use WebSocket to push real-time
      
      const result = await pool.query(
        `INSERT INTO delivery_logs (notification_id, channel, status, rendered_content, sent_at)
         SELECT id, 'in_app', 'delivered', $2, CURRENT_TIMESTAMP
         FROM notifications 
         WHERE user_id = $1 
         ORDER BY created_at DESC 
         LIMIT 1
         RETURNING id`,
        [userId, JSON.stringify({ title, body })]
      );

      logger.info('In-app notification stored', {
        userId,
        title
      });

      return {
        success: true,
        messageId: result.rows[0]?.id || `inapp_${Date.now()}`,
        provider: 'internal'
      };
    } catch (error) {
      logger.error('In-app notification failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get unread in-app notifications for user
   */
  async getUnreadNotifications(userId, limit = 50) {
    try {
      const result = await pool.query(
        `SELECT dl.id, dl.rendered_content, dl.sent_at, n.event_type
         FROM delivery_logs dl
         JOIN notifications n ON dl.notification_id = n.id
         WHERE n.user_id = $1 AND dl.channel = 'in_app' AND dl.status = 'delivered'
         ORDER BY dl.sent_at DESC
         LIMIT $2`,
        [userId, limit]
      );

      return result.rows.map(row => ({
        id: row.id,
        ...JSON.parse(row.rendered_content),
        event_type: row.event_type,
        sent_at: row.sent_at
      }));
    } catch (error) {
      logger.error('Error fetching in-app notifications:', error);
      throw error;
    }
  }

  /**
   * Verify in-app adapter
   */
  async verify() {
    logger.info('In-app adapter verified');
    return true;
  }
}

module.exports = new InAppAdapter();
