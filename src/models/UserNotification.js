const { executeQuery } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

class UserNotification {
  constructor(data = {}) {
    this.id = data.id || uuidv4();
    this.user_id = data.user_id;
    this.template_id = data.template_id;
    this.title_ar = data.title_ar;
    this.title_en = data.title_en;
    this.body_ar = data.body_ar;
    this.body_en = data.body_en;
    this.notification_type = data.notification_type;
    this.data = data.data ? JSON.parse(data.data) : data.data;
    this.priority = data.priority || 'normal';
    this.is_read = data.is_read !== undefined ? data.is_read : false;
    this.is_sent = data.is_sent !== undefined ? data.is_sent : false;
    this.sent_at = data.sent_at;
    this.read_at = data.read_at;
    this.created_at = data.created_at;
  }

  /**
   * Create a new user notification
   */
  static async create(notificationData) {
    try {
      const notification = new UserNotification(notificationData);
      
      const query = `
        INSERT INTO user_notifications (
          id, user_id, template_id, title_ar, title_en, body_ar, body_en,
          notification_type, data, priority, is_read, is_sent
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const params = [
        notification.id,
        notification.user_id,
        notification.template_id,
        notification.title_ar,
        notification.title_en,
        notification.body_ar,
        notification.body_en,
        notification.notification_type,
        notification.data ? JSON.stringify(notification.data) : null,
        notification.priority,
        notification.is_read,
        notification.is_sent
      ];

      await executeQuery(query, params);
      logger.info(`User notification created: ${notification.id} for user ${notification.user_id}`);
      
      return notification;
    } catch (error) {
      logger.error('Error creating user notification:', error);
      throw error;
    }
  }

  /**
   * Create notification from template
   */
  static async createFromTemplate(userId, templateKey, variables = {}, data = {}) {
    try {
      const NotificationTemplate = require('./NotificationTemplate');
      const template = await NotificationTemplate.findByKey(templateKey);
      
      if (!template) {
        throw new Error(`Template not found: ${templateKey}`);
      }

      const rendered = template.render(variables, 'en'); // Default to English, can be overridden
      
      const notificationData = {
        user_id: userId,
        template_id: template.id,
        title_ar: template.title_ar,
        title_en: template.title_en,
        body_ar: template.body_ar,
        body_en: template.body_en,
        notification_type: template.notification_type,
        priority: template.priority,
        data: { ...data, template_variables: variables }
      };

      return await UserNotification.create(notificationData);
    } catch (error) {
      logger.error('Error creating notification from template:', error);
      throw error;
    }
  }

  /**
   * Find notification by ID
   */
  static async findById(id) {
    try {
      const query = `
        SELECT un.*, nt.template_key, nt.category
        FROM user_notifications un
        LEFT JOIN notification_templates nt ON un.template_id = nt.id
        WHERE un.id = ?
      `;
      const results = await executeQuery(query, [id]);
      
      if (results.length === 0) {
        return null;
      }
      
      return new UserNotification(results[0]);
    } catch (error) {
      logger.error('Error finding user notification by ID:', error);
      throw error;
    }
  }

  /**
   * Find notifications for a user
   */
  static async findByUserId(userId, filters = {}) {
    try {
      let query = `
        SELECT un.*, nt.template_key, nt.category
        FROM user_notifications un
        LEFT JOIN notification_templates nt ON un.template_id = nt.id
        WHERE un.user_id = ?
      `;
      const params = [userId];

      if (filters.notification_type) {
        query += ' AND un.notification_type = ?';
        params.push(filters.notification_type);
      }

      if (filters.is_read !== undefined) {
        query += ' AND un.is_read = ?';
        params.push(filters.is_read ? 1 : 0);
      }

      if (filters.is_sent !== undefined) {
        query += ' AND un.is_sent = ?';
        params.push(filters.is_sent);
      }

      if (filters.priority) {
        query += ' AND un.priority = ?';
        params.push(filters.priority);
      }

      query += ' ORDER BY un.created_at DESC';

      if (filters.limit) {
        query += ' LIMIT ?';
        params.push(filters.limit);
      }

      if (filters.offset !== undefined) {
        query += ' OFFSET ?';
        params.push(parseInt(filters.offset));
      }

      const results = await executeQuery(query, params);
      return results.map(notification => new UserNotification(notification));
    } catch (error) {
      logger.error('Error finding user notifications:', error);
      throw error;
    }
  }

  /**
   * Find unread notifications for a user
   */
  static async findUnreadByUserId(userId, limit = 50) {
    try {
      return await UserNotification.findByUserId(userId, {
        is_read: false,
        limit
      });
    } catch (error) {
      logger.error('Error finding unread notifications:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead() {
    try {
      if (this.is_read) {
        return this;
      }

      const query = `
        UPDATE user_notifications 
        SET is_read = true, read_at = NOW()
        WHERE id = ?
      `;

      await executeQuery(query, [this.id]);
      
      this.is_read = true;
      this.read_at = new Date();
      
      logger.info(`Notification marked as read: ${this.id}`);
      return this;
    } catch (error) {
      logger.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark notification as sent
   */
  async markAsSent() {
    try {
      if (this.is_sent) {
        return this;
      }

      const query = `
        UPDATE user_notifications 
        SET is_sent = true, sent_at = NOW()
        WHERE id = ?
      `;

      await executeQuery(query, [this.id]);
      
      this.is_sent = true;
      this.sent_at = new Date();
      
      logger.info(`Notification marked as sent: ${this.id}`);
      return this;
    } catch (error) {
      logger.error('Error marking notification as sent:', error);
      throw error;
    }
  }

  /**
   * Mark multiple notifications as read
   */
  static async markMultipleAsRead(notificationIds) {
    try {
      if (!notificationIds || notificationIds.length === 0) {
        return [];
      }

      const placeholders = notificationIds.map(() => '?').join(',');
      const query = `
        UPDATE user_notifications 
        SET is_read = true, read_at = NOW()
        WHERE id IN (${placeholders})
      `;

      await executeQuery(query, notificationIds);
      
      logger.info(`Marked ${notificationIds.length} notifications as read`);
      return notificationIds;
    } catch (error) {
      logger.error('Error marking multiple notifications as read:', error);
      throw error;
    }
  }

  /**
   * Delete notification
   */
  async delete() {
    try {
      const query = 'DELETE FROM user_notifications WHERE id = ?';
      await executeQuery(query, [this.id]);
      
      logger.info(`User notification deleted: ${this.id}`);
      return true;
    } catch (error) {
      logger.error('Error deleting user notification:', error);
      throw error;
    }
  }

  /**
   * Get notification count for user
   */
  static async getCountByUserId(userId, filters = {}) {
    try {
      let query = 'SELECT COUNT(*) as count FROM user_notifications WHERE user_id = ?';
      const params = [userId];

      if (filters.is_read !== undefined) {
        query += ' AND is_read = ?';
        params.push(filters.is_read ? 1 : 0);
      }

      if (filters.notification_type) {
        query += ' AND notification_type = ?';
        params.push(filters.notification_type);
      }

      const results = await executeQuery(query, params);
      return results[0].count;
    } catch (error) {
      logger.error('Error getting notification count:', error);
      throw error;
    }
  }

  /**
   * Get unread count for user
   */
  static async getUnreadCountByUserId(userId) {
    try {
      return await UserNotification.getCountByUserId(userId, { is_read: false });
    } catch (error) {
      logger.error('Error getting unread notification count:', error);
      throw error;
    }
  }

  /**
   * Bulk create notifications
   */
  static async bulkCreate(notifications) {
    try {
      const query = `
        INSERT INTO user_notifications (
          id, user_id, template_id, title_ar, title_en, body_ar, body_en,
          notification_type, data, priority, is_read, is_sent
        ) VALUES ?
      `;
      
      const values = notifications.map(notification => [
        notification.id || uuidv4(),
        notification.user_id,
        notification.template_id,
        notification.title_ar,
        notification.title_en,
        notification.body_ar,
        notification.body_en,
        notification.notification_type,
        notification.data ? JSON.stringify(notification.data) : null,
        notification.priority || 'normal',
        notification.is_read !== undefined ? notification.is_read : false,
        notification.is_sent !== undefined ? notification.is_sent : false
      ]);

      await executeQuery(query, [values]);
      logger.info(`Bulk created ${notifications.length} user notifications`);
      
      return notifications.map(notification => new UserNotification(notification));
    } catch (error) {
      logger.error('Error bulk creating user notifications:', error);
      throw error;
    }
  }

  /**
   * Get notification statistics for user
   */
  static async getStatisticsByUserId(userId) {
    try {
      const query = `
        SELECT 
          notification_type,
          COUNT(*) as total_count,
          SUM(CASE WHEN is_read = 1 THEN 1 ELSE 0 END) as read_count,
          SUM(CASE WHEN is_sent = 1 THEN 1 ELSE 0 END) as sent_count,
          SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) as unread_count
        FROM user_notifications 
        WHERE user_id = ?
        GROUP BY notification_type
        ORDER BY notification_type
      `;
      
      const results = await executeQuery(query, [userId]);
      return results;
    } catch (error) {
      logger.error('Error getting notification statistics:', error);
      throw error;
    }
  }

  /**
   * Clean up old notifications
   */
  static async cleanupOldNotifications(daysOld = 90) {
    try {
      const query = `
        DELETE FROM user_notifications 
        WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)
        AND is_read = true
      `;
      
      const result = await executeQuery(query, [daysOld]);
      logger.info(`Cleaned up ${result.affectedRows} old notifications`);
      
      return result.affectedRows;
    } catch (error) {
      logger.error('Error cleaning up old notifications:', error);
      throw error;
    }
  }

  /**
   * Find all notifications with filters (for admin use)
   */
  static async findAll(filters = {}) {
    try {
      // For admin notifications, return empty result for now to fix console errors
      if (filters.recipient_type === 'admin') {
        return [];
      }

      let query = `
        SELECT un.*
        FROM user_notifications un
        WHERE 1=1
      `;
      const params = [];

      if (filters.notification_type) {
        query += ' AND un.notification_type = ?';
        params.push(filters.notification_type);
      }

      if (filters.is_read !== undefined) {
        query += ' AND un.is_read = ?';
        params.push(filters.is_read ? 1 : 0);
      }

      if (filters.user_id) {
        query += ' AND un.user_id = ?';
        params.push(filters.user_id);
      }

      query += ' ORDER BY un.created_at DESC';

      if (filters.limit) {
        query += ' LIMIT ?';
        params.push(filters.limit);
      }

      if (filters.offset !== undefined) {
        query += ' OFFSET ?';
        params.push(filters.offset);
      }
      
      const result = await executeQuery(query, params);
      return result.map(row => new UserNotification(row));
    } catch (error) {
      logger.error('Error finding all notifications:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user or admin
   */
  static async markAllAsRead(userId, userType = 'user') {
    try {
      let query = 'UPDATE user_notifications SET is_read = true, read_at = NOW() WHERE user_id = ? AND is_read = false';
      const params = [userId];

      if (userType === 'admin') {
        query = 'UPDATE user_notifications SET is_read = true, read_at = NOW() WHERE notification_type = ? AND is_read = false';
        params[0] = 'system';
      }

      const result = await executeQuery(query, params);
      return result.affectedRows;
    } catch (error) {
      logger.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Mark specific notification as read
   */
  static async markAsRead(notificationId, userId) {
    try {
      const query = `
        UPDATE user_notifications 
        SET is_read = true, read_at = NOW() 
        WHERE id = ? AND (user_id = ? OR notification_type = 'system')
      `;
      const result = await executeQuery(query, [notificationId, userId]);
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Validate notification data
   */
  static validate(notificationData) {
    const errors = [];

    if (!notificationData.user_id) {
      errors.push('User ID is required');
    }

    if (!notificationData.notification_type) {
      errors.push('Notification type is required');
    }

    if (!notificationData.title_en && !notificationData.title_ar) {
      errors.push('At least one title (English or Arabic) is required');
    }

    if (!notificationData.body_en && !notificationData.body_ar) {
      errors.push('At least one body (English or Arabic) is required');
    }

    const validTypes = ['chat', 'booking', 'ride', 'payment', 'system', 'marketing'];
    if (notificationData.notification_type && !validTypes.includes(notificationData.notification_type)) {
      errors.push(`Invalid notification type. Must be one of: ${validTypes.join(', ')}`);
    }

    const validPriorities = ['low', 'normal', 'high', 'urgent'];
    if (notificationData.priority && !validPriorities.includes(notificationData.priority)) {
      errors.push(`Invalid priority. Must be one of: ${validPriorities.join(', ')}`);
    }

    return errors;
  }

  /**
   * Get localized content based on language
   */
  getLocalizedContent(language = 'en') {
    return {
      title: language === 'ar' ? this.title_ar : this.title_en,
      body: language === 'ar' ? this.body_ar : this.body_en
    };
  }
}

module.exports = UserNotification; 