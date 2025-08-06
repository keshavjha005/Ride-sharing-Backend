const { validationResult } = require('express-validator');
const TransactionService = require('../services/transactionService');
const BookingPayment = require('../models/BookingPayment');
const CommissionTransaction = require('../models/CommissionTransaction');
const logger = require('../utils/logger');

/**
 * Process booking payment
 * POST /api/bookings/:id/pay
 */
const processBookingPayment = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { id: bookingId } = req.params;
    const { amount, paymentMethod, paymentTransactionId, pricingDetails } = req.body;
    const userId = req.user.id;

    // Validate transaction data
    const validationErrors = TransactionService.validateTransactionData({
      bookingId,
      amount,
      paymentMethod
    });

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: validationErrors
      });
    }

    // Process the payment
    const result = await TransactionService.processBookingPayment(
      bookingId,
      userId,
      amount,
      paymentMethod,
      paymentTransactionId,
      pricingDetails
    );

    logger.info(`Booking payment processed: ${bookingId} by user: ${userId}`);

    res.status(200).json({
      success: true,
      message: 'Payment processed successfully',
      data: result
    });

  } catch (error) {
    logger.error('Error processing booking payment:', error);
    
    if (error.message.includes('not found') || error.message.includes('not authorized')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('already paid') || error.message.includes('insufficient') || error.message.includes('limit exceeded')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to process payment',
      error: error.message
    });
  }
};

/**
 * Process refund for booking payment
 * POST /api/bookings/:id/refund
 */
const processRefund = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { id: bookingPaymentId } = req.params;
    const { refundAmount, reason } = req.body;
    const userId = req.user.id;

    // Validate refund amount
    if (!refundAmount || refundAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Refund amount must be greater than 0'
      });
    }

    // Process the refund
    const result = await TransactionService.processRefund(bookingPaymentId, refundAmount, reason);

    logger.info(`Refund processed: ${bookingPaymentId} by user: ${userId}`);

    res.status(200).json({
      success: true,
      message: 'Refund processed successfully',
      data: result
    });

  } catch (error) {
    logger.error('Error processing refund:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('must be completed') || error.message.includes('cannot exceed')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to process refund',
      error: error.message
    });
  }
};

/**
 * Get transaction history
 * GET /api/transactions
 */
const getTransactionHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      page = 1,
      limit = 20,
      status,
      paymentMethod,
      startDate,
      endDate
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      status,
      paymentMethod,
      startDate,
      endDate
    };

    const result = await TransactionService.getTransactionHistory(userId, options);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('Error getting transaction history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get transaction history',
      error: error.message
    });
  }
};

/**
 * Get transaction details
 * GET /api/transactions/:id
 */
const getTransactionDetails = async (req, res) => {
  try {
    const { id: transactionId } = req.params;
    const userId = req.user.id;

    const result = await TransactionService.getTransactionDetails(transactionId, userId);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('Error getting transaction details:', error);
    
    if (error.message.includes('not found') || error.message.includes('not authorized')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to get transaction details',
      error: error.message
    });
  }
};

/**
 * Reconcile transactions (Admin only)
 * POST /api/transactions/reconcile
 */
const reconcileTransactions = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { startDate, endDate, status } = req.body;

    const options = {
      startDate,
      endDate,
      status
    };

    const result = await TransactionService.reconcileTransactions(options);

    logger.info(`Transactions reconciled by admin: ${req.user.id}`);

    res.json({
      success: true,
      message: 'Transactions reconciled successfully',
      data: result
    });

  } catch (error) {
    logger.error('Error reconciling transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reconcile transactions',
      error: error.message
    });
  }
};

/**
 * Get transaction statistics
 * GET /api/transactions/statistics
 */
const getTransactionStatistics = async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = '30' } = req.query;

    const result = await TransactionService.getTransactionStatistics(userId, period);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('Error getting transaction statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get transaction statistics',
      error: error.message
    });
  }
};

/**
 * Get commission transactions (Admin only)
 * GET /api/transactions/commissions
 */
const getCommissionTransactions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      transactionType,
      status,
      startDate,
      endDate
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      transactionType,
      status,
      startDate,
      endDate
    };

    const result = await CommissionTransaction.findAll(options);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('Error getting commission transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get commission transactions',
      error: error.message
    });
  }
};

/**
 * Get commission statistics (Admin only)
 * GET /api/transactions/commissions/statistics
 */
const getCommissionStatistics = async (req, res) => {
  try {
    const { period = '30' } = req.query;

    const stats = await CommissionTransaction.getStatistics(period);
    const statsByType = await CommissionTransaction.getStatisticsByType(period);

    const result = {
      overall: stats,
      by_type: statsByType,
      period: period,
      generated_at: new Date()
    };

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('Error getting commission statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get commission statistics',
      error: error.message
    });
  }
};

/**
 * Get booking payment details
 * GET /api/transactions/payments/:id
 */
const getBookingPaymentDetails = async (req, res) => {
  try {
    const { id: paymentId } = req.params;
    const userId = req.user.id;

    const payment = await BookingPayment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    if (payment.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this payment'
      });
    }

    // Get commission transactions
    const commissions = await CommissionTransaction.findByBookingPaymentId(paymentId);

    const result = {
      payment: payment.toJSON(),
      commissions: commissions.map(c => c.toJSON())
    };

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('Error getting booking payment details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment details',
      error: error.message
    });
  }
};

module.exports = {
  processBookingPayment,
  processRefund,
  getTransactionHistory,
  getTransactionDetails,
  reconcileTransactions,
  getTransactionStatistics,
  getCommissionTransactions,
  getCommissionStatistics,
  getBookingPaymentDetails
}; 