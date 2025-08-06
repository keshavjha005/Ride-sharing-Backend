const express = require('express');
const { body, param, query } = require('express-validator');
const withdrawalController = require('../controllers/withdrawalController');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     WithdrawalRequest:
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
 *           format: decimal
 *         withdrawal_method:
 *           type: string
 *           enum: [bank_transfer, paypal, stripe]
 *         account_details:
 *           type: object
 *         status:
 *           type: string
 *           enum: [pending, approved, processing, completed, rejected, cancelled]
 *         admin_notes:
 *           type: string
 *         processed_at:
 *           type: string
 *           format: date-time
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *     
 *     PayoutTransaction:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         withdrawal_request_id:
 *           type: string
 *           format: uuid
 *         gateway:
 *           type: string
 *         gateway_payout_id:
 *           type: string
 *         amount:
 *           type: number
 *           format: decimal
 *         fee_amount:
 *           type: number
 *           format: decimal
 *         net_amount:
 *           type: number
 *           format: decimal
 *         status:
 *           type: string
 *           enum: [pending, processing, completed, failed]
 *         failure_reason:
 *           type: string
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *     
 *     WithdrawalMethod:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         user_id:
 *           type: string
 *           format: uuid
 *         method_type:
 *           type: string
 *           enum: [bank_transfer, paypal, stripe]
 *         account_name:
 *           type: string
 *         account_details:
 *           type: object
 *         is_default:
 *           type: boolean
 *         is_active:
 *           type: boolean
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/withdrawals/request:
 *   post:
 *     summary: Create withdrawal request
 *     tags: [Withdrawals]
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
 *               - withdrawalMethod
 *               - accountDetails
 *             properties:
 *               amount:
 *                 type: number
 *                 format: decimal
 *                 minimum: 10.00
 *                 description: Withdrawal amount
 *               withdrawalMethod:
 *                 type: string
 *                 enum: [bank_transfer, paypal, stripe]
 *                 description: Withdrawal method
 *               accountDetails:
 *                 type: object
 *                 description: Account details for the withdrawal method
 *     responses:
 *       201:
 *         description: Withdrawal request created successfully
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
 *                   $ref: '#/components/schemas/WithdrawalRequest'
 *       400:
 *         description: Validation error or business logic error
 *       500:
 *         description: Internal server error
 */
router.post('/request',
  authenticate,
  [
    body('amount').isFloat({ min: 10.00 }).withMessage('Amount must be at least $10.00'),
    body('withdrawalMethod').isIn(['bank_transfer', 'paypal', 'stripe']).withMessage('Invalid withdrawal method'),
    body('accountDetails').isObject().withMessage('Account details must be an object')
  ],
  withdrawalController.createWithdrawalRequest
);

/**
 * @swagger
 * /api/withdrawals/requests:
 *   get:
 *     summary: Get withdrawal requests for user
 *     tags: [Withdrawals]
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
 *           enum: [pending, approved, processing, completed, rejected, cancelled]
 *         description: Filter by status
 *       - in: query
 *         name: withdrawal_method
 *         schema:
 *           type: string
 *           enum: [bank_transfer, paypal, stripe]
 *         description: Filter by withdrawal method
 *     responses:
 *       200:
 *         description: Withdrawal requests retrieved successfully
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
 *                     withdrawalRequests:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/WithdrawalRequest'
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
router.get('/requests',
  authenticate,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('status').optional().isIn(['pending', 'approved', 'processing', 'completed', 'rejected', 'cancelled']).withMessage('Invalid status'),
    query('withdrawal_method').optional().isIn(['bank_transfer', 'paypal', 'stripe']).withMessage('Invalid withdrawal method')
  ],
  withdrawalController.getWithdrawalRequests
);

/**
 * @swagger
 * /api/withdrawals/requests/{id}:
 *   get:
 *     summary: Get withdrawal request details
 *     tags: [Withdrawals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Withdrawal request ID
 *     responses:
 *       200:
 *         description: Withdrawal request details retrieved successfully
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
 *                     withdrawalRequest:
 *                       $ref: '#/components/schemas/WithdrawalRequest'
 *                     payoutTransactions:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/PayoutTransaction'
 *       404:
 *         description: Withdrawal request not found
 *       403:
 *         description: Not authorized to view this withdrawal request
 *       500:
 *         description: Internal server error
 */
router.get('/requests/:id',
  authenticate,
  [
    param('id').isUUID().withMessage('Invalid withdrawal request ID')
  ],
  withdrawalController.getWithdrawalRequestDetails
);

/**
 * @swagger
 * /api/withdrawals/requests/{id}/approve:
 *   put:
 *     summary: Approve withdrawal request (Admin only)
 *     tags: [Withdrawals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Withdrawal request ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               adminNotes:
 *                 type: string
 *                 description: Admin notes for the approval
 *     responses:
 *       200:
 *         description: Withdrawal request approved successfully
 *       404:
 *         description: Withdrawal request not found or not in pending status
 *       500:
 *         description: Internal server error
 */
router.put('/requests/:id/approve',
  authenticate,
  [
    param('id').isUUID().withMessage('Invalid withdrawal request ID'),
    body('adminNotes').optional().isString().withMessage('Admin notes must be a string')
  ],
  withdrawalController.approveWithdrawalRequest
);

/**
 * @swagger
 * /api/withdrawals/requests/{id}/reject:
 *   put:
 *     summary: Reject withdrawal request (Admin only)
 *     tags: [Withdrawals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Withdrawal request ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               adminNotes:
 *                 type: string
 *                 description: Admin notes for the rejection
 *     responses:
 *       200:
 *         description: Withdrawal request rejected successfully
 *       404:
 *         description: Withdrawal request not found or not in pending status
 *       500:
 *         description: Internal server error
 */
router.put('/requests/:id/reject',
  authenticate,
  [
    param('id').isUUID().withMessage('Invalid withdrawal request ID'),
    body('adminNotes').optional().isString().withMessage('Admin notes must be a string')
  ],
  withdrawalController.rejectWithdrawalRequest
);

/**
 * @swagger
 * /api/withdrawals/requests/{id}/cancel:
 *   put:
 *     summary: Cancel withdrawal request (Admin only)
 *     tags: [Withdrawals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Withdrawal request ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               adminNotes:
 *                 type: string
 *                 description: Admin notes for the cancellation
 *     responses:
 *       200:
 *         description: Withdrawal request cancelled successfully
 *       404:
 *         description: Withdrawal request not found or cannot be cancelled
 *       500:
 *         description: Internal server error
 */
router.put('/requests/:id/cancel',
  authenticate,
  [
    param('id').isUUID().withMessage('Invalid withdrawal request ID'),
    body('adminNotes').optional().isString().withMessage('Admin notes must be a string')
  ],
  withdrawalController.cancelWithdrawalRequest
);

/**
 * @swagger
 * /api/withdrawals/methods:
 *   get:
 *     summary: Get withdrawal methods for user
 *     tags: [Withdrawals]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Withdrawal methods retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/WithdrawalMethod'
 *       500:
 *         description: Internal server error
 */
router.get('/methods',
  authenticate,
  withdrawalController.getWithdrawalMethods
);

/**
 * @swagger
 * /api/withdrawals/methods:
 *   post:
 *     summary: Add withdrawal method for user
 *     tags: [Withdrawals]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - method_type
 *               - account_name
 *               - account_details
 *             properties:
 *               method_type:
 *                 type: string
 *                 enum: [bank_transfer, paypal, stripe]
 *                 description: Withdrawal method type
 *               account_name:
 *                 type: string
 *                 description: Name for this withdrawal method
 *               account_details:
 *                 type: object
 *                 description: Account details for the withdrawal method
 *               is_default:
 *                 type: boolean
 *                 default: false
 *                 description: Whether this should be the default method
 *     responses:
 *       201:
 *         description: Withdrawal method added successfully
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
 *                   $ref: '#/components/schemas/WithdrawalMethod'
 *       400:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 */
router.post('/methods',
  authenticate,
  [
    body('method_type').isIn(['bank_transfer', 'paypal', 'stripe']).withMessage('Invalid method type'),
    body('account_name').isString().trim().isLength({ min: 1 }).withMessage('Account name is required'),
    body('account_details').isObject().withMessage('Account details must be an object'),
    body('is_default').optional().isBoolean().withMessage('is_default must be a boolean')
  ],
  withdrawalController.addWithdrawalMethod
);

/**
 * @swagger
 * /api/withdrawals/methods/{id}:
 *   put:
 *     summary: Update withdrawal method
 *     tags: [Withdrawals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Withdrawal method ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               account_name:
 *                 type: string
 *                 description: Name for this withdrawal method
 *               account_details:
 *                 type: object
 *                 description: Account details for the withdrawal method
 *               is_default:
 *                 type: boolean
 *                 description: Whether this should be the default method
 *               is_active:
 *                 type: boolean
 *                 description: Whether this method is active
 *     responses:
 *       200:
 *         description: Withdrawal method updated successfully
 *       400:
 *         description: Validation error or not found
 *       500:
 *         description: Internal server error
 */
router.put('/methods/:id',
  authenticate,
  [
    param('id').isUUID().withMessage('Invalid withdrawal method ID'),
    body('account_name').optional().isString().trim().isLength({ min: 1 }).withMessage('Account name must not be empty'),
    body('account_details').optional().isObject().withMessage('Account details must be an object'),
    body('is_default').optional().isBoolean().withMessage('is_default must be a boolean'),
    body('is_active').optional().isBoolean().withMessage('is_active must be a boolean')
  ],
  withdrawalController.updateWithdrawalMethod
);

/**
 * @swagger
 * /api/withdrawals/methods/{id}:
 *   delete:
 *     summary: Delete withdrawal method
 *     tags: [Withdrawals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Withdrawal method ID
 *     responses:
 *       200:
 *         description: Withdrawal method deleted successfully
 *       400:
 *         description: Withdrawal method not found or not authorized
 *       500:
 *         description: Internal server error
 */
router.delete('/methods/:id',
  authenticate,
  [
    param('id').isUUID().withMessage('Invalid withdrawal method ID')
  ],
  withdrawalController.deleteWithdrawalMethod
);

/**
 * @swagger
 * /api/withdrawals/summary:
 *   get:
 *     summary: Get user withdrawal summary
 *     tags: [Withdrawals]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Withdrawal summary retrieved successfully
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
 *                     pending_amount:
 *                       type: number
 *                       format: decimal
 *                     total_withdrawn:
 *                       type: number
 *                       format: decimal
 *                     recent_requests:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/WithdrawalRequest'
 *                     generated_at:
 *                       type: string
 *                       format: date-time
 *       500:
 *         description: Internal server error
 */
router.get('/summary',
  authenticate,
  withdrawalController.getUserWithdrawalSummary
);

/**
 * @swagger
 * /api/withdrawals/settings:
 *   get:
 *     summary: Get withdrawal settings
 *     tags: [Withdrawals]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Withdrawal settings retrieved successfully
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
 *                     withdrawal_limits:
 *                       type: object
 *                     withdrawal_fees:
 *                       type: object
 *                     processing_times:
 *                       type: object
 *       500:
 *         description: Internal server error
 */
router.get('/settings',
  authenticate,
  withdrawalController.getWithdrawalSettings
);

/**
 * @swagger
 * /api/withdrawals/statistics:
 *   get:
 *     summary: Get withdrawal statistics (Admin only)
 *     tags: [Withdrawals]
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
 *         description: Withdrawal statistics retrieved successfully
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
 *                       type: object
 *                     by_method:
 *                       type: array
 *                     payouts:
 *                       type: object
 *                     period:
 *                       type: integer
 *                     generated_at:
 *                       type: string
 *                       format: date-time
 *       500:
 *         description: Internal server error
 */
router.get('/statistics',
  authenticate,
  [
    query('period').optional().isInt({ min: 1 }).withMessage('Period must be a positive integer')
  ],
  withdrawalController.getWithdrawalStatistics
);

module.exports = router; 