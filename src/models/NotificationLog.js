const { executeQuery } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

class NotificationLog {
  constructor(data = {}) {
    this.id = data.id || uuidv4();
    this.notification_id = data.notification_id;
    this.user_id = data.user_id;
    this.delivery_method = data.delivery_method;
    this.status = data.status || 'pending';
    this.error_message = data.error_message;
    this.sent_at = data.sent_at;
    this.delivered_at = data.delivered_at;
    this.created_at = data.created_at;
  }

  /**
   * Create a new notification log entry
   */
  static async create(logData) {
    try {
      const log = new NotificationLog(logData);
      
      const query = `
        INSERT INTO notification_logs (
          id, notification_id, user_id, delivery_method, status, error_message
        ) VALUES (?, ?, ?, ?, ?, ?)
      `;
      
      const params = [
        log.id,
        log.notification_id,
        log.user_id,
        log.delivery_method,
        log.status,
        log.error_message
      ];

      await executeQuery(query, params);
      logger.info(`Notification log created: ${log.id} for notification ${log.notification_id}`);
      
      return log;
    } catch (error) {
      logger.error('Error creating notification log:', error);
      throw error;
    }
  }

  /**
   * Find log by ID
   */
  static async findById(id) {
    try {
      const query = `
        SELECT nl.*, un.title_en, un.title_ar, un.notification_type
        FROM notification_logs nl
        LEFT JOIN user_notifications un ON nl.notification_id = un.id
        WHERE nl.id = ?
      `;
      const results = await executeQuery(query, [id]);
      
      if (results.length === 0) {
        return null;
      }
      
      return new NotificationLog(results[0]);
    } catch (error) {
      logger.error('Error finding notification log by ID:', error);
      throw error;
    }
  }

  /**
   * Find logs by notification ID
   */
  static async findByNotificationId(notificationId) {
    try {
      const query = `
        SELECT nl.*, un.title_en, un.title_ar, un.notification_type
        FROM notification_logs nl
        LEFT JOIN user_notifications un ON nl.notification_id = un.id
        WHERE nl.notification_id = ?
        ORDER BY nl.created_at DESC
      `;
      const results = await executeQuery(query, [notificationId]);
      
      return results.map(log => new NotificationLog(log));
    } catch (error) {
      logger.error('Error finding notification logs by notification ID:', error);
      throw error;
    }
  }

  /**
   * Find logs by user ID
   */
  static async findByUserId(userId, filters = {}) {
    try {
      let query = `
        SELECT nl.*, un.title_en, un.title_ar, un.notification_type
        FROM notification_logs nl
        LEFT JOIN user_notifications un ON nl.notification_id = un.id
        WHERE nl.user_id = ?
      `;
      const params = [userId];

      if (filters.delivery_method) {
        query += ' AND nl.delivery_method = ?';
        params.push(filters.delivery_method);
      }

      if (filters.status) {
        query += ' AND nl.status = ?';
        params.push(filters.status);
      }

      if (filters.notification_type) {
        query += ' AND un.notification_type = ?';
        params.push(filters.notification_type);
      }

      query += ' ORDER BY nl.created_at DESC';

      if (filters.limit) {
        query += ' LIMIT ?';
        params.push(filters.limit);
      }

      if (filters.offset) {
        query += ' OFFSET ?';
        params.push(filters.offset);
      }

      const results = await executeQuery(query, params);
      return results.map(log => new NotificationLog(log));
    } catch (error) {
      logger.error('Error finding notification logs by user ID:', error);
      throw error;
    }
  }

  /**
   * Update log status
   */
  async updateStatus(status, additionalData = {}) {
    try {
      const updates = [];
      const params = [];

      updates.push('status = ?');
      params.push(status);

      if (status === 'sent' && !this.sent_at) {
        updates.push('sent_at = NOW()');
      }

      if (status === 'delivered' && !this.delivered_at) {
        updates.push('delivered_at = NOW()');
      }

      if (additionalData.error_message) {
        updates.push('error_message = ?');
        params.push(additionalData.error_message);
      }

      if (updates.length === 0) {
        return this;
      }

      params.push(this.id);

      const query = `
        UPDATE notification_logs 
        SET ${updates.join(', ')}
        WHERE id = ?
      `;

      await executeQuery(query, params);
      
      // Update local object
      this.status = status;
      if (status === 'sent' && !this.sent_at) {
        this.sent_at = new Date();
      }
      if (status === 'delivered' && !this.delivered_at) {
        this.delivered_at = new Date();
      }
      if (additionalData.error_message) {
        this.error_message = additionalData.error_message;
      }
      
      logger.info(`Notification log status updated: ${this.id} -> ${status}`);
      return this;
    } catch (error) {
      logger.error('Error updating notification log status:', error);
      throw error;
    }
  }

  /**
   * Mark as sent
   */
  async markAsSent() {
    return await this.updateStatus('sent');
  }

  /**
   * Mark as delivered
   */
  async markAsDelivered() {
    return await this.updateStatus('delivered');
  }

  /**
   * Mark as failed
   */
  async markAsFailed(errorMessage) {
    return await this.updateStatus('failed', { error_message: errorMessage });
  }

  /**
   * Delete log
   */
  async delete() {
    try {
      const query = 'DELETE FROM notification_logs WHERE id = ?';
      await executeQuery(query, [this.id]);
      
      logger.info(`Notification log deleted: ${this.id}`);
      return true;
    } catch (error) {
      logger.error('Error deleting notification log:', error);
      throw error;
    }
  }

  /**
   * Get delivery statistics
   */
  static async getDeliveryStatistics(filters = {}) {
    try {
      let query = `
        SELECT 
          nl.delivery_method,
          nl.status,
          COUNT(*) as count,
          COUNT(CASE WHEN nl.status = 'delivered' THEN 1 END) as delivered_count,
          COUNT(CASE WHEN nl.status = 'failed' THEN 1 END) as failed_count,
          COUNT(CASE WHEN nl.status = 'pending' THEN 1 END) as pending_count
        FROM notification_logs nl
        LEFT JOIN user_notifications un ON nl.notification_id = un.id
        WHERE 1=1
      `;
      const params = [];

      if (filters.delivery_method) {
        query += ' AND nl.delivery_method = ?';
        params.push(filters.delivery_method);
      }

      if (filters.notification_type) {
        query += ' AND un.notification_type = ?';
        params.push(filters.notification_type);
      }

      if (filters.date_from) {
        query += ' AND nl.created_at >= ?';
        params.push(filters.date_from);
      }

      if (filters.date_to) {
        query += ' AND nl.created_at <= ?';
        params.push(filters.date_to);
      }

      query += ' GROUP BY nl.delivery_method, nl.status ORDER BY nl.delivery_method, nl.status';

      const results = await executeQuery(query, params);
      return results;
    } catch (error) {
      logger.error('Error getting delivery statistics:', error);
      throw error;
    }
  }

  /**
   * Get delivery success rate
   */
  static async getDeliverySuccessRate(filters = {}) {
    try {
      let query = `
        SELECT 
          nl.delivery_method,
          COUNT(*) as total_count,
          COUNT(CASE WHEN nl.status = 'delivered' THEN 1 END) as delivered_count,
          ROUND((COUNT(CASE WHEN nl.status = 'delivered' THEN 1 END) / COUNT(*)) * 100, 2) as success_rate
        FROM notification_logs nl
        LEFT JOIN user_notifications un ON nl.notification_id = un.id
        WHERE 1=1
      `;
      const params = [];

      if (filters.delivery_method) {
        query += ' AND nl.delivery_method = ?';
        params.push(filters.delivery_method);
      }

      if (filters.notification_type) {
        query += ' AND un.notification_type = ?';
        params.push(filters.notification_type);
      }

      if (filters.date_from) {
        query += ' AND nl.created_at >= ?';
        params.push(filters.date_from);
      }

      if (filters.date_to) {
        query += ' AND nl.created_at <= ?';
        params.push(filters.date_to);
      }

      query += ' GROUP BY nl.delivery_method ORDER BY nl.delivery_method';

      const results = await executeQuery(query, params);
      return results;
    } catch (error) {
      logger.error('Error getting delivery success rate:', error);
      throw error;
    }
  }

  /**
   * Get failed deliveries
   */
  static async getFailedDeliveries(filters = {}) {
    try {
      let query = `
        SELECT nl.*, un.title_en, un.title_ar, un.notification_type
        FROM notification_logs nl
        LEFT JOIN user_notifications un ON nl.notification_id = un.id
        WHERE nl.status = 'failed'
      `;
      const params = [];

      if (filters.delivery_method) {
        query += ' AND nl.delivery_method = ?';
        params.push(filters.delivery_method);
      }

      if (filters.notification_type) {
        query += ' AND un.notification_type = ?';
        params.push(filters.notification_type);
      }

      if (filters.date_from) {
        query += ' AND nl.created_at >= ?';
        params.push(filters.date_from);
      }

      if (filters.date_to) {
        query += ' AND nl.created_at <= ?';
        params.push(filters.date_to);
      }

      query += ' ORDER BY nl.created_at DESC';

      if (filters.limit) {
        query += ' LIMIT ?';
        params.push(filters.limit);
      }

      const results = await executeQuery(query, params);
      return results.map(log => new NotificationLog(log));
    } catch (error) {
      logger.error('Error getting failed deliveries:', error);
      throw error;
    }
  }

  /**
   * Clean up old logs
   */
  static async cleanupOldLogs(daysOld = 90) {
    try {
      const query = `
        DELETE FROM notification_logs 
        WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)
        AND status IN ('delivered', 'failed')
      `;
      
      const result = await executeQuery(query, [daysOld]);
      logger.info(`Cleaned up ${result.affectedRows} old notification logs`);
      
      return result.affectedRows;
    } catch (error) {
      logger.error('Error cleaning up old notification logs:', error);
      throw error;
    }
  }

  /**
   * Get logs by delivery method
   */
  static async findByDeliveryMethod(deliveryMethod, filters = {}) {
    try {
      let query = `
        SELECT nl.*, un.title_en, un.title_ar, un.notification_type
        FROM notification_logs nl
        LEFT JOIN user_notifications un ON nl.notification_id = un.id
        WHERE nl.delivery_method = ?
      `;
      const params = [deliveryMethod];

      if (filters.status) {
        query += ' AND nl.status = ?';
        params.push(filters.status);
      }

      if (filters.notification_type) {
        query += ' AND un.notification_type = ?';
        params.push(filters.notification_type);
      }

      query += ' ORDER BY nl.created_at DESC';

      if (filters.limit) {
        query += ' LIMIT ?';
        params.push(filters.limit);
      }

      const results = await executeQuery(query, params);
      return results.map(log => new NotificationLog(log));
    } catch (error) {
      logger.error('Error finding notification logs by delivery method:', error);
      throw error;
    }
  }

  /**
   * Get logs by status
   */
  static async findByStatus(status, filters = {}) {
    try {
      let query = `
        SELECT nl.*, un.title_en, un.title_ar, un.notification_type
        FROM notification_logs nl
        LEFT JOIN user_notifications un ON nl.notification_id = un.id
        WHERE nl.status = ?
      `;
      const params = [status];

      if (filters.delivery_method) {
        query += ' AND nl.delivery_method = ?';
        params.push(filters.delivery_method);
      }

      if (filters.notification_type) {
        query += ' AND un.notification_type = ?';
        params.push(filters.notification_type);
      }

      query += ' ORDER BY nl.created_at DESC';

      if (filters.limit) {
        query += ' LIMIT ?';
        params.push(filters.limit);
      }

      const results = await executeQuery(query, params);
      return results.map(log => new NotificationLog(log));
    } catch (error) {
      logger.error('Error finding notification logs by status:', error);
      throw error;
    }
  }

  /**
   * Get log count by user
   */
  static async getCountByUserId(userId, filters = {}) {
    try {
      let query = 'SELECT COUNT(*) as count FROM notification_logs WHERE user_id = ?';
      const params = [userId];

      if (filters.delivery_method) {
        query += ' AND delivery_method = ?';
        params.push(filters.delivery_method);
      }

      if (filters.status) {
        query += ' AND status = ?';
        params.push(filters.status);
      }

      const results = await executeQuery(query, params);
      return results[0].count;
    } catch (error) {
      logger.error('Error getting notification log count:', error);
      throw error;
    }
  }

  /**
   * Validate log data
   */
  static validate(logData) {
    const errors = [];

    if (!logData.notification_id) {
      errors.push('Notification ID is required');
    }

    if (!logData.user_id) {
      errors.push('User ID is required');
    }

    if (!logData.delivery_method) {
      errors.push('Delivery method is required');
    }

    const validDeliveryMethods = ['email', 'sms', 'push', 'in_app'];
    if (logData.delivery_method && !validDeliveryMethods.includes(logData.delivery_method)) {
      errors.push(`Invalid delivery method. Must be one of: ${validDeliveryMethods.join(', ')}`);
    }

    const validStatuses = ['pending', 'sent', 'delivered', 'failed'];
    if (logData.status && !validStatuses.includes(logData.status)) {
      errors.push(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    return errors;
  }

  /**
   * Get delivery time statistics
   */
  static async getDeliveryTimeStatistics(filters = {}) {
    try {
      let query = `
        SELECT 
          nl.delivery_method,
          AVG(TIMESTAMPDIFF(SECOND, nl.created_at, nl.sent_at)) as avg_send_time_seconds,
          AVG(TIMESTAMPDIFF(SECOND, nl.sent_at, nl.delivered_at)) as avg_delivery_time_seconds,
          AVG(TIMESTAMPDIFF(SECOND, nl.created_at, nl.delivered_at)) as avg_total_time_seconds
        FROM notification_logs nl
        LEFT JOIN user_notifications un ON nl.notification_id = un.id
        WHERE nl.sent_at IS NOT NULL AND nl.delivered_at IS NOT NULL
      `;
      const params = [];

      if (filters.delivery_method) {
        query += ' AND nl.delivery_method = ?';
        params.push(filters.delivery_method);
      }

      if (filters.notification_type) {
        query += ' AND un.notification_type = ?';
        params.push(filters.notification_type);
      }

      if (filters.date_from) {
        query += ' AND nl.created_at >= ?';
        params.push(filters.date_from);
      }

      if (filters.date_to) {
        query += ' AND nl.created_at <= ?';
        params.push(filters.date_to);
      }

      query += ' GROUP BY nl.delivery_method ORDER BY nl.delivery_method';

      const results = await executeQuery(query, params);
      return results;
    } catch (error) {
      logger.error('Error getting delivery time statistics:', error);
      throw error;
    }
  }
}

module.exports = NotificationLog; 