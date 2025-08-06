const { v4: uuidv4 } = require('uuid');
const mysql = require('mysql2/promise');
const config = require('../config');
const logger = require('../utils/logger');

class WalletRechargeRequest {
  constructor(data = {}) {
    this.id = data.id || uuidv4();
    this.user_id = data.user_id;
    this.amount = data.amount || 0.00;
    this.payment_method = data.payment_method;
    this.payment_gateway = data.payment_gateway;
    this.gateway_transaction_id = data.gateway_transaction_id;
    this.status = data.status || 'pending';
    this.failure_reason = data.failure_reason;
    this.created_at = data.created_at || new Date();
    this.updated_at = data.updated_at || new Date();
  }

  // Create a new recharge request
  static async create(rechargeData) {
    const connection = await mysql.createConnection(config.database);
    
    try {
      const rechargeRequest = new WalletRechargeRequest(rechargeData);

      const query = `
        INSERT INTO wallet_recharge_requests (
          id, user_id, amount, payment_method, payment_gateway, 
          gateway_transaction_id, status, failure_reason, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const values = [
        rechargeRequest.id,
        rechargeRequest.user_id,
        rechargeRequest.amount,
        rechargeRequest.payment_method,
        rechargeRequest.payment_gateway,
        rechargeRequest.gateway_transaction_id,
        rechargeRequest.status,
        rechargeRequest.failure_reason,
        rechargeRequest.created_at,
        rechargeRequest.updated_at
      ];

      await connection.query(query, values);
      
      logger.info(`Wallet recharge request created: ${rechargeRequest.id} for user: ${rechargeRequest.user_id}`);
      return rechargeRequest;
      
    } catch (error) {
      logger.error('Error creating wallet recharge request:', error);
      throw error;
    } finally {
      await connection.end();
    }
  }

  // Get recharge request by ID
  static async getById(requestId) {
    const connection = await mysql.createConnection(config.database);
    
    try {
      const [rows] = await connection.query(
        'SELECT * FROM wallet_recharge_requests WHERE id = ?',
        [requestId]
      );

      if (rows.length === 0) {
        return null;
      }

      return new WalletRechargeRequest(rows[0]);
      
    } catch (error) {
      logger.error('Error getting recharge request by ID:', error);
      throw error;
    } finally {
      await connection.end();
    }
  }

  // Get recharge requests by user ID
  static async getByUserId(userId, options = {}) {
    const connection = await mysql.createConnection(config.database);
    
    try {
      let query = 'SELECT * FROM wallet_recharge_requests WHERE user_id = ?';
      const values = [userId];
      
      // Add filters
      if (options.status) {
        query += ' AND status = ?';
        values.push(options.status);
      }
      
      if (options.payment_method) {
        query += ' AND payment_method = ?';
        values.push(options.payment_method);
      }
      
      if (options.start_date) {
        query += ' AND created_at >= ?';
        values.push(options.start_date);
      }
      
      if (options.end_date) {
        query += ' AND created_at <= ?';
        values.push(options.end_date);
      }
      
      // Add ordering
      query += ' ORDER BY created_at DESC';
      
      // Add pagination
      if (options.limit) {
        query += ' LIMIT ?';
        values.push(parseInt(options.limit));
        
        if (options.offset) {
          query += ' OFFSET ?';
          values.push(parseInt(options.offset));
        }
      }

      const [rows] = await connection.query(query, values);
      
      return rows.map(row => new WalletRechargeRequest(row));
      
    } catch (error) {
      logger.error('Error getting recharge requests by user ID:', error);
      throw error;
    } finally {
      await connection.end();
    }
  }

  // Update recharge request status
  static async updateStatus(requestId, status, failureReason = null) {
    const connection = await mysql.createConnection(config.database);
    
    try {
      const query = `
        UPDATE wallet_recharge_requests 
        SET status = ?, failure_reason = ?, updated_at = ? 
        WHERE id = ?
      `;
      
      const [result] = await connection.query(query, [status, failureReason, new Date(), requestId]);
      
      if (result.affectedRows === 0) {
        throw new Error('Recharge request not found');
      }

      logger.info(`Recharge request status updated: ${requestId} to ${status}`);
      return true;
      
    } catch (error) {
      logger.error('Error updating recharge request status:', error);
      throw error;
    } finally {
      await connection.end();
    }
  }

  // Update gateway transaction ID
  static async updateGatewayTransactionId(requestId, gatewayTransactionId) {
    const connection = await mysql.createConnection(config.database);
    
    try {
      const query = `
        UPDATE wallet_recharge_requests 
        SET gateway_transaction_id = ?, updated_at = ? 
        WHERE id = ?
      `;
      
      const [result] = await connection.query(query, [gatewayTransactionId, new Date(), requestId]);
      
      if (result.affectedRows === 0) {
        throw new Error('Recharge request not found');
      }

      logger.info(`Gateway transaction ID updated: ${requestId}`);
      return true;
      
    } catch (error) {
      logger.error('Error updating gateway transaction ID:', error);
      throw error;
    } finally {
      await connection.end();
    }
  }

  // Get pending recharge requests
  static async getPendingRequests() {
    const connection = await mysql.createConnection(config.database);
    
    try {
      const [rows] = await connection.query(
        'SELECT * FROM wallet_recharge_requests WHERE status = "pending" ORDER BY created_at ASC'
      );

      return rows.map(row => new WalletRechargeRequest(row));
      
    } catch (error) {
      logger.error('Error getting pending recharge requests:', error);
      throw error;
    } finally {
      await connection.end();
    }
  }

  // Get recharge request summary for a user
  static async getSummary(userId, period = '30') {
    const connection = await mysql.createConnection(config.database);
    
    try {
      const query = `
        SELECT 
          COUNT(*) as total_requests,
          SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_completed_amount,
          SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as total_pending_amount,
          SUM(CASE WHEN status = 'failed' THEN amount ELSE 0 END) as total_failed_amount,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_requests,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_requests,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_requests
        FROM wallet_recharge_requests 
        WHERE user_id = ? 
        AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      `;
      
      const [rows] = await connection.query(query, [userId, period]);
      
      return rows[0] || {
        total_requests: 0,
        total_completed_amount: 0,
        total_pending_amount: 0,
        total_failed_amount: 0,
        completed_requests: 0,
        pending_requests: 0,
        failed_requests: 0
      };
      
    } catch (error) {
      logger.error('Error getting recharge request summary:', error);
      throw error;
    } finally {
      await connection.end();
    }
  }

  // Get recharge requests by gateway transaction ID
  static async getByGatewayTransactionId(gatewayTransactionId) {
    const connection = await mysql.createConnection(config.database);
    
    try {
      const [rows] = await connection.query(
        'SELECT * FROM wallet_recharge_requests WHERE gateway_transaction_id = ?',
        [gatewayTransactionId]
      );

      if (rows.length === 0) {
        return null;
      }

      return new WalletRechargeRequest(rows[0]);
      
    } catch (error) {
      logger.error('Error getting recharge request by gateway transaction ID:', error);
      throw error;
    } finally {
      await connection.end();
    }
  }

  // Cancel recharge request
  static async cancel(requestId, reason = 'User cancelled') {
    const connection = await mysql.createConnection(config.database);
    
    try {
      const query = `
        UPDATE wallet_recharge_requests 
        SET status = 'cancelled', failure_reason = ?, updated_at = ? 
        WHERE id = ? AND status = 'pending'
      `;
      
      const [result] = await connection.query(query, [reason, new Date(), requestId]);
      
      if (result.affectedRows === 0) {
        throw new Error('Recharge request not found or cannot be cancelled');
      }

      logger.info(`Recharge request cancelled: ${requestId}`);
      return true;
      
    } catch (error) {
      logger.error('Error cancelling recharge request:', error);
      throw error;
    } finally {
      await connection.end();
    }
  }

  // Process successful recharge
  static async processSuccess(requestId, gatewayTransactionId = null) {
    const connection = await mysql.createConnection(config.database);
    
    try {
      await connection.beginTransaction();
      
      // Get recharge request
      const [requestRows] = await connection.query(
        'SELECT * FROM wallet_recharge_requests WHERE id = ? AND status = "pending"',
        [requestId]
      );
      
      if (requestRows.length === 0) {
        throw new Error('Recharge request not found or already processed');
      }
      
      const rechargeRequest = new WalletRechargeRequest(requestRows[0]);
      
      // Update recharge request status
      await connection.query(
        'UPDATE wallet_recharge_requests SET status = "completed", gateway_transaction_id = ?, updated_at = ? WHERE id = ?',
        [gatewayTransactionId, new Date(), requestId]
      );
      
      // Get or create wallet for user
      let [walletRows] = await connection.query(
        'SELECT * FROM wallets WHERE user_id = ? AND is_active = true',
        [rechargeRequest.user_id]
      );
      
      let wallet;
      if (walletRows.length === 0) {
        // Create new wallet
        const Wallet = require('./Wallet');
        wallet = await Wallet.create(rechargeRequest.user_id, 'USD');
      } else {
        wallet = walletRows[0];
      }
      
      // Process credit transaction
      const WalletTransaction = require('./WalletTransaction');
      await WalletTransaction.processCredit(
        wallet.id,
        rechargeRequest.amount,
        'wallet_recharge',
        requestId,
        'recharge',
        `Wallet recharge via ${rechargeRequest.payment_method}`
      );
      
      await connection.commit();
      
      logger.info(`Recharge request processed successfully: ${requestId}`);
      return rechargeRequest;
      
    } catch (error) {
      await connection.rollback();
      logger.error('Error processing recharge success:', error);
      throw error;
    } finally {
      await connection.end();
    }
  }

  // Process failed recharge
  static async processFailure(requestId, failureReason) {
    const connection = await mysql.createConnection(config.database);
    
    try {
      const query = `
        UPDATE wallet_recharge_requests 
        SET status = 'failed', failure_reason = ?, updated_at = ? 
        WHERE id = ? AND status = 'pending'
      `;
      
      const [result] = await connection.query(query, [failureReason, new Date(), requestId]);
      
      if (result.affectedRows === 0) {
        throw new Error('Recharge request not found or already processed');
      }

      logger.info(`Recharge request marked as failed: ${requestId}`);
      return true;
      
    } catch (error) {
      logger.error('Error processing recharge failure:', error);
      throw error;
    } finally {
      await connection.end();
    }
  }

  // Validate recharge request data
  static validate(data) {
    const errors = [];

    if (!data.user_id) {
      errors.push('User ID is required');
    }

    if (!data.amount || isNaN(data.amount) || parseFloat(data.amount) <= 0) {
      errors.push('Amount must be a positive number');
    }

    if (!data.payment_method || !['card', 'bank_transfer', 'paypal', 'stripe'].includes(data.payment_method)) {
      errors.push('Invalid payment method');
    }

    if (data.status && !['pending', 'processing', 'completed', 'failed', 'cancelled'].includes(data.status)) {
      errors.push('Invalid status');
    }

    return errors;
  }

  // Convert to JSON
  toJSON() {
    return {
      id: this.id,
      user_id: this.user_id,
      amount: parseFloat(this.amount),
      payment_method: this.payment_method,
      payment_gateway: this.payment_gateway,
      gateway_transaction_id: this.gateway_transaction_id,
      status: this.status,
      failure_reason: this.failure_reason,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

module.exports = WalletRechargeRequest; 