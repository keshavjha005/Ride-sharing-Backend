const { v4: uuidv4 } = require('uuid');
const mysql = require('mysql2/promise');
const config = require('../config');
const logger = require('../utils/logger');

class WalletTransaction {
  constructor(data = {}) {
    this.id = data.id || uuidv4();
    this.wallet_id = data.wallet_id;
    this.transaction_type = data.transaction_type; // 'credit' or 'debit'
    this.amount = data.amount || 0.00;
    this.balance_before = data.balance_before || 0.00;
    this.balance_after = data.balance_after || 0.00;
    this.transaction_category = data.transaction_category;
    this.reference_id = data.reference_id;
    this.reference_type = data.reference_type;
    this.description = data.description;
    this.status = data.status || 'pending';
    this.created_at = data.created_at || new Date();
  }

  // Create a new transaction
  static async create(transactionData) {
    const connection = await mysql.createConnection(config.database);
    
    try {
      const transaction = new WalletTransaction(transactionData);

      const query = `
        INSERT INTO wallet_transactions (
          id, wallet_id, transaction_type, amount, balance_before, balance_after,
          transaction_category, reference_id, reference_type, description, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const values = [
        transaction.id,
        transaction.wallet_id,
        transaction.transaction_type,
        transaction.amount,
        transaction.balance_before,
        transaction.balance_after,
        transaction.transaction_category,
        transaction.reference_id,
        transaction.reference_type,
        transaction.description,
        transaction.status,
        transaction.created_at
      ];

      await connection.query(query, values);
      
      logger.info(`Wallet transaction created: ${transaction.id} for wallet: ${transaction.wallet_id}`);
      return transaction;
      
    } catch (error) {
      logger.error('Error creating wallet transaction:', error);
      throw error;
    } finally {
      await connection.end();
    }
  }

  // Get transaction by ID
  static async getById(transactionId) {
    const connection = await mysql.createConnection(config.database);
    
    try {
      const [rows] = await connection.query(
        'SELECT * FROM wallet_transactions WHERE id = ?',
        [transactionId]
      );

      if (rows.length === 0) {
        return null;
      }

      return new WalletTransaction(rows[0]);
      
    } catch (error) {
      logger.error('Error getting transaction by ID:', error);
      throw error;
    } finally {
      await connection.end();
    }
  }

  // Get transactions by wallet ID
  static async getByWalletId(walletId, options = {}) {
    const connection = await mysql.createConnection(config.database);
    
    try {
      let query = 'SELECT * FROM wallet_transactions WHERE wallet_id = ?';
      const values = [walletId];
      
      // Add filters
      if (options.transaction_type) {
        query += ' AND transaction_type = ?';
        values.push(options.transaction_type);
      }
      
      if (options.transaction_category) {
        query += ' AND transaction_category = ?';
        values.push(options.transaction_category);
      }
      
      if (options.status) {
        query += ' AND status = ?';
        values.push(options.status);
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
      
      return rows.map(row => new WalletTransaction(row));
      
    } catch (error) {
      logger.error('Error getting transactions by wallet ID:', error);
      throw error;
    } finally {
      await connection.end();
    }
  }

  // Get transactions by user ID
  static async getByUserId(userId, options = {}) {
    const connection = await mysql.createConnection(config.database);
    
    try {
      let query = `
        SELECT wt.* FROM wallet_transactions wt
        JOIN wallets w ON wt.wallet_id = w.id
        WHERE w.user_id = ?
      `;
      const values = [userId];
      
      // Add filters
      if (options.transaction_type) {
        query += ' AND wt.transaction_type = ?';
        values.push(options.transaction_type);
      }
      
      if (options.transaction_category) {
        query += ' AND wt.transaction_category = ?';
        values.push(options.transaction_category);
      }
      
      if (options.status) {
        query += ' AND wt.status = ?';
        values.push(options.status);
      }
      
      if (options.start_date) {
        query += ' AND wt.created_at >= ?';
        values.push(options.start_date);
      }
      
      if (options.end_date) {
        query += ' AND wt.created_at <= ?';
        values.push(options.end_date);
      }
      
      // Add ordering
      query += ' ORDER BY wt.created_at DESC';
      
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
      
      return rows.map(row => new WalletTransaction(row));
      
    } catch (error) {
      logger.error('Error getting transactions by user ID:', error);
      throw error;
    } finally {
      await connection.end();
    }
  }

  // Update transaction status
  static async updateStatus(transactionId, status) {
    const connection = await mysql.createConnection(config.database);
    
    try {
      const query = `
        UPDATE wallet_transactions 
        SET status = ? 
        WHERE id = ?
      `;
      
      const [result] = await connection.query(query, [status, transactionId]);
      
      if (result.affectedRows === 0) {
        throw new Error('Transaction not found');
      }

      logger.info(`Transaction status updated: ${transactionId} to ${status}`);
      return true;
      
    } catch (error) {
      logger.error('Error updating transaction status:', error);
      throw error;
    } finally {
      await connection.end();
    }
  }

  // Get transaction summary for a wallet
  static async getSummary(walletId, period = '30') {
    const connection = await mysql.createConnection(config.database);
    
    try {
      const query = `
        SELECT 
          COUNT(*) as total_transactions,
          SUM(CASE WHEN transaction_type = 'credit' THEN amount ELSE 0 END) as total_credits,
          SUM(CASE WHEN transaction_type = 'debit' THEN amount ELSE 0 END) as total_debits,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_transactions,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_transactions,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_transactions,
          SUM(CASE WHEN status = 'completed' THEN 
            CASE WHEN transaction_type = 'credit' THEN amount ELSE -amount END 
            ELSE 0 END) as net_amount
        FROM wallet_transactions 
        WHERE wallet_id = ? 
        AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      `;
      
      const [rows] = await connection.query(query, [walletId, period]);
      
      return rows[0] || {
        total_transactions: 0,
        total_credits: 0,
        total_debits: 0,
        completed_transactions: 0,
        pending_transactions: 0,
        failed_transactions: 0,
        net_amount: 0
      };
      
    } catch (error) {
      logger.error('Error getting transaction summary:', error);
      throw error;
    } finally {
      await connection.end();
    }
  }

  // Get transactions by reference
  static async getByReference(referenceId, referenceType) {
    const connection = await mysql.createConnection(config.database);
    
    try {
      const [rows] = await connection.query(
        'SELECT * FROM wallet_transactions WHERE reference_id = ? AND reference_type = ? ORDER BY created_at DESC',
        [referenceId, referenceType]
      );

      return rows.map(row => new WalletTransaction(row));
      
    } catch (error) {
      logger.error('Error getting transactions by reference:', error);
      throw error;
    } finally {
      await connection.end();
    }
  }

  // Process a credit transaction
  static async processCredit(walletId, amount, category, referenceId = null, referenceType = null, description = null) {
    const connection = await mysql.createConnection(config.database);
    
    try {
      await connection.beginTransaction();
      
      // Get current wallet balance
      const [walletRows] = await connection.query(
        'SELECT balance FROM wallets WHERE id = ? AND is_active = true',
        [walletId]
      );
      
      if (walletRows.length === 0) {
        throw new Error('Wallet not found or inactive');
      }
      
      const balanceBefore = parseFloat(walletRows[0].balance);
      const balanceAfter = balanceBefore + parseFloat(amount);
      
      // Create transaction record
      const transaction = new WalletTransaction({
        wallet_id: walletId,
        transaction_type: 'credit',
        amount: parseFloat(amount),
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        transaction_category: category,
        reference_id: referenceId,
        reference_type: referenceType,
        description: description,
        status: 'completed'
      });
      
      // Insert transaction
      const insertQuery = `
        INSERT INTO wallet_transactions (
          id, wallet_id, transaction_type, amount, balance_before, balance_after,
          transaction_category, reference_id, reference_type, description, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      await connection.query(insertQuery, [
        transaction.id,
        transaction.wallet_id,
        transaction.transaction_type,
        transaction.amount,
        transaction.balance_before,
        transaction.balance_after,
        transaction.transaction_category,
        transaction.reference_id,
        transaction.reference_type,
        transaction.description,
        transaction.status,
        transaction.created_at
      ]);
      
      // Update wallet balance
      await connection.query(
        'UPDATE wallets SET balance = ?, updated_at = ? WHERE id = ?',
        [balanceAfter, new Date(), walletId]
      );
      
      await connection.commit();
      
      logger.info(`Credit transaction processed: ${transaction.id} for wallet: ${walletId}`);
      return transaction;
      
    } catch (error) {
      await connection.rollback();
      logger.error('Error processing credit transaction:', error);
      throw error;
    } finally {
      await connection.end();
    }
  }

  // Process a debit transaction
  static async processDebit(walletId, amount, category, referenceId = null, referenceType = null, description = null) {
    const connection = await mysql.createConnection(config.database);
    
    try {
      await connection.beginTransaction();
      
      // Get current wallet balance
      const [walletRows] = await connection.query(
        'SELECT balance FROM wallets WHERE id = ? AND is_active = true',
        [walletId]
      );
      
      if (walletRows.length === 0) {
        throw new Error('Wallet not found or inactive');
      }
      
      const balanceBefore = parseFloat(walletRows[0].balance);
      
      if (balanceBefore < parseFloat(amount)) {
        throw new Error('Insufficient balance');
      }
      
      const balanceAfter = balanceBefore - parseFloat(amount);
      
      // Create transaction record
      const transaction = new WalletTransaction({
        wallet_id: walletId,
        transaction_type: 'debit',
        amount: parseFloat(amount),
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        transaction_category: category,
        reference_id: referenceId,
        reference_type: referenceType,
        description: description,
        status: 'completed'
      });
      
      // Insert transaction
      const insertQuery = `
        INSERT INTO wallet_transactions (
          id, wallet_id, transaction_type, amount, balance_before, balance_after,
          transaction_category, reference_id, reference_type, description, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      await connection.query(insertQuery, [
        transaction.id,
        transaction.wallet_id,
        transaction.transaction_type,
        transaction.amount,
        transaction.balance_before,
        transaction.balance_after,
        transaction.transaction_category,
        transaction.reference_id,
        transaction.reference_type,
        transaction.description,
        transaction.status,
        transaction.created_at
      ]);
      
      // Update wallet balance
      await connection.query(
        'UPDATE wallets SET balance = ?, updated_at = ? WHERE id = ?',
        [balanceAfter, new Date(), walletId]
      );
      
      await connection.commit();
      
      logger.info(`Debit transaction processed: ${transaction.id} for wallet: ${walletId}`);
      return transaction;
      
    } catch (error) {
      await connection.rollback();
      logger.error('Error processing debit transaction:', error);
      throw error;
    } finally {
      await connection.end();
    }
  }

  // Validate transaction data
  static validate(data) {
    const errors = [];

    if (!data.wallet_id) {
      errors.push('Wallet ID is required');
    }

    if (!data.transaction_type || !['credit', 'debit'].includes(data.transaction_type)) {
      errors.push('Transaction type must be credit or debit');
    }

    if (!data.amount || isNaN(data.amount) || parseFloat(data.amount) <= 0) {
      errors.push('Amount must be a positive number');
    }

    if (!data.transaction_category || ![
      'ride_payment', 'ride_earning', 'wallet_recharge', 'withdrawal', 'refund', 'commission', 'bonus'
    ].includes(data.transaction_category)) {
      errors.push('Invalid transaction category');
    }

    if (data.status && !['pending', 'completed', 'failed', 'cancelled'].includes(data.status)) {
      errors.push('Invalid transaction status');
    }

    return errors;
  }

  // Convert to JSON
  toJSON() {
    return {
      id: this.id,
      wallet_id: this.wallet_id,
      transaction_type: this.transaction_type,
      amount: parseFloat(this.amount),
      balance_before: parseFloat(this.balance_before),
      balance_after: parseFloat(this.balance_after),
      transaction_category: this.transaction_category,
      reference_id: this.reference_id,
      reference_type: this.reference_type,
      description: this.description,
      status: this.status,
      created_at: this.created_at
    };
  }
}

module.exports = WalletTransaction; 