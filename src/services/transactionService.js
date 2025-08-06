const BookingPayment = require('../models/BookingPayment');
const CommissionTransaction = require('../models/CommissionTransaction');
const Booking = require('../models/Booking');
const Wallet = require('../models/Wallet');
const WalletTransaction = require('../models/WalletTransaction');
const PaymentTransaction = require('../models/PaymentTransaction');
const db = require('../config/database');
const logger = require('../utils/logger');

class TransactionService {
  /**
   * Process booking payment
   * @param {string} bookingId - Booking ID
   * @param {string} userId - User ID
   * @param {number} amount - Payment amount
   * @param {string} paymentMethod - Payment method (wallet, card, paypal)
   * @param {string} paymentTransactionId - Payment transaction ID (optional)
   * @param {object} pricingDetails - Pricing calculation details (optional)
   * @returns {object} Payment result
   */
  static async processBookingPayment(bookingId, userId, amount, paymentMethod, paymentTransactionId = null, pricingDetails = null) {
    try {
      logger.info(`Processing booking payment: ${bookingId} for user: ${userId}, amount: ${amount}, method: ${paymentMethod}`);

      // Validate booking exists and belongs to user
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        throw new Error('Booking not found');
      }

      if (booking.user_id !== userId) {
        throw new Error('Not authorized to pay for this booking');
      }

      if (booking.payment_status === 'paid') {
        throw new Error('Booking is already paid');
      }

      // Validate amount matches booking amount
      if (Math.abs(amount - booking.total_amount) > 0.01) {
        throw new Error('Payment amount does not match booking amount');
      }

      let paymentResult;

      // Process payment based on method
      switch (paymentMethod) {
        case 'wallet':
          paymentResult = await this.processWalletPayment(bookingId, userId, amount, pricingDetails);
          break;
        case 'card':
        case 'paypal':
          paymentResult = await this.processGatewayPayment(bookingId, userId, amount, paymentMethod, paymentTransactionId, pricingDetails);
          break;
        default:
          throw new Error('Invalid payment method');
      }

      logger.info(`Booking payment processed successfully: ${paymentResult.payment.id}`);
      return paymentResult;

    } catch (error) {
      logger.error('Error processing booking payment:', error);
      throw error;
    }
  }

  /**
   * Process wallet payment
   * @param {string} bookingId - Booking ID
   * @param {string} userId - User ID
   * @param {number} amount - Payment amount
   * @param {object} pricingDetails - Pricing details
   * @returns {object} Payment result
   */
  static async processWalletPayment(bookingId, userId, amount, pricingDetails = null) {
    try {
      // Get user's wallet
      const wallet = await Wallet.getByUserId(userId);
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      // Check wallet balance
      if (!wallet.hasSufficientBalance(wallet.id, amount)) {
        throw new Error('Insufficient wallet balance');
      }

      // Check daily limit
      if (!wallet.checkDailyLimit(wallet.id, amount)) {
        throw new Error('Daily spending limit exceeded');
      }

      // Create booking payment record
      const payment = await BookingPayment.processPayment(bookingId, userId, amount, 'wallet', null, pricingDetails);

      // Process wallet debit
      const walletTransaction = await WalletTransaction.processDebit(
        wallet.id,
        amount,
        'ride_payment',
        `Payment for booking ${bookingId}`,
        bookingId,
        'booking'
      );

      // Create commission transaction
      const commission = await CommissionTransaction.createForBookingPayment(
        payment.id,
        payment.admin_commission_amount,
        (payment.admin_commission_amount / amount) * 100,
        'booking_commission'
      );

      // Update payment status to completed
      await BookingPayment.updateStatus(payment.id, 'completed');

      return {
        payment: payment.toJSON(),
        walletTransaction: walletTransaction.toJSON(),
        commission: commission.toJSON(),
        success: true
      };

    } catch (error) {
      logger.error('Error processing wallet payment:', error);
      throw error;
    }
  }

  /**
   * Process gateway payment (card/paypal)
   * @param {string} bookingId - Booking ID
   * @param {string} userId - User ID
   * @param {number} amount - Payment amount
   * @param {string} paymentMethod - Payment method
   * @param {string} paymentTransactionId - Payment transaction ID
   * @param {object} pricingDetails - Pricing details
   * @returns {object} Payment result
   */
  static async processGatewayPayment(bookingId, userId, amount, paymentMethod, paymentTransactionId, pricingDetails = null) {
    try {
      // Validate payment transaction exists
      if (paymentTransactionId) {
        const paymentTransaction = await PaymentTransaction.getByGatewayTransactionId(paymentTransactionId);
        if (!paymentTransaction) {
          throw new Error('Payment transaction not found');
        }

        if (paymentTransaction.status !== 'succeeded') {
          throw new Error('Payment transaction not successful');
        }
      }

      // Create booking payment record
      const payment = await BookingPayment.processPayment(bookingId, userId, amount, paymentMethod, paymentTransactionId, pricingDetails);

      // Create commission transaction
      const commission = await CommissionTransaction.createForBookingPayment(
        payment.id,
        payment.admin_commission_amount,
        (payment.admin_commission_amount / amount) * 100,
        'booking_commission'
      );

      // Update payment status to completed
      await BookingPayment.updateStatus(payment.id, 'completed');

      return {
        payment: payment.toJSON(),
        commission: commission.toJSON(),
        success: true
      };

    } catch (error) {
      logger.error('Error processing gateway payment:', error);
      throw error;
    }
  }

  /**
   * Process refund for booking payment
   * @param {string} bookingPaymentId - Booking payment ID
   * @param {number} refundAmount - Refund amount
   * @param {string} reason - Refund reason
   * @returns {object} Refund result
   */
  static async processRefund(bookingPaymentId, refundAmount, reason = null) {
    try {
      logger.info(`Processing refund: ${bookingPaymentId}, amount: ${refundAmount}, reason: ${reason}`);

      const payment = await BookingPayment.findById(bookingPaymentId);
      if (!payment) {
        throw new Error('Booking payment not found');
      }

      if (payment.status !== 'completed') {
        throw new Error('Payment must be completed before refund');
      }

      if (refundAmount > payment.amount) {
        throw new Error('Refund amount cannot exceed payment amount');
      }

      // Process refund
      const refundResult = await BookingPayment.processRefund(bookingPaymentId, refundAmount, reason);

      // Handle wallet refund if payment was made via wallet
      if (payment.payment_method === 'wallet') {
        const wallet = await Wallet.getByUserId(payment.user_id);
        if (wallet) {
          await WalletTransaction.processCredit(
            wallet.id,
            refundResult.netRefundAmount,
            'refund',
            `Refund for booking payment ${payment.id}`,
            payment.id,
            'booking_payment'
          );
        }
      }

      // Process commission refund
      const commissionTransactions = await CommissionTransaction.findByBookingPaymentId(payment.id);
      for (const commission of commissionTransactions) {
        if (commission.status === 'collected') {
          const commissionRefundAmount = (refundAmount * commission.commission_percentage) / 100;
          await CommissionTransaction.processRefund(commission.id, commissionRefundAmount);
        }
      }

      // Update booking payment status
      await Booking.updatePaymentStatus(payment.booking_id, 'refunded', payment.user_id);

      logger.info(`Refund processed successfully: ${refundResult.refundPayment.id}`);
      return refundResult;

    } catch (error) {
      logger.error('Error processing refund:', error);
      throw error;
    }
  }

  /**
   * Get transaction history for user
   * @param {string} userId - User ID
   * @param {object} options - Query options
   * @returns {object} Transaction history
   */
  static async getTransactionHistory(userId, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        status = null,
        paymentMethod = null,
        startDate = null,
        endDate = null
      } = options;

      const result = await BookingPayment.findByUserId(userId, page, limit);

      // Apply filters
      if (status || paymentMethod || startDate || endDate) {
        result.payments = result.payments.filter(payment => {
          if (status && payment.status !== status) return false;
          if (paymentMethod && payment.payment_method !== paymentMethod) return false;
          if (startDate && new Date(payment.created_at) < new Date(startDate)) return false;
          if (endDate && new Date(payment.created_at) > new Date(endDate)) return false;
          return true;
        });
      }

      return result;

    } catch (error) {
      logger.error('Error getting transaction history:', error);
      throw error;
    }
  }

  /**
   * Get transaction details
   * @param {string} transactionId - Transaction ID
   * @param {string} userId - User ID (for authorization)
   * @returns {object} Transaction details
   */
  static async getTransactionDetails(transactionId, userId) {
    try {
      const payment = await BookingPayment.findById(transactionId);
      if (!payment) {
        throw new Error('Transaction not found');
      }

      if (payment.user_id !== userId) {
        throw new Error('Not authorized to view this transaction');
      }

      // Get commission transactions
      const commissions = await CommissionTransaction.findByBookingPaymentId(transactionId);

      // Get wallet transaction if applicable
      let walletTransaction = null;
      if (payment.payment_method === 'wallet' && payment.payment_transaction_id) {
        walletTransaction = await WalletTransaction.findById(payment.payment_transaction_id);
      }

      return {
        payment: payment.toJSON(),
        commissions: commissions.map(c => c.toJSON()),
        walletTransaction: walletTransaction ? walletTransaction.toJSON() : null
      };

    } catch (error) {
      logger.error('Error getting transaction details:', error);
      throw error;
    }
  }

  /**
   * Reconcile transactions
   * @param {object} options - Reconciliation options
   * @returns {object} Reconciliation result
   */
  static async reconcileTransactions(options = {}) {
    try {
      const {
        startDate = null,
        endDate = null,
        status = null
      } = options;

      const conditions = [];
      const values = [];

      if (startDate) {
        conditions.push('bp.created_at >= ?');
        values.push(startDate);
      }

      if (endDate) {
        conditions.push('bp.created_at <= ?');
        values.push(endDate);
      }

      if (status) {
        conditions.push('bp.status = ?');
        values.push(status);
      }

      const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

      const query = `
        SELECT 
          COUNT(*) as total_transactions,
          SUM(bp.amount) as total_amount,
          SUM(bp.admin_commission_amount) as total_commission,
          SUM(bp.driver_earning_amount) as total_driver_earnings,
          COUNT(CASE WHEN bp.status = 'completed' THEN 1 END) as completed_transactions,
          COUNT(CASE WHEN bp.status = 'failed' THEN 1 END) as failed_transactions,
          COUNT(CASE WHEN bp.status = 'refunded' THEN 1 END) as refunded_transactions
        FROM booking_payments bp
        ${whereClause}
      `;

      const [rows] = await db.execute(query, values);
      const reconciliation = rows[0];

      // Get commission reconciliation
      const commissionQuery = `
        SELECT 
          COUNT(*) as total_commissions,
          SUM(commission_amount) as total_commission_amount,
          COUNT(CASE WHEN status = 'collected' THEN 1 END) as collected_commissions,
          COUNT(CASE WHEN status = 'refunded' THEN 1 END) as refunded_commissions
        FROM commission_transactions ct
        LEFT JOIN booking_payments bp ON ct.booking_payment_id = bp.id
        ${whereClause}
      `;

      const [commissionRows] = await db.execute(commissionQuery, values);
      const commissionReconciliation = commissionRows[0];

      return {
        transactions: reconciliation,
        commissions: commissionReconciliation,
        reconciliation_date: new Date(),
        period: {
          start_date: startDate,
          end_date: endDate
        }
      };

    } catch (error) {
      logger.error('Error reconciling transactions:', error);
      throw error;
    }
  }

  /**
   * Get transaction statistics
   * @param {string} userId - User ID (optional)
   * @param {string} period - Period in days
   * @returns {object} Transaction statistics
   */
  static async getTransactionStatistics(userId = null, period = '30') {
    try {
      const paymentStats = await BookingPayment.getStatistics(userId, period);
      const commissionStats = await CommissionTransaction.getStatistics(period);
      const commissionStatsByType = await CommissionTransaction.getStatisticsByType(period);

      return {
        payments: paymentStats,
        commissions: commissionStats,
        commissions_by_type: commissionStatsByType,
        period: period,
        generated_at: new Date()
      };

    } catch (error) {
      logger.error('Error getting transaction statistics:', error);
      throw error;
    }
  }

  /**
   * Validate transaction data
   * @param {object} data - Transaction data
   * @returns {Array} Validation errors
   */
  static validateTransactionData(data) {
    const errors = [];

    if (!data.bookingId) {
      errors.push('Booking ID is required');
    }

    if (!data.amount || data.amount <= 0) {
      errors.push('Amount must be greater than 0');
    }

    if (!data.paymentMethod || !['wallet', 'card', 'paypal'].includes(data.paymentMethod)) {
      errors.push('Valid payment method is required');
    }

    return errors;
  }
}

module.exports = TransactionService; 