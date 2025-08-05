const { executeQuery } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

class FCMToken {
  constructor(data = {}) {
    this.id = data.id || uuidv4();
    this.user_id = data.user_id;
    this.token = data.token;
    this.device_type = data.device_type;
    this.device_id = data.device_id;
    this.app_version = data.app_version;
    this.is_active = data.is_active !== undefined ? data.is_active : true;
    this.last_used_at = data.last_used_at;
    this.created_at = data.created_at;
  }

  /**
   * Create a new FCM token
   */
  static async create(tokenData) {
    try {
      const token = new FCMToken(tokenData);
      
      const query = `
        INSERT INTO fcm_tokens (
          id, user_id, token, device_type, device_id, app_version, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      
      const params = [
        token.id,
        token.user_id,
        token.token,
        token.device_type,
        token.device_id,
        token.app_version,
        token.is_active
      ];

      await executeQuery(query, params);
      logger.info(`FCM token created for user: ${token.user_id}, device: ${token.device_type}`);
      
      return token;
    } catch (error) {
      logger.error('Error creating FCM token:', error);
      throw error;
    }
  }

  /**
   * Find token by ID
   */
  static async findById(id) {
    try {
      const query = 'SELECT * FROM fcm_tokens WHERE id = ?';
      const results = await executeQuery(query, [id]);
      
      if (results.length === 0) {
        return null;
      }
      
      return new FCMToken(results[0]);
    } catch (error) {
      logger.error('Error finding FCM token by ID:', error);
      throw error;
    }
  }

  /**
   * Find token by token string
   */
  static async findByToken(tokenString) {
    try {
      const query = 'SELECT * FROM fcm_tokens WHERE token = ?';
      const results = await executeQuery(query, [tokenString]);
      
      if (results.length === 0) {
        return null;
      }
      
      return new FCMToken(results[0]);
    } catch (error) {
      logger.error('Error finding FCM token by token:', error);
      throw error;
    }
  }

  /**
   * Find tokens by user ID
   */
  static async findByUserId(userId, filters = {}) {
    try {
      let query = 'SELECT * FROM fcm_tokens WHERE user_id = ?';
      const params = [userId];

      if (filters.device_type) {
        query += ' AND device_type = ?';
        params.push(filters.device_type);
      }

      if (filters.is_active !== undefined) {
        query += ' AND is_active = ?';
        params.push(filters.is_active);
      }

      query += ' ORDER BY last_used_at DESC';

      if (filters.limit) {
        query += ' LIMIT ?';
        params.push(filters.limit);
      }

      const results = await executeQuery(query, params);
      return results.map(token => new FCMToken(token));
    } catch (error) {
      logger.error('Error finding FCM tokens by user ID:', error);
      throw error;
    }
  }

  /**
   * Find active tokens by user ID
   */
  static async findActiveByUserId(userId) {
    try {
      return await FCMToken.findByUserId(userId, { is_active: true });
    } catch (error) {
      logger.error('Error finding active FCM tokens:', error);
      throw error;
    }
  }

  /**
   * Update token
   */
  async update(updateData) {
    try {
      const allowedFields = [
        'device_type', 'device_id', 'app_version', 'is_active'
      ];

      const updates = [];
      const params = [];

      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          updates.push(`${field} = ?`);
          params.push(updateData[field]);
        }
      }

      if (updates.length === 0) {
        return this;
      }

      updates.push('last_used_at = NOW()');
      params.push(this.id);

      const query = `
        UPDATE fcm_tokens 
        SET ${updates.join(', ')}
        WHERE id = ?
      `;

      await executeQuery(query, params);
      
      // Update local object
      Object.assign(this, updateData);
      this.last_used_at = new Date();
      
      logger.info(`FCM token updated: ${this.id}`);
      return this;
    } catch (error) {
      logger.error('Error updating FCM token:', error);
      throw error;
    }
  }

  /**
   * Update last used timestamp
   */
  async updateLastUsed() {
    try {
      const query = 'UPDATE fcm_tokens SET last_used_at = NOW() WHERE id = ?';
      await executeQuery(query, [this.id]);
      
      this.last_used_at = new Date();
      return this;
    } catch (error) {
      logger.error('Error updating FCM token last used:', error);
      throw error;
    }
  }

  /**
   * Deactivate token
   */
  async deactivate() {
    try {
      const query = 'UPDATE fcm_tokens SET is_active = false WHERE id = ?';
      await executeQuery(query, [this.id]);
      
      this.is_active = false;
      logger.info(`FCM token deactivated: ${this.id}`);
      return this;
    } catch (error) {
      logger.error('Error deactivating FCM token:', error);
      throw error;
    }
  }

  /**
   * Activate token
   */
  async activate() {
    try {
      const query = 'UPDATE fcm_tokens SET is_active = true WHERE id = ?';
      await executeQuery(query, [this.id]);
      
      this.is_active = true;
      logger.info(`FCM token activated: ${this.id}`);
      return this;
    } catch (error) {
      logger.error('Error activating FCM token:', error);
      throw error;
    }
  }

  /**
   * Delete token
   */
  async delete() {
    try {
      const query = 'DELETE FROM fcm_tokens WHERE id = ?';
      await executeQuery(query, [this.id]);
      
      logger.info(`FCM token deleted: ${this.id}`);
      return true;
    } catch (error) {
      logger.error('Error deleting FCM token:', error);
      throw error;
    }
  }

  /**
   * Register or update token for user
   */
  static async registerToken(userId, tokenData) {
    try {
      // Check if token already exists
      let existingToken = await FCMToken.findByToken(tokenData.token);
      
      if (existingToken) {
        // Update existing token
        await existingToken.update({
          user_id: userId,
          device_type: tokenData.device_type,
          device_id: tokenData.device_id,
          app_version: tokenData.app_version,
          is_active: true
        });
        return existingToken;
      } else {
        // Create new token
        return await FCMToken.create({
          user_id: userId,
          ...tokenData
        });
      }
    } catch (error) {
      logger.error('Error registering FCM token:', error);
      throw error;
    }
  }

  /**
   * Deactivate all tokens for user
   */
  static async deactivateAllForUser(userId) {
    try {
      const query = 'UPDATE fcm_tokens SET is_active = false WHERE user_id = ?';
      const result = await executeQuery(query, [userId]);
      
      logger.info(`Deactivated ${result.affectedRows} FCM tokens for user: ${userId}`);
      return result.affectedRows;
    } catch (error) {
      logger.error('Error deactivating FCM tokens for user:', error);
      throw error;
    }
  }

  /**
   * Delete old inactive tokens
   */
  static async cleanupOldTokens(daysOld = 30) {
    try {
      const query = `
        DELETE FROM fcm_tokens 
        WHERE last_used_at < DATE_SUB(NOW(), INTERVAL ? DAY)
        AND is_active = false
      `;
      
      const result = await executeQuery(query, [daysOld]);
      logger.info(`Cleaned up ${result.affectedRows} old FCM tokens`);
      
      return result.affectedRows;
    } catch (error) {
      logger.error('Error cleaning up old FCM tokens:', error);
      throw error;
    }
  }

  /**
   * Get token statistics
   */
  static async getStatistics() {
    try {
      const query = `
        SELECT 
          device_type,
          COUNT(*) as total_count,
          SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_count,
          SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as inactive_count
        FROM fcm_tokens 
        GROUP BY device_type
        ORDER BY device_type
      `;
      
      const results = await executeQuery(query);
      return results;
    } catch (error) {
      logger.error('Error getting FCM token statistics:', error);
      throw error;
    }
  }

  /**
   * Get tokens by device type
   */
  static async findByDeviceType(deviceType, filters = {}) {
    try {
      let query = 'SELECT * FROM fcm_tokens WHERE device_type = ?';
      const params = [deviceType];

      if (filters.is_active !== undefined) {
        query += ' AND is_active = ?';
        params.push(filters.is_active);
      }

      query += ' ORDER BY last_used_at DESC';

      if (filters.limit) {
        query += ' LIMIT ?';
        params.push(filters.limit);
      }

      const results = await executeQuery(query, params);
      return results.map(token => new FCMToken(token));
    } catch (error) {
      logger.error('Error finding FCM tokens by device type:', error);
      throw error;
    }
  }

  /**
   * Get all active tokens
   */
  static async findAllActive(limit = 1000) {
    try {
      const query = `
        SELECT * FROM fcm_tokens 
        WHERE is_active = true 
        ORDER BY last_used_at DESC 
        LIMIT ?
      `;
      
      const results = await executeQuery(query, [limit]);
      return results.map(token => new FCMToken(token));
    } catch (error) {
      logger.error('Error finding all active FCM tokens:', error);
      throw error;
    }
  }

  /**
   * Validate token data
   */
  static validate(tokenData) {
    const errors = [];

    if (!tokenData.user_id) {
      errors.push('User ID is required');
    }

    if (!tokenData.token) {
      errors.push('Token is required');
    }

    if (!tokenData.device_type) {
      errors.push('Device type is required');
    }

    const validDeviceTypes = ['android', 'ios', 'web'];
    if (tokenData.device_type && !validDeviceTypes.includes(tokenData.device_type)) {
      errors.push(`Invalid device type. Must be one of: ${validDeviceTypes.join(', ')}`);
    }

    // Basic FCM token validation (starts with specific patterns)
    if (tokenData.token) {
      const tokenPattern = /^[A-Za-z0-9:_-]+$/;
      if (!tokenPattern.test(tokenData.token)) {
        errors.push('Invalid FCM token format');
      }
    }

    return errors;
  }

  /**
   * Check if token is valid format
   */
  static isValidTokenFormat(token) {
    if (!token || typeof token !== 'string') {
      return false;
    }

    // Basic validation for FCM token format
    const tokenPattern = /^[A-Za-z0-9:_-]+$/;
    return tokenPattern.test(token) && token.length > 100; // FCM tokens are typically long
  }

  /**
   * Get token count by user
   */
  static async getCountByUserId(userId) {
    try {
      const query = 'SELECT COUNT(*) as count FROM fcm_tokens WHERE user_id = ?';
      const results = await executeQuery(query, [userId]);
      return results[0].count;
    } catch (error) {
      logger.error('Error getting FCM token count:', error);
      throw error;
    }
  }

  /**
   * Get active token count by user
   */
  static async getActiveCountByUserId(userId) {
    try {
      const query = 'SELECT COUNT(*) as count FROM fcm_tokens WHERE user_id = ? AND is_active = true';
      const results = await executeQuery(query, [userId]);
      return results[0].count;
    } catch (error) {
      logger.error('Error getting active FCM token count:', error);
      throw error;
    }
  }
}

module.exports = FCMToken; 