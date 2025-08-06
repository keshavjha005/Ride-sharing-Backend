const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const paymentController = require('../controllers/paymentController');
const { authenticate } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Validation middleware
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Payment Intent Routes
router.post('/create-intent', [
  authenticate,
  body('amount')
    .isFloat({ min: 0.5 })
    .withMessage('Amount must be at least $0.50'),
  body('currency')
    .optional()
    .isLength({ min: 3, max: 3 })
    .withMessage('Currency must be a 3-letter code'),
  body('paymentMethodId')
    .optional()
    .isString()
    .withMessage('Payment method ID must be a string'),
  body('metadata')
    .optional()
    .isObject()
    .withMessage('Metadata must be an object'),
  validateRequest
], paymentController.createPaymentIntent);

router.post('/confirm', [
  authenticate,
  body('paymentIntentId')
    .isString()
    .withMessage('Payment intent ID is required'),
  body('paymentMethodId')
    .optional()
    .isString()
    .withMessage('Payment method ID must be a string'),
  validateRequest
], paymentController.confirmPayment);

// Payment Methods Routes
router.get('/methods', [
  authenticate,
  query('payment_type')
    .optional()
    .isIn(['card', 'paypal', 'bank_account'])
    .withMessage('Invalid payment type'),
  query('gateway')
    .optional()
    .isIn(['stripe', 'paypal'])
    .withMessage('Invalid gateway'),
  validateRequest
], paymentController.getPaymentMethods);

router.post('/methods', [
  authenticate,
  body('payment_type')
    .isIn(['card', 'paypal', 'bank_account'])
    .withMessage('Valid payment type is required'),
  body('gateway')
    .isIn(['stripe', 'paypal'])
    .withMessage('Valid gateway is required'),
  body('gateway_payment_method_id')
    .isString()
    .withMessage('Gateway payment method ID is required'),
  body('card_last4')
    .optional()
    .isLength({ min: 4, max: 4 })
    .withMessage('Card last 4 digits must be exactly 4 characters'),
  body('card_brand')
    .optional()
    .isString()
    .withMessage('Card brand must be a string'),
  body('card_exp_month')
    .optional()
    .isInt({ min: 1, max: 12 })
    .withMessage('Card expiration month must be between 1 and 12'),
  body('card_exp_year')
    .optional()
    .isInt({ min: new Date().getFullYear() })
    .withMessage('Card expiration year must be current year or later'),
  body('is_default')
    .optional()
    .isBoolean()
    .withMessage('is_default must be a boolean'),
  validateRequest
], paymentController.addPaymentMethod);

router.put('/methods/:id', [
  authenticate,
  param('id')
    .isUUID()
    .withMessage('Invalid payment method ID'),
  body('is_default')
    .optional()
    .isBoolean()
    .withMessage('is_default must be a boolean'),
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean'),
  validateRequest
], paymentController.updatePaymentMethod);

router.delete('/methods/:id', [
  authenticate,
  param('id')
    .isUUID()
    .withMessage('Invalid payment method ID'),
  validateRequest
], paymentController.removePaymentMethod);

router.put('/methods/:id/set-default', [
  authenticate,
  param('id')
    .isUUID()
    .withMessage('Invalid payment method ID'),
  validateRequest
], paymentController.setDefaultPaymentMethod);

// Payment Transactions Routes
router.get('/transactions', [
  authenticate,
  query('status')
    .optional()
    .isIn(['pending', 'processing', 'succeeded', 'failed', 'cancelled'])
    .withMessage('Invalid status'),
  query('gateway')
    .optional()
    .isIn(['stripe', 'paypal'])
    .withMessage('Invalid gateway'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be a non-negative integer'),
  validateRequest
], paymentController.getPaymentTransactions);

router.get('/transactions/:id', [
  authenticate,
  param('id')
    .isUUID()
    .withMessage('Invalid transaction ID'),
  validateRequest
], paymentController.getPaymentTransaction);

// Payment Statistics Routes
router.get('/statistics', [
  authenticate,
  query('period')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Period must be between 1 and 365 days'),
  validateRequest
], paymentController.getPaymentStatistics);

// Webhook Routes (no authentication required)
router.post('/webhook/stripe', [
  // Note: No authentication for webhooks as they come from Stripe
  // Validation is handled by signature verification in the controller
], paymentController.handleStripeWebhook);

// Error handling middleware
router.use((error, req, res, next) => {
  logger.error('Payment route error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

module.exports = router; 