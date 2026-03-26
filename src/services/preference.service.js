const pool = require('../config/database');
const logger = require('../config/logger');

class PreferenceService {
  /**
   * Get user preferences
   */
  async getUserPreferences(userId) {
    try {
      const result = await pool.query(
        'SELECT channel, category, enabled FROM user_preferences WHERE user_id = $1',
        [userId]
      );
      
      return result.rows;
    } catch (error) {
      logger.error('Error fetching user preferences:', error);
      throw error;
    }
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(userId, preferences) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      for (const pref of preferences) {
        await client.query(
          `INSERT INTO user_preferences (user_id, channel, category, enabled)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (user_id, channel, category)
           DO UPDATE SET enabled = EXCLUDED.enabled, updated_at = CURRENT_TIMESTAMP`,
          [userId, pref.channel, pref.category, pref.enabled]
        );
      }
      
      await client.query('COMMIT');
      
      return await this.getUserPreferences(userId);
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error updating user preferences:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Check if user allows notifications for channel and category
   */
  async isChannelAllowed(userId, channel, category) {
    try {
      // Check suppression list first
      const suppressionResult = await pool.query(
        'SELECT id FROM suppression_list WHERE user_id = $1 AND channel = $2',
        [userId, channel]
      );
      
      if (suppressionResult.rows.length > 0) {
        return false; // Hard suppression
      }

      // Check user preferences
      const prefResult = await pool.query(
        'SELECT enabled FROM user_preferences WHERE user_id = $1 AND channel = $2 AND category = $3',
        [userId, channel, category]
      );
      
      if (prefResult.rows.length === 0) {
        return true; // No preference set, allow by default
      }
      
      return prefResult.rows[0].enabled;
    } catch (error) {
      logger.error('Error checking channel permission:', error);
      throw error;
    }
  }

  /**
   * Add user to suppression list
   */
  async suppressUser(userId, channel, reason = null) {
    try {
      await pool.query(
        `INSERT INTO suppression_list (user_id, channel, reason)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, channel) DO NOTHING`,
        [userId, channel, reason]
      );
      
      logger.info('User added to suppression list', { userId, channel });
    } catch (error) {
      logger.error('Error adding to suppression list:', error);
      throw error;
    }
  }
}

module.exports = new PreferenceService();
