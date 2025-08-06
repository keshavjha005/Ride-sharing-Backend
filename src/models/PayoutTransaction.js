const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const logger = require('../utils/logger');

class PayoutTransaction {
  constructor(data = {}) {
    this.id = data.id || uuidv4();
    this.withdrawal_request_id = data.withdrawal_request_id;
    this.gateway = data.gateway;
    this.gateway_payout_id = data.gateway_payout_id;
    this.amount = data.amount;
    this.fee_amount = data.fee_amount || 0.00;
    this.net_amount = data.net_amount;
    this.status = data.status || 'pending';
    this.failure_reason = data.failure_reason;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  /**
   * Create a new payout transaction
   */
  static async create(data) {
    try {
      const payoutTransaction = new PayoutTransaction(data);
      
      const query = `
        INSERT INTO payout_transactions (
          id, withdrawal_request_id, gateway, gateway_payout_id, 
          amount, fee_amount, net_amount, status, failure_reason, 
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `;

      const values = [
        payoutTransaction.id,
        payoutTransaction.withdrawal_request_id,
        payoutTransaction.gateway,
        payoutTransaction.gateway_payout_id,
        payoutTransaction.amount,
        payoutTransaction.fee_amount,
        payoutTransaction.net_amount,
        payoutTransaction.status,
        payoutTransaction.failure_reason
      ];

      await db.query(query, values);

      logger.info(`Payout transaction created: ${payoutTransaction.id} for withdrawal: ${payoutTransaction.withdrawal_request_id}`);
      return payoutTransaction;
    } catch (error) {
      logger.error('Error creating payout transaction:', error);
      throw error;
    }
  }

  /**
   * Find payout transaction by ID
   */
  static async findById(id) {
    try {
      const [rows] = await db.query(
        'SELECT * FROM payout_transactions WHERE id = ?',
        [id]
      );

      if (rows.length === 0) {
        return null;
      }

      return new PayoutTransaction(rows[0]);
    } catch (error) {
      logger.error('Error finding payout transaction by ID:', error);
      throw error;
    }
  }

  /**
   * Find payout transactions by withdrawal request ID
   */
  static async findByWithdrawalRequestId(withdrawalRequestId) {
    try {
      const [rows] = await db.query(
        'SELECT * FROM payout_transactions WHERE withdrawal_request_id = ? ORDER BY created_at DESC',
        [withdrawalRequestId]
      );

      return rows.map(row => new PayoutTransaction(row));
    } catch (error) {
      logger.error('Error finding payout transactions by withdrawal request ID:', error);
      throw error;
    }
  }

  /**
   * Find all payout transactions (admin)
   */
  static async findAll(options = {}) {
    try {
      const { page = 1, limit = 20, status, gateway, startDate, endDate } = options;
      const offset = (page - 1) * limit;

      let query = 'SELECT * FROM payout_transactions WHERE 1=1';
      const values = [];

      if (status) {
        query += ' AND status = ?';
        values.push(status);
      }

      if (gateway) {
        query += ' AND gateway = ?';
        values.push(gateway);
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

      const payoutTransactions = rows.map(row => new PayoutTransaction(row));

      // Get total count for pagination
      let countQuery = 'SELECT COUNT(*) as total FROM payout_transactions WHERE 1=1';
      const countValues = [];

      if (status) {
        countQuery += ' AND status = ?';
        countValues.push(status);
      }

      if (gateway) {
        countQuery += ' AND gateway = ?';
        countValues.push(gateway);
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
        payoutTransactions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error finding all payout transactions:', error);
      throw error;
    }
  }

  /**
   * Update payout transaction status
   */
  async updateStatus(status, failureReason = null) {
    try {
      const query = `
        UPDATE payout_transactions 
        SET status = ?, failure_reason = ?, updated_at = NOW()
        WHERE id = ?
      `;

      await db.query(query, [status, failureReason, this.id]);

      this.status = status;
      if (failureReason) {
        this.failure_reason = failureReason;
      }
      this.updated_at = new Date();

      logger.info(`Payout transaction status updated: ${this.id} to ${status}`);
      return this;
    } catch (error) {
      logger.error('Error updating payout transaction status:', error);
      throw error;
    }
  }

  /**
   * Update gateway payout ID
   */
  async updateGatewayPayoutId(gatewayPayoutId) {
    try {
      const query = `
        UPDATE payout_transactions 
        SET gateway_payout_id = ?, updated_at = NOW()
        WHERE id = ?
      `;

      await db.query(query, [gatewayPayoutId, this.id]);

      this.gateway_payout_id = gatewayPayoutId;
      this.updated_at = new Date();

      logger.info(`Payout transaction gateway ID updated: ${this.id} to ${gatewayPayoutId}`);
      return this;
    } catch (error) {
      logger.error('Error updating payout transaction gateway ID:', error);
      throw error;
    }
  }

  /**
   * Get payout statistics
   */
  static async getStatistics(period = 30) {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_payouts,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_payouts,
          SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing_payouts,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_payouts,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_payouts,
          SUM(amount) as total_amount,
          SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as completed_amount,
          SUM(fee_amount) as total_fees,
          AVG(amount) as average_amount
        FROM payout_transactions 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      `;

      const [rows] = await db.query(query, [period]);

      return rows[0];
    } catch (error) {
      logger.error('Error getting payout statistics:', error);
      throw error;
    }
  }

  /**
   * Get payout statistics by gateway
   */
  static async getStatisticsByGateway(period = 30) {
    try {
      const query = `
        SELECT 
          gateway,
          COUNT(*) as total_payouts,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_payouts,
          SUM(amount) as total_amount,
          SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as completed_amount,
          SUM(fee_amount) as total_fees,
          AVG(amount) as average_amount
        FROM payout_transactions 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        GROUP BY gateway
      `;

      const [rows] = await db.query(query, [period]);
      return rows;
    } catch (error) {
      logger.error('Error getting payout statistics by gateway:', error);
      throw error;
    }
  }

  /**
   * Get failed payouts
   */
  static async getFailedPayouts(limit = 50) {
    try {
      const [rows] = await db.query(
        'SELECT * FROM payout_transactions WHERE status = "failed" ORDER BY created_at DESC LIMIT ?',
        [limit]
      );

      return rows.map(row => new PayoutTransaction(row));
    } catch (error) {
      logger.error('Error getting failed payouts:', error);
      throw error;
    }
  }

  /**
   * Get pending payouts
   */
  static async getPendingPayouts(limit = 50) {
    try {
      const [rows] = await db.query(
        'SELECT * FROM payout_transactions WHERE status IN ("pending", "processing") ORDER BY created_at ASC LIMIT ?',
        [limit]
      );

      return rows.map(row => new PayoutTransaction(row));
    } catch (error) {
      logger.error('Error getting pending payouts:', error);
      throw error;
    }
  }

  /**
   * Convert to JSON
   */
  toJSON() {
    return {
      id: this.id,
      withdrawal_request_id: this.withdrawal_request_id,
      gateway: this.gateway,
      gateway_payout_id: this.gateway_payout_id,
      amount: this.amount,
      fee_amount: this.fee_amount,
      net_amount: this.net_amount,
      status: this.status,
      failure_reason: this.failure_reason,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

module.exports = PayoutTransaction; 