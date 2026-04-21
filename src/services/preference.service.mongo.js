const UserPreference = require('../models/UserPreference');
const logger = require('../config/logger');

class PreferenceService {
  async getUserPreferences(userId) {
    try {
      let userPref = await UserPreference.findOne({ user_id: userId });
      
      if (!userPref) {
        // Create default preferences
        userPref = await UserPreference.create({
          user_id: userId,
          preferences: this.getDefaultPreferences()
        });
      }
      
      return {
        user_id: userPref.user_id,
        email: userPref.email,
        phone: userPref.phone,
        push_token: userPref.push_token,
        preferences: userPref.preferences,
        global_opt_out: userPref.global_opt_out,
        quiet_hours: userPref.quiet_hours
      };
    } catch (error) {
      logger.error('Error fetching user preferences:', error);
      throw error;
    }
  }

  async updateUserPreferences(userId, updateData) {
    try {
      let userPref = await UserPreference.findOne({ user_id: userId });
      
      if (!userPref) {
        userPref = new UserPreference({
          user_id: userId,
          preferences: this.getDefaultPreferences()
        });
      }

      // Update contact info if provided
      if (updateData.email) userPref.email = updateData.email;
      if (updateData.phone) userPref.phone = updateData.phone;
      if (updateData.push_token) userPref.push_token = updateData.push_token;
      
      // Update preferences
      if (updateData.preferences && Array.isArray(updateData.preferences)) {
        for (const pref of updateData.preferences) {
          const existing = userPref.preferences.find(
            p => p.channel === pref.channel && p.category === pref.category
          );
          
          if (existing) {
            existing.enabled = pref.enabled;
          } else {
            userPref.preferences.push(pref);
          }
        }
      }

      // Update global opt-out
      if (typeof updateData.global_opt_out === 'boolean') {
        userPref.global_opt_out = updateData.global_opt_out;
      }

      // Update quiet hours
      if (updateData.quiet_hours) {
        userPref.quiet_hours = {
          ...userPref.quiet_hours,
          ...updateData.quiet_hours
        };
      }

      await userPref.save();
      
      return this.getUserPreferences(userId);
    } catch (error) {
      logger.error('Error updating user preferences:', error);
      throw error;
    }
  }

  async isChannelAllowed(userId, channel, category) {
    try {
      const userPref = await UserPreference.findOne({ user_id: userId });
      
      if (!userPref) {
        return true; // Allow by default if no preferences set
      }

      // Check global opt-out
      if (userPref.global_opt_out) {
        return false;
      }

      // Check suppression
      if (userPref.suppressed) {
        return false;
      }

      // Check specific preference
      const pref = userPref.preferences.find(
        p => p.channel === channel && p.category === category
      );
      
      if (!pref) {
        return true; // Allow by default if preference not set
      }
      
      return pref.enabled;
    } catch (error) {
      logger.error('Error checking channel permission:', error);
      throw error;
    }
  }

  async suppressUser(userId, reason = null) {
    try {
      await UserPreference.findOneAndUpdate(
        { user_id: userId },
        { suppressed: true },
        { upsert: true }
      );
      
      logger.info('User suppressed', { userId, reason });
    } catch (error) {
      logger.error('Error suppressing user:', error);
      throw error;
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
          enabled: category !== 'marketing'
        });
      }
    }

    return preferences;
  }
}

module.exports = new PreferenceService();
