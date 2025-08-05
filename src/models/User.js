const { v4: uuidv4 } = require('uuid');
const { executeQuery } = require('../config/database');
const logger = require('../utils/logger');

class User {
  // Create a new user
  static async create(userData) {
    const id = uuidv4();
    
    // Extract values with explicit null handling
    const email = userData.email || null;
    const phone = userData.phone || null;
    const password_hash = userData.password_hash || null;
    const first_name = userData.first_name || null;
    const last_name = userData.last_name || null;
    const profile_image_url = userData.profile_image_url || null;
    const date_of_birth = userData.date_of_birth || null;
    const gender = userData.gender || null;
    const language_code = userData.language_code || 'en';
    const currency_code = userData.currency_code || 'USD';

    const query = `
      INSERT INTO users (
        id, email, phone, password_hash, first_name, last_name,
        profile_image_url, date_of_birth, gender, language_code, currency_code
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    // Create params array with explicit null values for undefined
    const params = [
      id,
      email || null,
      phone || null,
      password_hash || null,
      first_name || null,
      last_name || null,
      profile_image_url || null,
      date_of_birth || null,
      gender || null,
      language_code || 'en',
      currency_code || 'USD'
    ];

    try {
      await executeQuery(query, params);
      
      logger.business('user_created', { userId: id, email });
      
      return this.findById(id);
    } catch (error) {
      logger.error('Failed to create user', {
        error: error.message,
        email,
      });
      throw error;
    }
  }

  // Find user by ID
  static async findById(id) {
    const query = 'SELECT * FROM users WHERE id = ? AND is_deleted IS NULL';
    
    try {
      const users = await executeQuery(query, [id]);
      return users[0] || null;
    } catch (error) {
      logger.error('Failed to find user by ID', {
        error: error.message,
        userId: id,
      });
      throw error;
    }
  }

  // Find user by email
  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = ? AND is_deleted IS NULL';
    
    try {
      const users = await executeQuery(query, [email]);
      return users[0] || null;
    } catch (error) {
      logger.error('Failed to find user by email', {
        error: error.message,
        email,
      });
      throw error;
    }
  }

  // Find user by phone
  static async findByPhone(phone) {
    const query = 'SELECT * FROM users WHERE phone = ? AND is_deleted IS NULL';
    
    try {
      const users = await executeQuery(query, [phone]);
      return users[0] || null;
    } catch (error) {
      logger.error('Failed to find user by phone', {
        error: error.message,
        phone,
      });
      throw error;
    }
  }

  // Update user
  static async update(id, updateData) {
    const allowedFields = [
      'first_name', 'last_name', 'profile_image_url', 'date_of_birth',
      'gender', 'language_code', 'currency_code', 'fcm_token'
    ];

    const updates = [];
    const params = [];

    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updates.push(`${key} = ?`);
        params.push(value);
      }
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;

    try {
      await executeQuery(query, params);
      
      logger.business('user_updated', { userId: id });
      
      return this.findById(id);
    } catch (error) {
      logger.error('Failed to update user', {
        error: error.message,
        userId: id,
      });
      throw error;
    }
  }

  // Update password
  static async updatePassword(id, passwordHash) {
    const query = `
      UPDATE users 
      SET password_hash = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `;

    try {
      await executeQuery(query, [passwordHash, id]);
      
      logger.business('user_password_updated', { userId: id });
      
      return true;
    } catch (error) {
      logger.error('Failed to update user password', {
        error: error.message,
        userId: id,
      });
      throw error;
    }
  }

  // Update last login
  static async updateLastLogin(id) {
    const query = `
      UPDATE users 
      SET last_login_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `;

    try {
      await executeQuery(query, [id]);
      
      logger.business('user_last_login_updated', { userId: id });
      
      return true;
    } catch (error) {
      logger.error('Failed to update user last login', {
        error: error.message,
        userId: id,
      });
      throw error;
    }
  }

  // Soft delete user
  static async delete(id) {
    const query = `
      UPDATE users 
      SET is_deleted = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `;

    try {
      await executeQuery(query, [id]);
      
      logger.business('user_deleted', { userId: id });
      
      return true;
    } catch (error) {
      logger.error('Failed to delete user', {
        error: error.message,
        userId: id,
      });
      throw error;
    }
  }

  // Activate/Deactivate user
  static async toggleActive(id, isActive) {
    const query = `
      UPDATE users 
      SET is_active = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `;

    try {
      await executeQuery(query, [isActive, id]);
      
      logger.business('user_active_toggled', { 
        userId: id, 
        isActive 
      });
      
      return this.findById(id);
    } catch (error) {
      logger.error('Failed to toggle user active status', {
        error: error.message,
        userId: id,
      });
      throw error;
    }
  }

  // Search users
  static async search(searchTerm, limit = 10, offset = 0) {
    const query = `
      SELECT * FROM users 
      WHERE (first_name LIKE ? OR last_name LIKE ? OR email LIKE ?) 
      AND is_deleted IS NULL
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;

    const searchPattern = `%${searchTerm}%`;
    const params = [searchPattern, searchPattern, searchPattern, limit, offset];

    try {
      const users = await executeQuery(query, params);
      
      logger.business('users_searched', { 
        searchTerm, 
        resultCount: users.length 
      });
      
      return users;
    } catch (error) {
      logger.error('Failed to search users', {
        error: error.message,
        searchTerm,
      });
      throw error;
    }
  }

  // Get user statistics
  static async getStats() {
    const query = `
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_users,
        COUNT(CASE WHEN is_verified = 1 THEN 1 END) as verified_users,
        COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) as new_users_today,
        COUNT(CASE WHEN DATE(created_at) = DATE_SUB(CURDATE(), INTERVAL 7 DAY) THEN 1 END) as new_users_this_week
      FROM users 
      WHERE is_deleted IS NULL
    `;

    try {
      const stats = await executeQuery(query);
      
      logger.business('user_stats_retrieved');
      
      return stats[0];
    } catch (error) {
      logger.error('Failed to get user statistics', {
        error: error.message,
      });
      throw error;
    }
  }

  // Check if email exists
  static async emailExists(email, excludeId = null) {
    let query = 'SELECT COUNT(*) as count FROM users WHERE email = ? AND is_deleted IS NULL';
    let params = [email];

    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }

    try {
      const result = await executeQuery(query, params);
      return result[0].count > 0;
    } catch (error) {
      logger.error('Failed to check email existence', {
        error: error.message,
        email,
      });
      throw error;
    }
  }

  // Check if phone exists
  static async phoneExists(phone, excludeId = null) {
    let query = 'SELECT COUNT(*) as count FROM users WHERE phone = ? AND is_deleted IS NULL';
    let params = [phone];

    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }

    try {
      const result = await executeQuery(query, params);
      return result[0].count > 0;
    } catch (error) {
      logger.error('Failed to check phone existence', {
        error: error.message,
        phone,
      });
      throw error;
    }
  }
}

module.exports = User; 