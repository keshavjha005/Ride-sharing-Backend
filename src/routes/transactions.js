const express = require('express');
const { body, param, query } = require('express-validator');
const transactionController = require('../controllers/transactionController');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     BookingPayment:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         booking_id:
 *           type: string
 *           format: uuid
 *         user_id:
 *           type: string
 *           format: uuid
 *         amount:
 *           type: number
 *           format: decimal
 *         payment_method:
 *           type: string
 *           enum: [wallet, card, paypal]
 *         status:
 *           type: string
 *           enum: [pending, processing, completed, failed, refunded]
 *         admin_commission_amount:
 *           type: number
 *           format: decimal
 *         driver_earning_amount:
 *           type: number
 *           format: decimal
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *     
 *     CommissionTransaction:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         booking_payment_id:
 *           type: string
 *           format: uuid
 *         commission_amount:
 *           type: number
 *           format: decimal
 *         commission_percentage:
 *           type: number
 *           format: decimal
 *         transaction_type:
 *           type: string
 *           enum: [booking_commission, withdrawal_fee]
 *         status:
 *           type: string
 *           enum: [pending, collected, refunded]
 *         created_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/bookings/{id}/pay:
 *   post:
 *     summary: Process booking payment
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Booking ID
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
 *                 format: decimal
 *                 minimum: 0.01
 *                 description: Payment amount
 *               paymentMethod:
 *                 type: string
 *                 enum: [wallet, card, paypal]
 *                 description: Payment method
 *               paymentTransactionId:
 *                 type: string
 *                 format: uuid
 *                 description: Payment transaction ID (for card/paypal payments)
 *               pricingDetails:
 *                 type: object
 *                 description: Pricing calculation details
 *     responses:
 *       200:
 *         description: Payment processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     payment:
 *                       $ref: '#/components/schemas/BookingPayment'
 *                     walletTransaction:
 *                       type: object
 *                     commission:
 *                       $ref: '#/components/schemas/CommissionTransaction'
 *       400:
 *         description: Validation error or business logic error
 *       404:
 *         description: Booking not found
 *       500:
 *         description: Internal server error
 */
router.post('/bookings/:id/pay',
  authenticate,
  [
    param('id').isUUID().withMessage('Invalid booking ID'),
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
    body('paymentMethod').isIn(['wallet', 'card', 'paypal']).withMessage('Invalid payment method'),
    body('paymentTransactionId').optional().isUUID().withMessage('Invalid payment transaction ID'),
    body('pricingDetails').optional().isObject().withMessage('Pricing details must be an object')
  ],
  transactionController.processBookingPayment
);

/**
 * @swagger
 * /api/bookings/{id}/refund:
 *   post:
 *     summary: Process refund for booking payment
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Booking payment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refundAmount
 *             properties:
 *               refundAmount:
 *                 type: number
 *                 format: decimal
 *                 minimum: 0.01
 *                 description: Refund amount
 *               reason:
 *                 type: string
 *                 description: Refund reason
 *     responses:
 *       200:
 *         description: Refund processed successfully
 *       400:
 *         description: Validation error or business logic error
 *       404:
 *         description: Payment not found
 *       500:
 *         description: Internal server error
 */
router.post('/bookings/:id/refund',
  authenticate,
  [
    param('id').isUUID().withMessage('Invalid booking payment ID'),
    body('refundAmount').isFloat({ min: 0.01 }).withMessage('Refund amount must be greater than 0'),
    body('reason').optional().isString().withMessage('Reason must be a string')
  ],
  transactionController.processRefund
);

/**
 * @swagger
 * /api/transactions:
 *   get:
 *     summary: Get transaction history
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, processing, completed, failed, refunded]
 *         description: Filter by status
 *       - in: query
 *         name: paymentMethod
 *         schema:
 *           type: string
 *           enum: [wallet, card, paypal]
 *         description: Filter by payment method
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by start date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by end date
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
 *                     payments:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/BookingPayment'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *       500:
 *         description: Internal server error
 */
router.get('/transactions',
  authenticate,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('status').optional().isIn(['pending', 'processing', 'completed', 'failed', 'refunded']).withMessage('Invalid status'),
    query('paymentMethod').optional().isIn(['wallet', 'card', 'paypal']).withMessage('Invalid payment method'),
    query('startDate').optional().isISO8601().withMessage('Invalid start date'),
    query('endDate').optional().isISO8601().withMessage('Invalid end date')
  ],
  transactionController.getTransactionHistory
);

/**
 * @swagger
 * /api/transactions/{id}:
 *   get:
 *     summary: Get transaction details
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Transaction ID
 *     responses:
 *       200:
 *         description: Transaction details retrieved successfully
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
 *                     payment:
 *                       $ref: '#/components/schemas/BookingPayment'
 *                     commissions:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/CommissionTransaction'
 *                     walletTransaction:
 *                       type: object
 *       404:
 *         description: Transaction not found
 *       500:
 *         description: Internal server error
 */
router.get('/transactions/:id',
  authenticate,
  [
    param('id').isUUID().withMessage('Invalid transaction ID')
  ],
  transactionController.getTransactionDetails
);

/**
 * @swagger
 * /api/transactions/reconcile:
 *   post:
 *     summary: Reconcile transactions (Admin only)
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 description: Start date for reconciliation
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 description: End date for reconciliation
 *               status:
 *                 type: string
 *                 enum: [pending, processing, completed, failed, refunded]
 *                 description: Filter by status
 *     responses:
 *       200:
 *         description: Transactions reconciled successfully
 *       500:
 *         description: Internal server error
 */
router.post('/transactions/reconcile',
  authenticate,
  [
    body('startDate').optional().isISO8601().withMessage('Invalid start date'),
    body('endDate').optional().isISO8601().withMessage('Invalid end date'),
    body('status').optional().isIn(['pending', 'processing', 'completed', 'failed', 'refunded']).withMessage('Invalid status')
  ],
  transactionController.reconcileTransactions
);

/**
 * @swagger
 * /api/transactions/statistics:
 *   get:
 *     summary: Get transaction statistics
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           default: '30'
 *         description: Period in days
 *     responses:
 *       200:
 *         description: Transaction statistics retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get('/transactions/statistics',
  authenticate,
  [
    query('period').optional().isInt({ min: 1 }).withMessage('Period must be a positive integer')
  ],
  transactionController.getTransactionStatistics
);

/**
 * @swagger
 * /api/transactions/commissions:
 *   get:
 *     summary: Get commission transactions (Admin only)
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of items per page
 *       - in: query
 *         name: transactionType
 *         schema:
 *           type: string
 *           enum: [booking_commission, withdrawal_fee]
 *         description: Filter by transaction type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, collected, refunded]
 *         description: Filter by status
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by start date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by end date
 *     responses:
 *       200:
 *         description: Commission transactions retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get('/transactions/commissions',
  authenticate,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('transactionType').optional().isIn(['booking_commission', 'withdrawal_fee']).withMessage('Invalid transaction type'),
    query('status').optional().isIn(['pending', 'collected', 'refunded']).withMessage('Invalid status'),
    query('startDate').optional().isISO8601().withMessage('Invalid start date'),
    query('endDate').optional().isISO8601().withMessage('Invalid end date')
  ],
  transactionController.getCommissionTransactions
);

/**
 * @swagger
 * /api/transactions/commissions/statistics:
 *   get:
 *     summary: Get commission statistics (Admin only)
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           default: '30'
 *         description: Period in days
 *     responses:
 *       200:
 *         description: Commission statistics retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get('/transactions/commissions/statistics',
  authenticate,
  [
    query('period').optional().isInt({ min: 1 }).withMessage('Period must be a positive integer')
  ],
  transactionController.getCommissionStatistics
);

/**
 * @swagger
 * /api/transactions/payments/{id}:
 *   get:
 *     summary: Get booking payment details
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Payment ID
 *     responses:
 *       200:
 *         description: Payment details retrieved successfully
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
 *                     payment:
 *                       $ref: '#/components/schemas/BookingPayment'
 *                     commissions:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/CommissionTransaction'
 *       404:
 *         description: Payment not found
 *       500:
 *         description: Internal server error
 */
router.get('/transactions/payments/:id',
  authenticate,
  [
    param('id').isUUID().withMessage('Invalid payment ID')
  ],
  transactionController.getBookingPaymentDetails
);

module.exports = router; 