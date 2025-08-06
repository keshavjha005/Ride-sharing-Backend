const express = require('express');
const { body, query, param } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');

const router = express.Router();

// Import models directly
const Wallet = require('../models/Wallet');
const WalletTransaction = require('../models/WalletTransaction');
const WalletRechargeRequest = require('../models/WalletRechargeRequest');
const logger = require('../utils/logger');

/**
 * @swagger
 * tags:
 *   name: Wallet
 *   description: Wallet management endpoints
 */

/**
 * @swagger
 * /api/wallet/balance:
 *   get:
 *     summary: Get wallet balance
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wallet balance retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/balance', [
  authenticate
], async (req, res) => {
  try {
    const userId = req.user.id;
    
    let wallet = await Wallet.getByUserId(userId);
    
    if (!wallet) {
      // Create wallet if it doesn't exist
      wallet = await Wallet.create(userId, req.user.currency_code || 'USD');
    }
    
    logger.info(`Wallet balance retrieved for user: ${userId}`);
    
    res.json({
      success: true,
      data: wallet.toJSON()
    });
    
  } catch (error) {
    logger.error('Error getting wallet balance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get wallet balance',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/wallet/transactions:
 *   get:
 *     summary: Get wallet transaction history
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of transactions per page
 *       - in: query
 *         name: transaction_type
 *         schema:
 *           type: string
 *           enum: [credit, debit]
 *         description: Filter by transaction type
 *       - in: query
 *         name: transaction_category
 *         schema:
 *           type: string
 *           enum: [ride_payment, ride_earning, wallet_recharge, withdrawal, refund, commission, bonus]
 *         description: Filter by transaction category
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, completed, failed, cancelled]
 *         description: Filter by transaction status
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter transactions from this date
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter transactions until this date
 *     responses:
 *       200:
 *         description: Transaction history retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/transactions', [
  authenticate,
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('transaction_type').optional().isIn(['credit', 'debit']).withMessage('Invalid transaction type'),
  query('transaction_category').optional().isIn(['ride_payment', 'ride_earning', 'wallet_recharge', 'withdrawal', 'refund', 'commission', 'bonus']).withMessage('Invalid transaction category'),
  query('status').optional().isIn(['pending', 'completed', 'failed', 'cancelled']).withMessage('Invalid status'),
  query('start_date').optional().isISO8601().withMessage('Start date must be a valid date'),
  query('end_date').optional().isISO8601().withMessage('End date must be a valid date'),
  validateRequest
], async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, transaction_type, transaction_category, status, start_date, end_date } = req.query;
    
    const wallet = await Wallet.getByUserId(userId);
    
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found'
      });
    }
    
    const filters = {
      wallet_id: wallet.id,
      transaction_type,
      transaction_category,
      status,
      start_date,
      end_date
    };
    
    const { transactions, total } = await WalletTransaction.getByWalletId(wallet.id, {
      page: parseInt(page),
      limit: parseInt(limit),
      filters
    });
    
    logger.info(`Transaction history retrieved for user: ${userId}`);
    
    res.json({
      success: true,
      data: {
        transactions: transactions.map(t => t.toJSON()),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          total_pages: Math.ceil(total / limit)
        }
      }
    });
    
  } catch (error) {
    logger.error('Error getting transaction history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get transaction history',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/wallet/recharge:
 *   post:
 *     summary: Recharge wallet
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - paymentMethod
 *             properties:
 *               amount:
 *                 type: number
 *                 format: float
 *                 minimum: 0.01
 *               paymentMethod:
 *                 type: string
 *                 enum: [card, bank_transfer, paypal, stripe]
 *               currency:
 *                 type: string
 *                 default: USD
 *     responses:
 *       200:
 *         description: Recharge request created successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 */
router.post('/recharge', [
  authenticate,
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be a positive number'),
  body('paymentMethod')
    .isIn(['card', 'bank_transfer', 'paypal', 'stripe'])
    .withMessage('Invalid payment method'),
  body('currency')
    .optional()
    .isLength({ min: 3, max: 3 })
    .withMessage('Currency must be a 3-letter code'),
  validateRequest
], async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, paymentMethod, currency = 'USD' } = req.body;
    
    // Create recharge request
    const rechargeRequest = await WalletRechargeRequest.create({
      user_id: userId,
      amount: parseFloat(amount),
      payment_method: paymentMethod,
      currency_code: currency
    });
    
    logger.info(`Recharge request created: ${rechargeRequest.id} for user: ${userId}`);
    
    res.json({
      success: true,
      message: 'Recharge request created successfully',
      data: rechargeRequest.toJSON()
    });
    
  } catch (error) {
    logger.error('Error creating recharge request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create recharge request',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/wallet/statistics:
 *   get:
 *     summary: Get wallet statistics
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Period in days for statistics
 *     responses:
 *       200:
 *         description: Wallet statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Wallet not found
 */
router.get('/statistics', [
  authenticate,
  query('period').optional().isInt({ min: 1, max: 365 }).withMessage('Period must be between 1 and 365 days'),
  validateRequest
], async (req, res) => {
  try {
    const userId = req.user.id;
    const period = parseInt(req.query.period) || 30;
    
    const wallet = await Wallet.getByUserId(userId);
    
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found'
      });
    }
    
    const statistics = await wallet.getStatistics(period);
    
    logger.info(`Wallet statistics retrieved for user: ${userId}`);
    
    res.json({
      success: true,
      data: statistics
    });
    
  } catch (error) {
    logger.error('Error getting wallet statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get wallet statistics',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/wallet/limits:
 *   put:
 *     summary: Update wallet limits
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               daily_limit:
 *                 type: number
 *                 format: float
 *                 minimum: 0
 *               monthly_limit:
 *                 type: number
 *                 format: float
 *                 minimum: 0
 *     responses:
 *       200:
 *         description: Wallet limits updated successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Wallet not found
 */
router.put('/limits', [
  authenticate,
  body('daily_limit')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Daily limit must be a non-negative number'),
  body('monthly_limit')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Monthly limit must be a non-negative number'),
  validateRequest
], async (req, res) => {
  try {
    const userId = req.user.id;
    const { daily_limit, monthly_limit } = req.body;
    
    const wallet = await Wallet.getByUserId(userId);
    
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found'
      });
    }
    
    const updateData = {};
    if (daily_limit !== undefined) updateData.daily_limit = parseFloat(daily_limit);
    if (monthly_limit !== undefined) updateData.monthly_limit = parseFloat(monthly_limit);
    
    await wallet.updateLimits(updateData);
    
    logger.info(`Wallet limits updated for user: ${userId}`);
    
    res.json({
      success: true,
      message: 'Wallet limits updated successfully',
      data: wallet.toJSON()
    });
    
  } catch (error) {
    logger.error('Error updating wallet limits:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update wallet limits',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/wallet/recharge-requests:
 *   get:
 *     summary: Get recharge requests
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of requests per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, processing, completed, failed, cancelled]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: Recharge requests retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/recharge-requests', [
  authenticate,
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['pending', 'processing', 'completed', 'failed', 'cancelled']).withMessage('Invalid status'),
  validateRequest
], async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, status } = req.query;
    
    const filters = { user_id: userId };
    if (status) filters.status = status;
    
    const { requests, total } = await WalletRechargeRequest.getByUserId(userId, {
      page: parseInt(page),
      limit: parseInt(limit),
      filters
    });
    
    logger.info(`Recharge requests retrieved for user: ${userId}`);
    
    res.json({
      success: true,
      data: {
        requests: requests.map(r => r.toJSON()),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          total_pages: Math.ceil(total / limit)
        }
      }
    });
    
  } catch (error) {
    logger.error('Error getting recharge requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recharge requests',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/wallet/recharge-requests/{id}/cancel:
 *   post:
 *     summary: Cancel recharge request
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Recharge request ID
 *     responses:
 *       200:
 *         description: Recharge request cancelled successfully
 *       400:
 *         description: Cannot cancel request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Recharge request not found
 */
router.post('/recharge-requests/:id/cancel', [
  authenticate,
  param('id').isUUID().withMessage('Invalid recharge request ID'),
  validateRequest
], async (req, res) => {
  try {
    const userId = req.user.id;
    const requestId = req.params.id;
    
    const rechargeRequest = await WalletRechargeRequest.getById(requestId);
    
    if (!rechargeRequest) {
      return res.status(404).json({
        success: false,
        message: 'Recharge request not found'
      });
    }
    
    if (rechargeRequest.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    await WalletRechargeRequest.cancel(requestId);
    
    logger.info(`Recharge request cancelled: ${requestId} by user: ${userId}`);
    
    res.json({
      success: true,
      message: 'Recharge request cancelled successfully'
    });
    
  } catch (error) {
    logger.error('Error cancelling recharge request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel recharge request',
      error: error.message
    });
  }
});

module.exports = router; 