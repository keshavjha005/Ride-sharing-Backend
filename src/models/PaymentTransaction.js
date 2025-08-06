const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const logger = require('../utils/logger');

class PaymentTransaction {
  constructor(data) {
    this.id = data.id;
    this.user_id = data.user_id;
    this.amount = data.amount;
    this.currency = data.currency;
    this.payment_method_id = data.payment_method_id;
    this.gateway = data.gateway;
    this.gateway_transaction_id = data.gateway_transaction_id;
    this.gateway_payment_intent_id = data.gateway_payment_intent_id;
    this.status = data.status;
    this.failure_reason = data.failure_reason;
    this.metadata = data.metadata ? JSON.parse(data.metadata) : null;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  static async create(data) {
    const connection = await mysql.createConnection(config.database);
    
    try {
      // Validate required fields
      const errors = [];
      if (!data.user_id) errors.push('User ID is required');
      if (!data.amount || data.amount <= 0) errors.push('Valid amount is required');
      if (!data.gateway) errors.push('Gateway is required');
      
      if (errors.length > 0) {
        throw new Error(errors.join(', '));
      }

      const transactionId = uuidv4();
      const [result] = await connection.query(
        `INSERT INTO payment_transactions (
          id, user_id, amount, currency, payment_method_id, gateway,
          gateway_transaction_id, gateway_payment_intent_id, status,
          failure_reason, metadata
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          transactionId,
          data.user_id,
          data.amount,
          data.currency || 'USD',
          data.payment_method_id || null,
          data.gateway,
          data.gateway_transaction_id || null,
          data.gateway_payment_intent_id || null,
          data.status || 'pending',
          data.failure_reason || null,
          data.metadata ? JSON.stringify(data.metadata) : null
        ]
      );

      logger.info(`Payment transaction created: ${transactionId} for user: ${data.user_id}`);
      
      return await PaymentTransaction.getById(transactionId);
      
    } finally {
      await connection.end();
    }
  }

  static async getById(id) {
    const connection = await mysql.createConnection(config.database);
    
    try {
      const [rows] = await connection.query(
        'SELECT * FROM payment_transactions WHERE id = ?',
        [id]
      );
      
      if (rows.length === 0) {
        return null;
      }
      
      return new PaymentTransaction(rows[0]);
      
    } finally {
      await connection.end();
    }
  }

  static async getByUserId(userId, options = {}) {
    const connection = await mysql.createConnection(config.database);
    
    try {
      let query = 'SELECT * FROM payment_transactions WHERE user_id = ?';
      const values = [userId];
      
      if (options.status) {
        query += ' AND status = ?';
        values.push(options.status);
      }
      
      if (options.gateway) {
        query += ' AND gateway = ?';
        values.push(options.gateway);
      }
      
      if (options.payment_method_id) {
        query += ' AND payment_method_id = ?';
        values.push(options.payment_method_id);
      }
      
      if (options.start_date) {
        query += ' AND created_at >= ?';
        values.push(options.start_date);
      }
      
      if (options.end_date) {
        query += ' AND created_at <= ?';
        values.push(options.end_date);
      }
      
      // Pagination
      const limit = options.limit || 50;
      const offset = options.offset || 0;
      
      query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      values.push(limit, offset);
      
      const [rows] = await connection.query(query, values);
      
      return rows.map(row => new PaymentTransaction(row));
      
    } finally {
      await connection.end();
    }
  }

  static async getByGatewayTransactionId(gatewayTransactionId) {
    const connection = await mysql.createConnection(config.database);
    
    try {
      const [rows] = await connection.query(
        'SELECT * FROM payment_transactions WHERE gateway_transaction_id = ?',
        [gatewayTransactionId]
      );
      
      if (rows.length === 0) {
        return null;
      }
      
      return new PaymentTransaction(rows[0]);
      
    } finally {
      await connection.end();
    }
  }

  static async getByGatewayPaymentIntentId(gatewayPaymentIntentId) {
    const connection = await mysql.createConnection(config.database);
    
    try {
      const [rows] = await connection.query(
        'SELECT * FROM payment_transactions WHERE gateway_payment_intent_id = ?',
        [gatewayPaymentIntentId]
      );
      
      if (rows.length === 0) {
        return null;
      }
      
      return new PaymentTransaction(rows[0]);
      
    } finally {
      await connection.end();
    }
  }

  static async update(id, updates) {
    const connection = await mysql.createConnection(config.database);
    
    try {
      const allowedFields = [
        'status', 'failure_reason', 'gateway_transaction_id',
        'gateway_payment_intent_id', 'metadata'
      ];
      
      const updateFields = [];
      const values = [];
      
      for (const [field, value] of Object.entries(updates)) {
        if (allowedFields.includes(field)) {
          updateFields.push(`${field} = ?`);
          if (field === 'metadata' && value) {
            values.push(JSON.stringify(value));
          } else {
            values.push(value);
          }
        }
      }
      
      if (updateFields.length === 0) {
        throw new Error('No valid fields to update');
      }
      
      values.push(id);
      
      const [result] = await connection.query(
        `UPDATE payment_transactions SET ${updateFields.join(', ')} WHERE id = ?`,
        values
      );
      
      if (result.affectedRows === 0) {
        throw new Error('Payment transaction not found');
      }
      
      logger.info(`Payment transaction updated: ${id} - Status: ${updates.status || 'unchanged'}`);
      
      return await PaymentTransaction.getById(id);
      
    } finally {
      await connection.end();
    }
  }

  static async updateStatus(id, status, failureReason = null) {
    const updates = { status };
    if (failureReason) {
      updates.failure_reason = failureReason;
    }
    return await PaymentTransaction.update(id, updates);
  }

  static async markAsSucceeded(id, gatewayTransactionId = null) {
    const updates = { status: 'succeeded' };
    if (gatewayTransactionId) {
      updates.gateway_transaction_id = gatewayTransactionId;
    }
    return await PaymentTransaction.update(id, updates);
  }

  static async markAsFailed(id, failureReason) {
    return await PaymentTransaction.update(id, {
      status: 'failed',
      failure_reason: failureReason
    });
  }

  static async markAsProcessing(id) {
    return await PaymentTransaction.update(id, { status: 'processing' });
  }

  static async markAsCancelled(id) {
    return await PaymentTransaction.update(id, { status: 'cancelled' });
  }

  static async getStatistics(userId, period = '30') {
    const connection = await mysql.createConnection(config.database);
    
    try {
      const days = parseInt(period);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const [rows] = await connection.query(
        `SELECT 
          COUNT(*) as total_transactions,
          SUM(CASE WHEN status = 'succeeded' THEN 1 ELSE 0 END) as successful_transactions,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_transactions,
          SUM(CASE WHEN status = 'succeeded' THEN amount ELSE 0 END) as total_amount,
          AVG(CASE WHEN status = 'succeeded' THEN amount ELSE NULL END) as average_amount
        FROM payment_transactions 
        WHERE user_id = ? AND created_at >= ?`,
        [userId, startDate]
      );
      
      return rows[0];
      
    } finally {
      await connection.end();
    }
  }

  static async getTotalAmountByStatus(userId, status, period = '30') {
    const connection = await mysql.createConnection(config.database);
    
    try {
      const days = parseInt(period);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const [rows] = await connection.query(
        `SELECT SUM(amount) as total_amount
        FROM payment_transactions 
        WHERE user_id = ? AND status = ? AND created_at >= ?`,
        [userId, status, startDate]
      );
      
      return rows[0].total_amount || 0;
      
    } finally {
      await connection.end();
    }
  }

  static async validate(data) {
    const errors = [];
    
    if (!data.user_id) {
      errors.push('User ID is required');
    }
    
    if (!data.amount || data.amount <= 0) {
      errors.push('Valid amount is required');
    }
    
    if (!data.gateway || !['stripe', 'paypal'].includes(data.gateway)) {
      errors.push('Valid gateway is required (stripe, paypal)');
    }
    
    if (data.status && !['pending', 'processing', 'succeeded', 'failed', 'cancelled'].includes(data.status)) {
      errors.push('Valid status is required');
    }
    
    if (data.currency && data.currency.length !== 3) {
      errors.push('Currency must be a 3-letter code');
    }
    
    return errors;
  }

  toJSON() {
    return {
      id: this.id,
      user_id: this.user_id,
      amount: this.amount,
      currency: this.currency,
      payment_method_id: this.payment_method_id,
      gateway: this.gateway,
      gateway_transaction_id: this.gateway_transaction_id,
      gateway_payment_intent_id: this.gateway_payment_intent_id,
      status: this.status,
      failure_reason: this.failure_reason,
      metadata: this.metadata,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }

  // Mask sensitive data for API responses
  toPublicJSON() {
    const data = this.toJSON();
    
    // Mask gateway transaction IDs
    if (data.gateway_transaction_id) {
      data.gateway_transaction_id = data.gateway_transaction_id.substring(0, 8) + '...';
    }
    
    if (data.gateway_payment_intent_id) {
      data.gateway_payment_intent_id = data.gateway_payment_intent_id.substring(0, 8) + '...';
    }
    
    return data;
  }
}

module.exports = PaymentTransaction; 