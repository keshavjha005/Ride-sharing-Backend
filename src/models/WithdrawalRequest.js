const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const logger = require('../utils/logger');

class WithdrawalRequest {
  constructor(data = {}) {
    this.id = data.id || uuidv4();
    this.user_id = data.user_id;
    this.amount = data.amount;
    this.withdrawal_method = data.withdrawal_method;
    this.account_details = data.account_details;
    this.status = data.status || 'pending';
    this.admin_notes = data.admin_notes;
    this.processed_at = data.processed_at;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  /**
   * Create a new withdrawal request
   */
  static async create(data) {
    try {
      const withdrawalRequest = new WithdrawalRequest(data);
      
      const query = `
        INSERT INTO withdrawal_requests (
          id, user_id, amount, withdrawal_method, account_details, 
          status, admin_notes, processed_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `;

      const values = [
        withdrawalRequest.id,
        withdrawalRequest.user_id,
        withdrawalRequest.amount,
        withdrawalRequest.withdrawal_method,
        JSON.stringify(withdrawalRequest.account_details),
        withdrawalRequest.status,
        withdrawalRequest.admin_notes,
        withdrawalRequest.processed_at
      ];

      await db.query(query, values);

      logger.info(`Withdrawal request created: ${withdrawalRequest.id} for user: ${withdrawalRequest.user_id}`);
      return withdrawalRequest;
    } catch (error) {
      logger.error('Error creating withdrawal request:', error);
      throw error;
    }
  }

  /**
   * Find withdrawal request by ID
   */
  static async findById(id) {
    try {
      const [rows] = await db.query(
        'SELECT * FROM withdrawal_requests WHERE id = ?',
        [id]
      );

      if (rows.length === 0) {
        return null;
      }

      const data = rows[0];
      if (data.account_details) {
        data.account_details = JSON.parse(data.account_details);
      }

      return new WithdrawalRequest(data);
    } catch (error) {
      logger.error('Error finding withdrawal request by ID:', error);
      throw error;
    }
  }

  /**
   * Find withdrawal requests by user ID
   */
  static async findByUserId(userId, options = {}) {
    try {
      const { page = 1, limit = 20, status, withdrawal_method } = options;
      const offset = (page - 1) * limit;

      let query = 'SELECT * FROM withdrawal_requests WHERE user_id = ?';
      const values = [userId];

      if (status) {
        query += ' AND status = ?';
        values.push(status);
      }

      if (withdrawal_method) {
        query += ' AND withdrawal_method = ?';
        values.push(withdrawal_method);
      }

      query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      values.push(limit, offset);

      const [rows] = await db.query(query, values);

      // Parse JSON fields
      const withdrawalRequests = rows.map(row => {
        if (row.account_details) {
          row.account_details = JSON.parse(row.account_details);
        }
        return new WithdrawalRequest(row);
      });

      // Get total count for pagination
      let countQuery = 'SELECT COUNT(*) as total FROM withdrawal_requests WHERE user_id = ?';
      const countValues = [userId];

      if (status) {
        countQuery += ' AND status = ?';
        countValues.push(status);
      }

      if (withdrawal_method) {
        countQuery += ' AND withdrawal_method = ?';
        countValues.push(withdrawal_method);
      }

      const [countRows] = await db.query(countQuery, countValues);
      const total = countRows[0].total;

      return {
        withdrawalRequests,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error finding withdrawal requests by user ID:', error);
      throw error;
    }
  }

  /**
   * Find all withdrawal requests (admin)
   */
  static async findAll(options = {}) {
    try {
      const { page = 1, limit = 20, status, withdrawal_method, startDate, endDate } = options;
      const offset = (page - 1) * limit;

      let query = 'SELECT * FROM withdrawal_requests WHERE 1=1';
      const values = [];

      if (status) {
        query += ' AND status = ?';
        values.push(status);
      }

      if (withdrawal_method) {
        query += ' AND withdrawal_method = ?';
        values.push(withdrawal_method);
      }

      if (startDate) {
        query += ' AND created_at >= ?';
        values.push(startDate);
      }

      if (endDate) {
        query += ' AND created_at <= ?';
        values.push(endDate);
      }

      query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      values.push(limit, offset);

      const [rows] = await db.query(query, values);

      // Parse JSON fields
      const withdrawalRequests = rows.map(row => {
        if (row.account_details) {
          row.account_details = JSON.parse(row.account_details);
        }
        return new WithdrawalRequest(row);
      });

      // Get total count for pagination
      let countQuery = 'SELECT COUNT(*) as total FROM withdrawal_requests WHERE 1=1';
      const countValues = [];

      if (status) {
        countQuery += ' AND status = ?';
        countValues.push(status);
      }

      if (withdrawal_method) {
        countQuery += ' AND withdrawal_method = ?';
        countValues.push(withdrawal_method);
      }

      if (startDate) {
        countQuery += ' AND created_at >= ?';
        countValues.push(startDate);
      }

      if (endDate) {
        countQuery += ' AND created_at <= ?';
        countValues.push(endDate);
      }

      const [countRows] = await db.query(countQuery, countValues);
      const total = countRows[0].total;

      return {
        withdrawalRequests,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error finding all withdrawal requests:', error);
      throw error;
    }
  }

  /**
   * Update withdrawal request status
   */
  async updateStatus(status, adminNotes = null) {
    try {
      const query = `
        UPDATE withdrawal_requests 
        SET status = ?, admin_notes = ?, updated_at = NOW()
        WHERE id = ?
      `;

      await db.query(query, [status, adminNotes, this.id]);

      this.status = status;
      if (adminNotes) {
        this.admin_notes = adminNotes;
      }
      this.updated_at = new Date();

      logger.info(`Withdrawal request status updated: ${this.id} to ${status}`);
      return this;
    } catch (error) {
      logger.error('Error updating withdrawal request status:', error);
      throw error;
    }
  }

  /**
   * Mark withdrawal request as processed
   */
  async markAsProcessed() {
    try {
      const query = `
        UPDATE withdrawal_requests 
        SET status = 'completed', processed_at = NOW(), updated_at = NOW()
        WHERE id = ?
      `;

      await db.query(query, [this.id]);

      this.status = 'completed';
      this.processed_at = new Date();
      this.updated_at = new Date();

      logger.info(`Withdrawal request marked as processed: ${this.id}`);
      return this;
    } catch (error) {
      logger.error('Error marking withdrawal request as processed:', error);
      throw error;
    }
  }

  /**
   * Get withdrawal statistics
   */
  static async getStatistics(period = 30) {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_requests,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_requests,
          SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_requests,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_requests,
          SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_requests,
          SUM(amount) as total_amount,
          SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as completed_amount,
          AVG(amount) as average_amount
        FROM withdrawal_requests 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      `;

      const [rows] = await db.query(query, [period]);

      return rows[0];
    } catch (error) {
      logger.error('Error getting withdrawal statistics:', error);
      throw error;
    }
  }

  /**
   * Get withdrawal statistics by method
   */
  static async getStatisticsByMethod(period = 30) {
    try {
      const query = `
        SELECT 
          withdrawal_method,
          COUNT(*) as total_requests,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_requests,
          SUM(amount) as total_amount,
          SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as completed_amount,
          AVG(amount) as average_amount
        FROM withdrawal_requests 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        GROUP BY withdrawal_method
      `;

      const [rows] = await db.query(query, [period]);
      return rows;
    } catch (error) {
      logger.error('Error getting withdrawal statistics by method:', error);
      throw error;
    }
  }

  /**
   * Check if user has pending withdrawal requests
   */
  static async hasPendingRequests(userId) {
    try {
      const [rows] = await db.query(
        'SELECT COUNT(*) as count FROM withdrawal_requests WHERE user_id = ? AND status IN ("pending", "approved", "processing")',
        [userId]
      );

      return rows[0].count > 0;
    } catch (error) {
      logger.error('Error checking pending withdrawal requests:', error);
      throw error;
    }
  }

  /**
   * Get total pending amount for user
   */
  static async getPendingAmount(userId) {
    try {
      const [rows] = await db.query(
        'SELECT SUM(amount) as total FROM withdrawal_requests WHERE user_id = ? AND status IN ("pending", "approved", "processing")',
        [userId]
      );

      return rows[0].total || 0;
    } catch (error) {
      logger.error('Error getting pending withdrawal amount:', error);
      throw error;
    }
  }

  /**
   * Convert to JSON
   */
  toJSON() {
    return {
      id: this.id,
      user_id: this.user_id,
      amount: this.amount,
      withdrawal_method: this.withdrawal_method,
      account_details: this.account_details,
      status: this.status,
      admin_notes: this.admin_notes,
      processed_at: this.processed_at,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

module.exports = WithdrawalRequest; 