const Wallet = require('../models/Wallet');
const WalletTransaction = require('../models/WalletTransaction');
const WalletRechargeRequest = require('../models/WalletRechargeRequest');
const PaymentService = require('../services/paymentService');
const PaymentMethod = require('../models/PaymentMethod');
const logger = require('../utils/logger');

/**
 * @swagger
 * components:
 *   schemas:
 *     Wallet:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         user_id:
 *           type: string
 *           format: uuid
 *         balance:
 *           type: number
 *           format: float
 *         currency_code:
 *           type: string
 *         is_active:
 *           type: boolean
 *         daily_limit:
 *           type: number
 *           format: float
 *         monthly_limit:
 *           type: number
 *           format: float
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *     WalletTransaction:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         wallet_id:
 *           type: string
 *           format: uuid
 *         transaction_type:
 *           type: string
 *           enum: [credit, debit]
 *         amount:
 *           type: number
 *           format: float
 *         balance_before:
 *           type: number
 *           format: float
 *         balance_after:
 *           type: number
 *           format: float
 *         transaction_category:
 *           type: string
 *           enum: [ride_payment, ride_earning, wallet_recharge, withdrawal, refund, commission, bonus]
 *         reference_id:
 *           type: string
 *           format: uuid
 *         reference_type:
 *           type: string
 *         description:
 *           type: string
 *         status:
 *           type: string
 *           enum: [pending, completed, failed, cancelled]
 *         created_at:
 *           type: string
 *           format: date-time
 *     WalletRechargeRequest:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         user_id:
 *           type: string
 *           format: uuid
 *         amount:
 *           type: number
 *           format: float
 *         payment_method:
 *           type: string
 *           enum: [card, bank_transfer, paypal, stripe]
 *         payment_gateway:
 *           type: string
 *         gateway_transaction_id:
 *           type: string
 *         status:
 *           type: string
 *           enum: [pending, processing, completed, failed, cancelled]
 *         failure_reason:
 *           type: string
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Wallet'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Wallet not found
 */
const getWalletBalance = async (req, res) => {
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
};

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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     transactions:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/WalletTransaction'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         total_pages:
 *                           type: integer
 *       401:
 *         description: Unauthorized
 */
const getTransactionHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    
    // Build options object
    const options = {
      limit,
      offset,
      transaction_type: req.query.transaction_type,
      transaction_category: req.query.transaction_category,
      status: req.query.status,
      start_date: req.query.start_date,
      end_date: req.query.end_date
    };
    
    // Remove undefined values
    Object.keys(options).forEach(key => {
      if (options[key] === undefined) {
        delete options[key];
      }
    });
    
    const transactions = await WalletTransaction.getByUserId(userId, options);
    
    // Get total count for pagination
    const totalOptions = { ...options };
    delete totalOptions.limit;
    delete totalOptions.offset;
    const allTransactions = await WalletTransaction.getByUserId(userId, totalOptions);
    const total = allTransactions.length;
    
    logger.info(`Transaction history retrieved for user: ${userId}`);
    
    res.json({
      success: true,
      data: {
        transactions: transactions.map(t => t.toJSON()),
        pagination: {
          page,
          limit,
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
};

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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     rechargeId:
 *                       type: string
 *                       format: uuid
 *                     amount:
 *                       type: number
 *                       format: float
 *                     paymentUrl:
 *                       type: string
 *                       format: uri
 *                     expiresAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 */
const rechargeWallet = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, paymentMethod, currency = 'USD', paymentMethodId } = req.body;
    
    // Validate input
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be a positive number'
      });
    }
    
    if (!paymentMethod || !['card', 'bank_transfer', 'paypal', 'stripe'].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment method'
      });
    }
    
    // Create recharge request
    const rechargeRequest = await WalletRechargeRequest.create({
      user_id: userId,
      amount: parseFloat(amount),
      payment_method: paymentMethod,
      payment_gateway: paymentMethod === 'stripe' ? 'stripe' : paymentMethod
    });
    
    let responseData = {
      rechargeId: rechargeRequest.id,
      amount: rechargeRequest.amount,
      currency: currency
    };
    
    // If payment method ID is provided and it's a Stripe payment, process it
    if (paymentMethodId && paymentMethod === 'stripe') {
      try {
        // Verify payment method belongs to user
        const userPaymentMethod = await PaymentMethod.getById(paymentMethodId);
        if (!userPaymentMethod || userPaymentMethod.user_id !== userId) {
          return res.status(400).json({
            success: false,
            message: 'Invalid payment method'
          });
        }
        
        // Process wallet recharge with payment
        const paymentResult = await PaymentService.processWalletRecharge(rechargeRequest.id, paymentMethodId);
        
        responseData = {
          ...responseData,
          paymentTransactionId: paymentResult.paymentTransactionId,
          paymentIntentId: paymentResult.paymentIntentId,
          clientSecret: paymentResult.clientSecret,
          requiresAction: paymentResult.requiresAction,
          nextAction: paymentResult.nextAction
        };
        
        logger.info(`Wallet recharge processed with payment: ${rechargeRequest.id} for user: ${userId}`);
        
      } catch (paymentError) {
        logger.error('Error processing payment for recharge:', paymentError);
        return res.status(500).json({
          success: false,
          message: 'Failed to process payment',
          error: paymentError.message
        });
      }
    } else {
      // For non-Stripe payments or when no payment method is provided
      const paymentUrl = `https://payment.gateway.com/pay/${rechargeRequest.id}`;
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now
      
      responseData = {
        ...responseData,
        paymentUrl,
        expiresAt: expiresAt.toISOString()
      };
      
      logger.info(`Wallet recharge request created: ${rechargeRequest.id} for user: ${userId}`);
    }
    
    res.json({
      success: true,
      data: responseData
    });
    
  } catch (error) {
    logger.error('Error creating recharge request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create recharge request',
      error: error.message
    });
  }
};

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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     wallet:
 *                       $ref: '#/components/schemas/Wallet'
 *                     statistics:
 *                       type: object
 *                       properties:
 *                         total_transactions:
 *                           type: integer
 *                         total_credits:
 *                           type: number
 *                           format: float
 *                         total_debits:
 *                           type: number
 *                           format: float
 *                         net_amount:
 *                           type: number
 *                           format: float
 *                         pending_transactions:
 *                           type: integer
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Wallet not found
 */
const getWalletStatistics = async (req, res) => {
  try {
    const userId = req.user.id;
    const period = parseInt(req.query.period) || 30;
    
    let wallet = await Wallet.getByUserId(userId);
    
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found'
      });
    }
    
    const statistics = await Wallet.getStatistics(wallet.id, period);
    
    logger.info(`Wallet statistics retrieved for user: ${userId}`);
    
    res.json({
      success: true,
      data: {
        wallet: wallet.toJSON(),
        statistics
      }
    });
    
  } catch (error) {
    logger.error('Error getting wallet statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get wallet statistics',
      error: error.message
    });
  }
};

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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Wallet not found
 */
const updateWalletLimits = async (req, res) => {
  try {
    const userId = req.user.id;
    const { daily_limit, monthly_limit } = req.body;
    
    // Validate input
    if (daily_limit !== undefined && (isNaN(daily_limit) || daily_limit < 0)) {
      return res.status(400).json({
        success: false,
        message: 'Daily limit must be a non-negative number'
      });
    }
    
    if (monthly_limit !== undefined && (isNaN(monthly_limit) || monthly_limit < 0)) {
      return res.status(400).json({
        success: false,
        message: 'Monthly limit must be a non-negative number'
      });
    }
    
    let wallet = await Wallet.getByUserId(userId);
    
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found'
      });
    }
    
    await Wallet.updateLimits(wallet.id, daily_limit, monthly_limit);
    
    logger.info(`Wallet limits updated for user: ${userId}`);
    
    res.json({
      success: true,
      message: 'Wallet limits updated successfully'
    });
    
  } catch (error) {
    logger.error('Error updating wallet limits:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update wallet limits',
      error: error.message
    });
  }
};

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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     requests:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/WalletRechargeRequest'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         total_pages:
 *                           type: integer
 *       401:
 *         description: Unauthorized
 */
const getRechargeRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    
    const options = {
      limit,
      offset,
      status: req.query.status
    };
    
    // Remove undefined values
    Object.keys(options).forEach(key => {
      if (options[key] === undefined) {
        delete options[key];
      }
    });
    
    const requests = await WalletRechargeRequest.getByUserId(userId, options);
    
    // Get total count for pagination
    const totalOptions = { ...options };
    delete totalOptions.limit;
    delete totalOptions.offset;
    const allRequests = await WalletRechargeRequest.getByUserId(userId, totalOptions);
    const total = allRequests.length;
    
    logger.info(`Recharge requests retrieved for user: ${userId}`);
    
    res.json({
      success: true,
      data: {
        requests: requests.map(r => r.toJSON()),
        pagination: {
          page,
          limit,
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
};

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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Cannot cancel request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Recharge request not found
 */
const cancelRechargeRequest = async (req, res) => {
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
};

module.exports = {
  getWalletBalance,
  getTransactionHistory,
  rechargeWallet,
  getWalletStatistics,
  updateWalletLimits,
  getRechargeRequests,
  cancelRechargeRequest
}; 