const { v4: uuidv4 } = require('uuid');
const mysql = require('mysql2/promise');
const config = require('../config');
const logger = require('../utils/logger');

class Wallet {
  constructor(data = {}) {
    this.id = data.id || uuidv4();
    this.user_id = data.user_id;
    this.balance = data.balance || 0.00;
    this.currency_code = data.currency_code || 'USD';
    this.is_active = data.is_active !== undefined ? data.is_active : true;
    this.daily_limit = data.daily_limit || 1000.00;
    this.monthly_limit = data.monthly_limit || 10000.00;
    this.created_at = data.created_at || new Date();
    this.updated_at = data.updated_at || new Date();
  }

  // Create a new wallet for a user
  static async create(userId, currencyCode = 'USD') {
    const connection = await mysql.createConnection(config.database);
    
    try {
      const wallet = new Wallet({
        user_id: userId,
        currency_code: currencyCode
      });

      const query = `
        INSERT INTO wallets (id, user_id, balance, currency_code, is_active, daily_limit, monthly_limit, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const values = [
        wallet.id,
        wallet.user_id,
        wallet.balance,
        wallet.currency_code,
        wallet.is_active,
        wallet.daily_limit,
        wallet.monthly_limit,
        wallet.created_at,
        wallet.updated_at
      ];

      await connection.query(query, values);
      
      logger.info(`Wallet created for user: ${userId}`);
      return wallet;
      
    } catch (error) {
      logger.error('Error creating wallet:', error);
      throw error;
    } finally {
      await connection.end();
    }
  }

  // Get wallet by user ID
  static async getByUserId(userId) {
    const connection = await mysql.createConnection(config.database);
    
    try {
      const [rows] = await connection.query(
        'SELECT * FROM wallets WHERE user_id = ? AND is_active = true',
        [userId]
      );

      if (rows.length === 0) {
        return null;
      }

      return new Wallet(rows[0]);
      
    } catch (error) {
      logger.error('Error getting wallet by user ID:', error);
      throw error;
    } finally {
      await connection.end();
    }
  }

  // Get wallet by ID
  static async getById(walletId) {
    const connection = await mysql.createConnection(config.database);
    
    try {
      const [rows] = await connection.query(
        'SELECT * FROM wallets WHERE id = ? AND is_active = true',
        [walletId]
      );

      if (rows.length === 0) {
        return null;
      }

      return new Wallet(rows[0]);
      
    } catch (error) {
      logger.error('Error getting wallet by ID:', error);
      throw error;
    } finally {
      await connection.end();
    }
  }

  // Update wallet balance
  static async updateBalance(walletId, newBalance) {
    const connection = await mysql.createConnection(config.database);
    
    try {
      const query = `
        UPDATE wallets 
        SET balance = ?, updated_at = ? 
        WHERE id = ? AND is_active = true
      `;
      
      const [result] = await connection.query(query, [newBalance, new Date(), walletId]);
      
      if (result.affectedRows === 0) {
        throw new Error('Wallet not found or inactive');
      }

      logger.info(`Wallet balance updated: ${walletId} to ${newBalance}`);
      return true;
      
    } catch (error) {
      logger.error('Error updating wallet balance:', error);
      throw error;
    } finally {
      await connection.end();
    }
  }

  // Update wallet limits
  static async updateLimits(walletId, dailyLimit, monthlyLimit) {
    const connection = await mysql.createConnection(config.database);
    
    try {
      const query = `
        UPDATE wallets 
        SET daily_limit = ?, monthly_limit = ?, updated_at = ? 
        WHERE id = ? AND is_active = true
      `;
      
      const [result] = await connection.query(query, [dailyLimit, monthlyLimit, new Date(), walletId]);
      
      if (result.affectedRows === 0) {
        throw new Error('Wallet not found or inactive');
      }

      logger.info(`Wallet limits updated: ${walletId}`);
      return true;
      
    } catch (error) {
      logger.error('Error updating wallet limits:', error);
      throw error;
    } finally {
      await connection.end();
    }
  }

  // Deactivate wallet
  static async deactivate(walletId) {
    const connection = await mysql.createConnection(config.database);
    
    try {
      const query = `
        UPDATE wallets 
        SET is_active = false, updated_at = ? 
        WHERE id = ?
      `;
      
      const [result] = await connection.query(query, [new Date(), walletId]);
      
      if (result.affectedRows === 0) {
        throw new Error('Wallet not found');
      }

      logger.info(`Wallet deactivated: ${walletId}`);
      return true;
      
    } catch (error) {
      logger.error('Error deactivating wallet:', error);
      throw error;
    } finally {
      await connection.end();
    }
  }

  // Get wallet statistics
  static async getStatistics(walletId, period = '30') {
    const connection = await mysql.createConnection(config.database);
    
    try {
      const query = `
        SELECT 
          COUNT(*) as total_transactions,
          SUM(CASE WHEN transaction_type = 'credit' THEN amount ELSE 0 END) as total_credits,
          SUM(CASE WHEN transaction_type = 'debit' THEN amount ELSE 0 END) as total_debits,
          SUM(CASE WHEN status = 'completed' THEN 
            CASE WHEN transaction_type = 'credit' THEN amount ELSE -amount END 
            ELSE 0 END) as net_amount,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_transactions
        FROM wallet_transactions 
        WHERE wallet_id = ? 
        AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      `;
      
      const [rows] = await connection.query(query, [walletId, period]);
      
      return rows[0] || {
        total_transactions: 0,
        total_credits: 0,
        total_debits: 0,
        net_amount: 0,
        pending_transactions: 0
      };
      
    } catch (error) {
      logger.error('Error getting wallet statistics:', error);
      throw error;
    } finally {
      await connection.end();
    }
  }

  // Check if user has sufficient balance
  static async hasSufficientBalance(walletId, amount) {
    const wallet = await this.getById(walletId);
    if (!wallet) {
      return false;
    }
    return wallet.balance >= amount;
  }

  // Check daily limit
  static async checkDailyLimit(walletId, amount) {
    const connection = await mysql.createConnection(config.database);
    
    try {
      const wallet = await this.getById(walletId);
      if (!wallet) {
        return false;
      }

      const query = `
        SELECT COALESCE(SUM(amount), 0) as daily_total
        FROM wallet_transactions 
        WHERE wallet_id = ? 
        AND transaction_type = 'debit'
        AND status = 'completed'
        AND DATE(created_at) = CURDATE()
      `;
      
      const [rows] = await connection.query(query, [walletId]);
      const dailyTotal = parseFloat(rows[0].daily_total);
      
      return (dailyTotal + amount) <= wallet.daily_limit;
      
    } catch (error) {
      logger.error('Error checking daily limit:', error);
      throw error;
    } finally {
      await connection.end();
    }
  }

  // Check monthly limit
  static async checkMonthlyLimit(walletId, amount) {
    const connection = await mysql.createConnection(config.database);
    
    try {
      const wallet = await this.getById(walletId);
      if (!wallet) {
        return false;
      }

      const query = `
        SELECT COALESCE(SUM(amount), 0) as monthly_total
        FROM wallet_transactions 
        WHERE wallet_id = ? 
        AND transaction_type = 'debit'
        AND status = 'completed'
        AND YEAR(created_at) = YEAR(CURDATE())
        AND MONTH(created_at) = MONTH(CURDATE())
      `;
      
      const [rows] = await connection.query(query, [walletId]);
      const monthlyTotal = parseFloat(rows[0].monthly_total);
      
      return (monthlyTotal + amount) <= wallet.monthly_limit;
      
    } catch (error) {
      logger.error('Error checking monthly limit:', error);
      throw error;
    } finally {
      await connection.end();
    }
  }

  // Validate wallet data
  static validate(data) {
    const errors = [];

    if (data.balance !== undefined && (isNaN(data.balance) || data.balance < 0)) {
      errors.push('Balance must be a non-negative number');
    }

    if (data.daily_limit !== undefined && (isNaN(data.daily_limit) || data.daily_limit < 0)) {
      errors.push('Daily limit must be a non-negative number');
    }

    if (data.monthly_limit !== undefined && (isNaN(data.monthly_limit) || data.monthly_limit < 0)) {
      errors.push('Monthly limit must be a non-negative number');
    }

    if (data.currency_code && !/^[A-Z]{3}$/.test(data.currency_code)) {
      errors.push('Currency code must be a 3-letter ISO code');
    }

    return errors;
  }

  // Convert to JSON
  toJSON() {
    return {
      id: this.id,
      user_id: this.user_id,
      balance: parseFloat(this.balance),
      currency_code: this.currency_code,
      is_active: this.is_active,
      daily_limit: parseFloat(this.daily_limit),
      monthly_limit: parseFloat(this.monthly_limit),
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

module.exports = Wallet; 