const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const logger = require('../utils/logger');

class BookingPayment {
  constructor(data = {}) {
    this.id = data.id || uuidv4();
    this.booking_id = data.booking_id;
    this.user_id = data.user_id;
    this.amount = data.amount;
    this.payment_method = data.payment_method;
    this.payment_transaction_id = data.payment_transaction_id;
    this.status = data.status || 'pending';
    this.admin_commission_amount = data.admin_commission_amount || 0.00;
    this.driver_earning_amount = data.driver_earning_amount || 0.00;
    this.pricing_details = data.pricing_details ? JSON.stringify(data.pricing_details) : null;
    this.created_at = data.created_at || new Date();
    this.updated_at = data.updated_at || new Date();
  }

  // Create a new booking payment
  static async create(paymentData) {
    try {
      const payment = new BookingPayment(paymentData);
      
      const query = `
        INSERT INTO booking_payments (
          id, booking_id, user_id, amount, payment_method, 
          payment_transaction_id, status, admin_commission_amount, 
          driver_earning_amount, pricing_details, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        payment.id, payment.booking_id, payment.user_id, payment.amount,
        payment.payment_method, payment.payment_transaction_id, payment.status,
        payment.admin_commission_amount, payment.driver_earning_amount,
        payment.pricing_details, payment.created_at, payment.updated_at
      ];

      await db.execute(query, values);
      
      return payment;
    } catch (error) {
      logger.error('Error creating booking payment:', error);
      throw error;
    }
  }

  // Find booking payment by ID
  static async findById(id) {
    try {
      const query = `
        SELECT bp.*, 
               b.total_amount as booking_amount,
               b.status as booking_status,
               b.payment_status as booking_payment_status,
               u.first_name, u.last_name, u.email,
               pt.gateway, pt.gateway_transaction_id
        FROM booking_payments bp
        LEFT JOIN bookings b ON bp.booking_id = b.id
        LEFT JOIN users u ON bp.user_id = u.id
        LEFT JOIN payment_transactions pt ON bp.payment_transaction_id = pt.id
        WHERE bp.id = ?
      `;

      const [rows] = await db.execute(query, [id]);
      
      if (rows.length === 0) {
        return null;
      }

      const row = rows[0];
      if (row.pricing_details) {
        row.pricing_details = JSON.parse(row.pricing_details);
      }

      return new BookingPayment(row);
    } catch (error) {
      logger.error('Error finding booking payment by ID:', error);
      throw error;
    }
  }

  // Find booking payments by booking ID
  static async findByBookingId(bookingId) {
    try {
      const query = `
        SELECT bp.*, 
               pt.gateway, pt.gateway_transaction_id,
               pt.status as payment_transaction_status
        FROM booking_payments bp
        LEFT JOIN payment_transactions pt ON bp.payment_transaction_id = pt.id
        WHERE bp.booking_id = ?
        ORDER BY bp.created_at DESC
      `;

      const [rows] = await db.execute(query, [bookingId]);
      
      return rows.map(row => {
        if (row.pricing_details) {
          row.pricing_details = JSON.parse(row.pricing_details);
        }
        return new BookingPayment(row);
      });
    } catch (error) {
      logger.error('Error finding booking payments by booking ID:', error);
      throw error;
    }
  }

  // Find booking payments by user ID
  static async findByUserId(userId, page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;
      
      const query = `
        SELECT bp.*, 
               b.total_amount as booking_amount,
               b.status as booking_status,
               pt.gateway, pt.gateway_transaction_id
        FROM booking_payments bp
        LEFT JOIN bookings b ON bp.booking_id = b.id
        LEFT JOIN payment_transactions pt ON bp.payment_transaction_id = pt.id
        WHERE bp.user_id = ?
        ORDER BY bp.created_at DESC
        LIMIT ? OFFSET ?
      `;

      const countQuery = `
        SELECT COUNT(*) as total
        FROM booking_payments
        WHERE user_id = ?
      `;

      const [rows] = await db.execute(query, [userId, limit, offset]);
      const [countRows] = await db.execute(countQuery, [userId]);

      const payments = rows.map(row => {
        if (row.pricing_details) {
          row.pricing_details = JSON.parse(row.pricing_details);
        }
        return new BookingPayment(row);
      });

      const total = countRows[0].total;

      return {
        payments,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error finding booking payments by user ID:', error);
      throw error;
    }
  }

  // Update booking payment status
  static async updateStatus(id, status, userId = null) {
    try {
      let query = 'UPDATE booking_payments SET status = ?, updated_at = ? WHERE id = ?';
      let values = [status, new Date(), id];

      // If userId is provided, ensure the payment belongs to the user
      if (userId) {
        query += ' AND user_id = ?';
        values.push(userId);
      }

      const [result] = await db.execute(query, values);
      
      if (result.affectedRows === 0) {
        throw new Error('Booking payment not found or not authorized');
      }

      return await this.findById(id);
    } catch (error) {
      logger.error('Error updating booking payment status:', error);
      throw error;
    }
  }

  // Process booking payment
  static async processPayment(bookingId, userId, amount, paymentMethod, paymentTransactionId = null, pricingDetails = null) {
    try {
      // Calculate commission and driver earnings
      const commissionSettings = await this.getCommissionSettings('booking');
      const commissionPercentage = commissionSettings.commission_percentage;
      const adminCommissionAmount = (amount * commissionPercentage) / 100;
      const driverEarningAmount = amount - adminCommissionAmount;

      const paymentData = {
        booking_id: bookingId,
        user_id: userId,
        amount: amount,
        payment_method: paymentMethod,
        payment_transaction_id: paymentTransactionId,
        status: 'processing',
        admin_commission_amount: adminCommissionAmount,
        driver_earning_amount: driverEarningAmount,
        pricing_details: pricingDetails
      };

      const payment = await this.create(paymentData);

      // Update booking payment status
      const Booking = require('./Booking');
      await Booking.updatePaymentStatus(bookingId, 'paid', userId);

      return payment;
    } catch (error) {
      logger.error('Error processing booking payment:', error);
      throw error;
    }
  }

  // Process refund
  static async processRefund(bookingPaymentId, refundAmount, reason = null) {
    try {
      const payment = await this.findById(bookingPaymentId);
      if (!payment) {
        throw new Error('Booking payment not found');
      }

      if (payment.status !== 'completed') {
        throw new Error('Payment must be completed before refund');
      }

      if (refundAmount > payment.amount) {
        throw new Error('Refund amount cannot exceed payment amount');
      }

      // Calculate refund commission (if any)
      const commissionSettings = await this.getCommissionSettings('withdrawal');
      const refundCommissionAmount = (refundAmount * commissionSettings.commission_percentage) / 100;
      const netRefundAmount = refundAmount - refundCommissionAmount;

      // Update payment status to refunded
      await this.updateStatus(bookingPaymentId, 'refunded');

      // Create refund record
      const refundData = {
        booking_id: payment.booking_id,
        user_id: payment.user_id,
        amount: refundAmount,
        payment_method: payment.payment_method,
        status: 'completed',
        admin_commission_amount: refundCommissionAmount,
        driver_earning_amount: netRefundAmount,
        pricing_details: {
          original_payment_id: payment.id,
          refund_reason: reason,
          refund_amount: refundAmount,
          commission_deducted: refundCommissionAmount
        }
      };

      const refundPayment = await this.create(refundData);

      return {
        originalPayment: payment,
        refundPayment: refundPayment,
        refundAmount: refundAmount,
        commissionDeducted: refundCommissionAmount,
        netRefundAmount: netRefundAmount
      };
    } catch (error) {
      logger.error('Error processing refund:', error);
      throw error;
    }
  }

  // Get commission settings
  static async getCommissionSettings(commissionType) {
    try {
      const query = `
        SELECT * FROM commission_settings 
        WHERE commission_type = ? AND is_active = true 
        ORDER BY effective_from DESC 
        LIMIT 1
      `;

      const [rows] = await db.execute(query, [commissionType]);
      
      if (rows.length === 0) {
        // Return default settings if none found
        return {
          commission_percentage: 10.00,
          commission_amount: null,
          minimum_amount: 0.00,
          maximum_amount: null
        };
      }

      return rows[0];
    } catch (error) {
      logger.error('Error getting commission settings:', error);
      throw error;
    }
  }

  // Get transaction statistics
  static async getStatistics(userId = null, period = '30') {
    try {
      let query = `
        SELECT 
          COUNT(*) as total_transactions,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_transactions,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_transactions,
          COUNT(CASE WHEN status = 'refunded' THEN 1 END) as refunded_transactions,
          SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_amount,
          SUM(CASE WHEN status = 'completed' THEN admin_commission_amount ELSE 0 END) as total_commission,
          SUM(CASE WHEN status = 'completed' THEN driver_earning_amount ELSE 0 END) as total_driver_earnings,
          AVG(CASE WHEN status = 'completed' THEN amount ELSE NULL END) as average_amount
        FROM booking_payments
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      `;

      const values = [period];
      if (userId) {
        query += ' AND user_id = ?';
        values.push(userId);
      }

      const [rows] = await db.execute(query, values);
      return rows[0];
    } catch (error) {
      logger.error('Error getting booking payment statistics:', error);
      throw error;
    }
  }

  // Validate payment data
  static validatePaymentData(data) {
    const errors = [];

    if (!data.booking_id) {
      errors.push('Booking ID is required');
    }

    if (!data.user_id) {
      errors.push('User ID is required');
    }

    if (!data.amount || data.amount <= 0) {
      errors.push('Amount must be greater than 0');
    }

    if (!data.payment_method || !['wallet', 'card', 'paypal'].includes(data.payment_method)) {
      errors.push('Valid payment method is required');
    }

    if (data.status && !['pending', 'processing', 'completed', 'failed', 'refunded'].includes(data.status)) {
      errors.push('Invalid status');
    }

    return errors;
  }

  // Convert to JSON for API response
  toJSON() {
    const json = {
      id: this.id,
      booking_id: this.booking_id,
      user_id: this.user_id,
      amount: this.amount,
      payment_method: this.payment_method,
      status: this.status,
      admin_commission_amount: this.admin_commission_amount,
      driver_earning_amount: this.driver_earning_amount,
      created_at: this.created_at,
      updated_at: this.updated_at
    };

    if (this.payment_transaction_id) {
      json.payment_transaction_id = this.payment_transaction_id;
    }

    if (this.pricing_details) {
      json.pricing_details = typeof this.pricing_details === 'string' 
        ? JSON.parse(this.pricing_details) 
        : this.pricing_details;
    }

    return json;
  }
}

module.exports = BookingPayment; 