const PaymentService = require('../services/paymentService');
const PaymentMethod = require('../models/PaymentMethod');
const PaymentTransaction = require('../models/PaymentTransaction');
const logger = require('../utils/logger');

/**
 * @swagger
 * /api/payments/create-intent:
 *   post:
 *     summary: Create payment intent
 *     tags: [Payments]
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
 *             properties:
 *               amount:
 *                 type: number
 *                 format: float
 *                 minimum: 0.5
 *               currency:
 *                 type: string
 *                 default: USD
 *               paymentMethodId:
 *                 type: string
 *               metadata:
 *                 type: object
 *     responses:
 *       200:
 *         description: Payment intent created successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 */
const createPaymentIntent = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, currency = 'USD', paymentMethodId, metadata = {} } = req.body;
    
    // Validate input
    if (!amount || amount < 0.5) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be at least $0.50'
      });
    }
    
    // Create payment intent
    const paymentIntent = await PaymentService.createStripePaymentIntent({
      amount: parseFloat(amount),
      currency,
      paymentMethodId,
      metadata: {
        ...metadata,
        user_id: userId
      }
    });
    
    logger.info(`Payment intent created for user: ${userId}, amount: ${amount}`);
    
    res.json({
      success: true,
      data: paymentIntent
    });
    
  } catch (error) {
    logger.error('Error creating payment intent:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment intent',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/payments/confirm:
 *   post:
 *     summary: Confirm payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentIntentId
 *             properties:
 *               paymentIntentId:
 *                 type: string
 *               paymentMethodId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment confirmed successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 */
const confirmPayment = async (req, res) => {
  try {
    const { paymentIntentId, paymentMethodId } = req.body;
    
    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        message: 'Payment intent ID is required'
      });
    }
    
    // Confirm payment
    const result = await PaymentService.confirmStripePayment(paymentIntentId, paymentMethodId);
    
    logger.info(`Payment confirmed: ${paymentIntentId}, success: ${result.success}`);
    
    res.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    logger.error('Error confirming payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm payment',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/payments/methods:
 *   get:
 *     summary: Get payment methods
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: payment_type
 *         schema:
 *           type: string
 *           enum: [card, paypal, bank_account]
 *       - in: query
 *         name: gateway
 *         schema:
 *           type: string
 *           enum: [stripe, paypal]
 *     responses:
 *       200:
 *         description: Payment methods retrieved successfully
 *       401:
 *         description: Unauthorized
 */
const getPaymentMethods = async (req, res) => {
  try {
    const userId = req.user.id;
    const { payment_type, gateway } = req.query;
    
    const options = {};
    if (payment_type) options.payment_type = payment_type;
    if (gateway) options.gateway = gateway;
    
    const paymentMethods = await PaymentMethod.getByUserId(userId, options);
    
    res.json({
      success: true,
      data: paymentMethods.map(method => method.toPublicJSON())
    });
    
  } catch (error) {
    logger.error('Error getting payment methods:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment methods',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/payments/methods:
 *   post:
 *     summary: Add payment method
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - payment_type
 *               - gateway
 *               - gateway_payment_method_id
 *             properties:
 *               payment_type:
 *                 type: string
 *                 enum: [card, paypal, bank_account]
 *               gateway:
 *                 type: string
 *                 enum: [stripe, paypal]
 *               gateway_payment_method_id:
 *                 type: string
 *               card_last4:
 *                 type: string
 *               card_brand:
 *                 type: string
 *               card_exp_month:
 *                 type: integer
 *               card_exp_year:
 *                 type: integer
 *               is_default:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Payment method added successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 */
const addPaymentMethod = async (req, res) => {
  try {
    const userId = req.user.id;
    const paymentMethodData = {
      ...req.body,
      user_id: userId
    };
    
    // Validate payment method data
    const errors = PaymentMethod.validate(paymentMethodData);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment method data',
        errors
      });
    }
    
    // Create payment method
    const paymentMethod = await PaymentMethod.create(paymentMethodData);
    
    logger.info(`Payment method added for user: ${userId}, type: ${paymentMethod.payment_type}`);
    
    res.json({
      success: true,
      data: paymentMethod.toPublicJSON()
    });
    
  } catch (error) {
    logger.error('Error adding payment method:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add payment method',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/payments/methods/{id}:
 *   put:
 *     summary: Update payment method
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               is_default:
 *                 type: boolean
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Payment method updated successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Payment method not found
 */
const updatePaymentMethod = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const updates = req.body;
    
    // Get payment method and verify ownership
    const paymentMethod = await PaymentMethod.getById(id);
    if (!paymentMethod) {
      return res.status(404).json({
        success: false,
        message: 'Payment method not found'
      });
    }
    
    if (paymentMethod.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    // Update payment method
    const updatedMethod = await PaymentMethod.update(id, updates);
    
    logger.info(`Payment method updated: ${id} for user: ${userId}`);
    
    res.json({
      success: true,
      data: updatedMethod.toPublicJSON()
    });
    
  } catch (error) {
    logger.error('Error updating payment method:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update payment method',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/payments/methods/{id}:
 *   delete:
 *     summary: Remove payment method
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Payment method removed successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Payment method not found
 */
const removePaymentMethod = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    
    // Get payment method and verify ownership
    const paymentMethod = await PaymentMethod.getById(id);
    if (!paymentMethod) {
      return res.status(404).json({
        success: false,
        message: 'Payment method not found'
      });
    }
    
    if (paymentMethod.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    // Delete from Stripe if it's a Stripe payment method
    if (paymentMethod.gateway === 'stripe') {
      try {
        await PaymentService.deleteStripePaymentMethod(paymentMethod.gateway_payment_method_id);
      } catch (error) {
        logger.warn(`Failed to delete Stripe payment method: ${error.message}`);
      }
    }
    
    // Delete from database
    await PaymentMethod.delete(id);
    
    logger.info(`Payment method removed: ${id} for user: ${userId}`);
    
    res.json({
      success: true,
      message: 'Payment method removed successfully'
    });
    
  } catch (error) {
    logger.error('Error removing payment method:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove payment method',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/payments/methods/{id}/set-default:
 *   put:
 *     summary: Set payment method as default
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Payment method set as default successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Payment method not found
 */
const setDefaultPaymentMethod = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    
    // Get payment method and verify ownership
    const paymentMethod = await PaymentMethod.getById(id);
    if (!paymentMethod) {
      return res.status(404).json({
        success: false,
        message: 'Payment method not found'
      });
    }
    
    if (paymentMethod.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    // Set as default
    const updatedMethod = await PaymentMethod.setAsDefault(id);
    
    logger.info(`Payment method set as default: ${id} for user: ${userId}`);
    
    res.json({
      success: true,
      data: updatedMethod.toPublicJSON()
    });
    
  } catch (error) {
    logger.error('Error setting default payment method:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set default payment method',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/payments/transactions:
 *   get:
 *     summary: Get payment transactions
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, processing, succeeded, failed, cancelled]
 *       - in: query
 *         name: gateway
 *         schema:
 *           type: string
 *           enum: [stripe, paypal]
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: Payment transactions retrieved successfully
 *       401:
 *         description: Unauthorized
 */
const getPaymentTransactions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, gateway, limit = 50, offset = 0 } = req.query;
    
    const options = {
      limit: parseInt(limit),
      offset: parseInt(offset)
    };
    
    if (status) options.status = status;
    if (gateway) options.gateway = gateway;
    
    const transactions = await PaymentTransaction.getByUserId(userId, options);
    
    res.json({
      success: true,
      data: transactions.map(transaction => transaction.toPublicJSON())
    });
    
  } catch (error) {
    logger.error('Error getting payment transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment transactions',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/payments/transactions/{id}:
 *   get:
 *     summary: Get payment transaction details
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Payment transaction details retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Payment transaction not found
 */
const getPaymentTransaction = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    
    const transaction = await PaymentTransaction.getById(id);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Payment transaction not found'
      });
    }
    
    if (transaction.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    res.json({
      success: true,
      data: transaction.toPublicJSON()
    });
    
  } catch (error) {
    logger.error('Error getting payment transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment transaction',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/payments/webhook/stripe:
 *   post:
 *     summary: Stripe webhook handler
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *       400:
 *         description: Invalid webhook signature
 */
const handleStripeWebhook = async (req, res) => {
  try {
    const signature = req.headers['stripe-signature'];
    
    if (!signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing Stripe signature'
      });
    }
    
    // Verify webhook signature
    const event = PaymentService.verifyStripeWebhookSignature(req.body, signature);
    
    // Process webhook event
    await PaymentService.processStripeWebhook(event);
    
    logger.info(`Stripe webhook processed: ${event.type}`);
    
    res.json({
      success: true,
      message: 'Webhook processed successfully'
    });
    
  } catch (error) {
    logger.error('Error processing Stripe webhook:', error);
    res.status(400).json({
      success: false,
      message: 'Webhook processing failed',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/payments/statistics:
 *   get:
 *     summary: Get payment statistics
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           default: 30
 *           description: Number of days to include in statistics
 *     responses:
 *       200:
 *         description: Payment statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 */
const getPaymentStatistics = async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = '30' } = req.query;
    
    const statistics = await PaymentTransaction.getStatistics(userId, period);
    
    res.json({
      success: true,
      data: statistics
    });
    
  } catch (error) {
    logger.error('Error getting payment statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment statistics',
      error: error.message
    });
  }
};

module.exports = {
  createPaymentIntent,
  confirmPayment,
  getPaymentMethods,
  addPaymentMethod,
  updatePaymentMethod,
  removePaymentMethod,
  setDefaultPaymentMethod,
  getPaymentTransactions,
  getPaymentTransaction,
  handleStripeWebhook,
  getPaymentStatistics
}; 