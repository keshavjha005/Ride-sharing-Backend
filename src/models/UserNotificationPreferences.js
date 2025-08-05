const { executeQuery } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

class UserNotificationPreferences {
  constructor(data = {}) {
    this.id = data.id || uuidv4();
    this.user_id = data.user_id;
    this.email_enabled = data.email_enabled !== undefined ? data.email_enabled : true;
    this.sms_enabled = data.sms_enabled !== undefined ? data.sms_enabled : true;
    this.push_enabled = data.push_enabled !== undefined ? data.push_enabled : true;
    this.in_app_enabled = data.in_app_enabled !== undefined ? data.in_app_enabled : true;
    this.notification_types = data.notification_types ? JSON.parse(data.notification_types) : data.notification_types;
    this.quiet_hours_start = data.quiet_hours_start || '22:00:00';
    this.quiet_hours_end = data.quiet_hours_end || '08:00:00';
    this.timezone = data.timezone || 'UTC';
    this.language_code = data.language_code || 'en';
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  /**
   * Create notification preferences for a user
   */
  static async create(preferencesData) {
    try {
      const preferences = new UserNotificationPreferences(preferencesData);
      
      const query = `
        INSERT INTO user_notification_preferences (
          id, user_id, email_enabled, sms_enabled, push_enabled, in_app_enabled,
          notification_types, quiet_hours_start, quiet_hours_end, timezone, language_code
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const params = [
        preferences.id,
        preferences.user_id,
        preferences.email_enabled,
        preferences.sms_enabled,
        preferences.push_enabled,
        preferences.in_app_enabled,
        preferences.notification_types ? JSON.stringify(preferences.notification_types) : null,
        preferences.quiet_hours_start,
        preferences.quiet_hours_end,
        preferences.timezone,
        preferences.language_code
      ];

      await executeQuery(query, params);
      logger.info(`Notification preferences created for user: ${preferences.user_id}`);
      
      return preferences;
    } catch (error) {
      logger.error('Error creating notification preferences:', error);
      throw error;
    }
  }

  /**
   * Find preferences by user ID
   */
  static async findByUserId(userId) {
    try {
      const query = 'SELECT * FROM user_notification_preferences WHERE user_id = ?';
      const results = await executeQuery(query, [userId]);
      
      if (results.length === 0) {
        return null;
      }
      
      return new UserNotificationPreferences(results[0]);
    } catch (error) {
      logger.error('Error finding notification preferences:', error);
      throw error;
    }
  }

  /**
   * Find or create preferences for a user
   */
  static async findOrCreate(userId, defaultPreferences = {}) {
    try {
      let preferences = await UserNotificationPreferences.findByUserId(userId);
      
      if (!preferences) {
        const defaultData = {
          user_id: userId,
          notification_types: ['chat', 'booking', 'ride', 'payment', 'system'],
          ...defaultPreferences
        };
        preferences = await UserNotificationPreferences.create(defaultData);
      }
      
      return preferences;
    } catch (error) {
      logger.error('Error finding or creating notification preferences:', error);
      throw error;
    }
  }

  /**
   * Update preferences
   */
  async update(updateData) {
    try {
      const allowedFields = [
        'email_enabled', 'sms_enabled', 'push_enabled', 'in_app_enabled',
        'notification_types', 'quiet_hours_start', 'quiet_hours_end',
        'timezone', 'language_code'
      ];

      const updates = [];
      const params = [];

      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          updates.push(`${field} = ?`);
          if (field === 'notification_types' && updateData[field]) {
            params.push(JSON.stringify(updateData[field]));
          } else {
            params.push(updateData[field]);
          }
        }
      }

      if (updates.length === 0) {
        return this;
      }

      updates.push('updated_at = NOW()');
      params.push(this.id);

      const query = `
        UPDATE user_notification_preferences 
        SET ${updates.join(', ')}
        WHERE id = ?
      `;

      await executeQuery(query, params);
      
      // Update local object
      Object.assign(this, updateData);
      this.updated_at = new Date();
      
      logger.info(`Notification preferences updated for user: ${this.user_id}`);
      return this;
    } catch (error) {
      logger.error('Error updating notification preferences:', error);
      throw error;
    }
  }

  /**
   * Delete preferences
   */
  async delete() {
    try {
      const query = 'DELETE FROM user_notification_preferences WHERE id = ?';
      await executeQuery(query, [this.id]);
      
      logger.info(`Notification preferences deleted for user: ${this.user_id}`);
      return true;
    } catch (error) {
      logger.error('Error deleting notification preferences:', error);
      throw error;
    }
  }

  /**
   * Check if notification type is enabled
   */
  isNotificationTypeEnabled(notificationType) {
    if (!this.notification_types || this.notification_types.length === 0) {
      return true; // Default to enabled if no specific types set
    }
    return this.notification_types.includes(notificationType);
  }

  /**
   * Check if delivery method is enabled
   */
  isDeliveryMethodEnabled(method) {
    switch (method) {
      case 'email':
        return this.email_enabled;
      case 'sms':
        return this.sms_enabled;
      case 'push':
        return this.push_enabled;
      case 'in_app':
        return this.in_app_enabled;
      default:
        return false;
    }
  }

  /**
   * Check if currently in quiet hours
   */
  isInQuietHours() {
    try {
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 8); // HH:MM:SS format
      
      const start = this.quiet_hours_start;
      const end = this.quiet_hours_end;
      
      // Handle quiet hours that span midnight
      if (start > end) {
        return currentTime >= start || currentTime <= end;
      } else {
        return currentTime >= start && currentTime <= end;
      }
    } catch (error) {
      logger.error('Error checking quiet hours:', error);
      return false;
    }
  }

  /**
   * Get enabled delivery methods
   */
  getEnabledDeliveryMethods() {
    const methods = [];
    
    if (this.email_enabled) methods.push('email');
    if (this.sms_enabled) methods.push('sms');
    if (this.push_enabled) methods.push('push');
    if (this.in_app_enabled) methods.push('in_app');
    
    return methods;
  }

  /**
   * Get enabled notification types
   */
  getEnabledNotificationTypes() {
    return this.notification_types || ['chat', 'booking', 'ride', 'payment', 'system'];
  }

  /**
   * Add notification type
   */
  addNotificationType(notificationType) {
    if (!this.notification_types) {
      this.notification_types = [];
    }
    
    if (!this.notification_types.includes(notificationType)) {
      this.notification_types.push(notificationType);
    }
  }

  /**
   * Remove notification type
   */
  removeNotificationType(notificationType) {
    if (this.notification_types) {
      this.notification_types = this.notification_types.filter(type => type !== notificationType);
    }
  }

  /**
   * Enable delivery method
   */
  enableDeliveryMethod(method) {
    switch (method) {
      case 'email':
        this.email_enabled = true;
        break;
      case 'sms':
        this.sms_enabled = true;
        break;
      case 'push':
        this.push_enabled = true;
        break;
      case 'in_app':
        this.in_app_enabled = true;
        break;
    }
  }

  /**
   * Disable delivery method
   */
  disableDeliveryMethod(method) {
    switch (method) {
      case 'email':
        this.email_enabled = false;
        break;
      case 'sms':
        this.sms_enabled = false;
        break;
      case 'push':
        this.push_enabled = false;
        break;
      case 'in_app':
        this.in_app_enabled = false;
        break;
    }
  }

  /**
   * Get preferences statistics
   */
  static async getStatistics() {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_users,
          SUM(CASE WHEN email_enabled = 1 THEN 1 ELSE 0 END) as email_enabled_count,
          SUM(CASE WHEN sms_enabled = 1 THEN 1 ELSE 0 END) as sms_enabled_count,
          SUM(CASE WHEN push_enabled = 1 THEN 1 ELSE 0 END) as push_enabled_count,
          SUM(CASE WHEN in_app_enabled = 1 THEN 1 ELSE 0 END) as in_app_enabled_count,
          language_code,
          COUNT(*) as language_count
        FROM user_notification_preferences 
        GROUP BY language_code
        ORDER BY language_count DESC
      `;
      
      const results = await executeQuery(query);
      return results;
    } catch (error) {
      logger.error('Error getting notification preferences statistics:', error);
      throw error;
    }
  }

  /**
   * Bulk update preferences
   */
  static async bulkUpdate(userIds, updateData) {
    try {
      if (!userIds || userIds.length === 0) {
        return [];
      }

      const allowedFields = [
        'email_enabled', 'sms_enabled', 'push_enabled', 'in_app_enabled',
        'notification_types', 'quiet_hours_start', 'quiet_hours_end',
        'timezone', 'language_code'
      ];

      const updates = [];
      const params = [];

      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          updates.push(`${field} = ?`);
          if (field === 'notification_types' && updateData[field]) {
            params.push(JSON.stringify(updateData[field]));
          } else {
            params.push(updateData[field]);
          }
        }
      }

      if (updates.length === 0) {
        return [];
      }

      updates.push('updated_at = NOW()');

      const placeholders = userIds.map(() => '?').join(',');
      const query = `
        UPDATE user_notification_preferences 
        SET ${updates.join(', ')}
        WHERE user_id IN (${placeholders})
      `;

      const result = await executeQuery(query, [...params, ...userIds]);
      logger.info(`Bulk updated preferences for ${result.affectedRows} users`);
      
      return result.affectedRows;
    } catch (error) {
      logger.error('Error bulk updating notification preferences:', error);
      throw error;
    }
  }

  /**
   * Validate preferences data
   */
  static validate(preferencesData) {
    const errors = [];

    if (preferencesData.user_id === undefined) {
      errors.push('User ID is required');
    }

    const validTimeFormat = /^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
    
    if (preferencesData.quiet_hours_start && !validTimeFormat.test(preferencesData.quiet_hours_start)) {
      errors.push('Invalid quiet hours start time format (HH:MM:SS)');
    }

    if (preferencesData.quiet_hours_end && !validTimeFormat.test(preferencesData.quiet_hours_end)) {
      errors.push('Invalid quiet hours end time format (HH:MM:SS)');
    }

    if (preferencesData.notification_types && !Array.isArray(preferencesData.notification_types)) {
      errors.push('Notification types must be an array');
    }

    const validTypes = ['chat', 'booking', 'ride', 'payment', 'system', 'marketing'];
    if (preferencesData.notification_types) {
      for (const type of preferencesData.notification_types) {
        if (!validTypes.includes(type)) {
          errors.push(`Invalid notification type: ${type}. Must be one of: ${validTypes.join(', ')}`);
        }
      }
    }

    return errors;
  }

  /**
   * Get default preferences
   */
  static getDefaultPreferences() {
    return {
      email_enabled: true,
      sms_enabled: true,
      push_enabled: true,
      in_app_enabled: true,
      notification_types: ['chat', 'booking', 'ride', 'payment', 'system'],
      quiet_hours_start: '22:00:00',
      quiet_hours_end: '08:00:00',
      timezone: 'UTC',
      language_code: 'en'
    };
  }
}

module.exports = UserNotificationPreferences; 