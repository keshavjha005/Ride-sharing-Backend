const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const logger = require('../utils/logger');

class CommissionTransaction {
  constructor(data = {}) {
    this.id = data.id || uuidv4();
    this.booking_payment_id = data.booking_payment_id;
    this.commission_amount = data.commission_amount;
    this.commission_percentage = data.commission_percentage;
    this.transaction_type = data.transaction_type;
    this.status = data.status || 'pending';
    this.created_at = data.created_at || new Date();
  }

  // Create a new commission transaction
  static async create(commissionData) {
    try {
      const commission = new CommissionTransaction(commissionData);
      
      const query = `
        INSERT INTO commission_transactions (
          id, booking_payment_id, commission_amount, commission_percentage,
          transaction_type, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        commission.id, commission.booking_payment_id, commission.commission_amount,
        commission.commission_percentage, commission.transaction_type,
        commission.status, commission.created_at
      ];

      await db.execute(query, values);
      
      return commission;
    } catch (error) {
      logger.error('Error creating commission transaction:', error);
      throw error;
    }
  }

  // Find commission transaction by ID
  static async findById(id) {
    try {
      const query = `
        SELECT ct.*, 
               bp.amount as booking_payment_amount,
               bp.payment_method,
               bp.status as booking_payment_status,
               b.total_amount as booking_amount,
               u.first_name, u.last_name, u.email
        FROM commission_transactions ct
        LEFT JOIN booking_payments bp ON ct.booking_payment_id = bp.id
        LEFT JOIN bookings b ON bp.booking_id = b.id
        LEFT JOIN users u ON bp.user_id = u.id
        WHERE ct.id = ?
      `;

      const [rows] = await db.execute(query, [id]);
      
      if (rows.length === 0) {
        return null;
      }

      return new CommissionTransaction(rows[0]);
    } catch (error) {
      logger.error('Error finding commission transaction by ID:', error);
      throw error;
    }
  }

  // Find commission transactions by booking payment ID
  static async findByBookingPaymentId(bookingPaymentId) {
    try {
      const query = `
        SELECT ct.*, 
               bp.amount as booking_payment_amount,
               bp.payment_method,
               bp.status as booking_payment_status
        FROM commission_transactions ct
        LEFT JOIN booking_payments bp ON ct.booking_payment_id = bp.id
        WHERE ct.booking_payment_id = ?
        ORDER BY ct.created_at DESC
      `;

      const [rows] = await db.execute(query, [bookingPaymentId]);
      
      return rows.map(row => new CommissionTransaction(row));
    } catch (error) {
      logger.error('Error finding commission transactions by booking payment ID:', error);
      throw error;
    }
  }

  // Find all commission transactions with filtering
  static async findAll(options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        transactionType = null,
        status = null,
        startDate = null,
        endDate = null
      } = options;

      const offset = (page - 1) * limit;
      const conditions = [];
      const values = [];

      if (transactionType) {
        conditions.push('ct.transaction_type = ?');
        values.push(transactionType);
      }

      if (status) {
        conditions.push('ct.status = ?');
        values.push(status);
      }

      if (startDate) {
        conditions.push('ct.created_at >= ?');
        values.push(startDate);
      }

      if (endDate) {
        conditions.push('ct.created_at <= ?');
        values.push(endDate);
      }

      const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

      const query = `
        SELECT ct.*, 
               bp.amount as booking_payment_amount,
               bp.payment_method,
               bp.status as booking_payment_status,
               b.total_amount as booking_amount,
               u.first_name, u.last_name, u.email
        FROM commission_transactions ct
        LEFT JOIN booking_payments bp ON ct.booking_payment_id = bp.id
        LEFT JOIN bookings b ON bp.booking_id = b.id
        LEFT JOIN users u ON bp.user_id = u.id
        ${whereClause}
        ORDER BY ct.created_at DESC
        LIMIT ? OFFSET ?
      `;

      const countQuery = `
        SELECT COUNT(*) as total
        FROM commission_transactions ct
        ${whereClause}
      `;

      values.push(limit, offset);
      const [rows] = await db.execute(query, values);
      const [countRows] = await db.execute(countQuery, values.slice(0, -2));

      const commissions = rows.map(row => new CommissionTransaction(row));
      const total = countRows[0].total;

      return {
        commissions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error finding commission transactions:', error);
      throw error;
    }
  }

  // Update commission transaction status
  static async updateStatus(id, status) {
    try {
      const query = 'UPDATE commission_transactions SET status = ? WHERE id = ?';
      const [result] = await db.execute(query, [status, id]);
      
      if (result.affectedRows === 0) {
        throw new Error('Commission transaction not found');
      }

      return await this.findById(id);
    } catch (error) {
      logger.error('Error updating commission transaction status:', error);
      throw error;
    }
  }

  // Create commission transaction for booking payment
  static async createForBookingPayment(bookingPaymentId, commissionAmount, commissionPercentage, transactionType = 'booking_commission') {
    try {
      const commissionData = {
        booking_payment_id: bookingPaymentId,
        commission_amount: commissionAmount,
        commission_percentage: commissionPercentage,
        transaction_type: transactionType,
        status: 'pending'
      };

      const commission = await this.create(commissionData);

      // Update status to collected if commission amount is greater than 0
      if (commissionAmount > 0) {
        await this.updateStatus(commission.id, 'collected');
      }

      return commission;
    } catch (error) {
      logger.error('Error creating commission transaction for booking payment:', error);
      throw error;
    }
  }

  // Process commission refund
  static async processRefund(commissionId, refundAmount) {
    try {
      const commission = await this.findById(commissionId);
      if (!commission) {
        throw new Error('Commission transaction not found');
      }

      if (commission.status !== 'collected') {
        throw new Error('Commission must be collected before refund');
      }

      if (refundAmount > commission.commission_amount) {
        throw new Error('Refund amount cannot exceed commission amount');
      }

      // Update status to refunded
      await this.updateStatus(commissionId, 'refunded');

      return await this.findById(commissionId);
    } catch (error) {
      logger.error('Error processing commission refund:', error);
      throw error;
    }
  }

  // Get commission statistics
  static async getStatistics(period = '30') {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_commissions,
          COUNT(CASE WHEN status = 'collected' THEN 1 END) as collected_commissions,
          COUNT(CASE WHEN status = 'refunded' THEN 1 END) as refunded_commissions,
          SUM(CASE WHEN status = 'collected' THEN commission_amount ELSE 0 END) as total_collected,
          SUM(CASE WHEN status = 'refunded' THEN commission_amount ELSE 0 END) as total_refunded,
          AVG(commission_percentage) as average_commission_percentage,
          SUM(commission_amount) as total_commission_amount
        FROM commission_transactions
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      `;

      const [rows] = await db.execute(query, [period]);
      return rows[0];
    } catch (error) {
      logger.error('Error getting commission statistics:', error);
      throw error;
    }
  }

  // Get commission statistics by type
  static async getStatisticsByType(period = '30') {
    try {
      const query = `
        SELECT 
          transaction_type,
          COUNT(*) as total_commissions,
          COUNT(CASE WHEN status = 'collected' THEN 1 END) as collected_commissions,
          COUNT(CASE WHEN status = 'refunded' THEN 1 END) as refunded_commissions,
          SUM(CASE WHEN status = 'collected' THEN commission_amount ELSE 0 END) as total_collected,
          SUM(CASE WHEN status = 'refunded' THEN commission_amount ELSE 0 END) as total_refunded,
          AVG(commission_percentage) as average_commission_percentage
        FROM commission_transactions
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        GROUP BY transaction_type
      `;

      const [rows] = await db.execute(query, [period]);
      return rows;
    } catch (error) {
      logger.error('Error getting commission statistics by type:', error);
      throw error;
    }
  }

  // Validate commission data
  static validateCommissionData(data) {
    const errors = [];

    if (!data.booking_payment_id) {
      errors.push('Booking payment ID is required');
    }

    if (!data.commission_amount || data.commission_amount < 0) {
      errors.push('Commission amount must be greater than or equal to 0');
    }

    if (!data.commission_percentage || data.commission_percentage < 0) {
      errors.push('Commission percentage must be greater than or equal to 0');
    }

    if (!data.transaction_type || !['booking_commission', 'withdrawal_fee'].includes(data.transaction_type)) {
      errors.push('Valid transaction type is required');
    }

    if (data.status && !['pending', 'collected', 'refunded'].includes(data.status)) {
      errors.push('Invalid status');
    }

    return errors;
  }

  // Convert to JSON for API response
  toJSON() {
    return {
      id: this.id,
      booking_payment_id: this.booking_payment_id,
      commission_amount: this.commission_amount,
      commission_percentage: this.commission_percentage,
      transaction_type: this.transaction_type,
      status: this.status,
      created_at: this.created_at
    };
  }
}

module.exports = CommissionTransaction; 