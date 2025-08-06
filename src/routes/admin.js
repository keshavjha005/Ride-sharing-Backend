const express = require('express');
const { body, query, param, validationResult } = require('express-validator');
const commissionController = require('../controllers/commissionController');
const financialController = require('../controllers/financialController');
const { authenticate } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Admin authentication middleware (placeholder - should be enhanced for admin roles)
const requireAdmin = (req, res, next) => {
  // TODO: Implement proper admin role checking
  // For now, we'll use the regular authentication
  next();
};

// Commission Settings Endpoints

/**
 * @swagger
 * /api/admin/commission/settings:
 *   get:
 *     summary: Get commission settings (Admin only)
 *     tags: [Admin Commission]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Commission settings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       500:
 *         description: Internal server error
 */
router.get('/commission/settings',
  authenticate,
  requireAdmin,
  commissionController.getCommissionSettings
);

/**
 * @swagger
 * /api/admin/commission/settings:
 *   put:
 *     summary: Update commission settings (Admin only)
 *     tags: [Admin Commission]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - commissionType
 *             properties:
 *               commissionType:
 *                 type: string
 *                 enum: [booking, withdrawal, per_km]
 *               commissionPercentage:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *               commissionAmount:
 *                 type: number
 *                 minimum: 0
 *               minimumAmount:
 *                 type: number
 *                 minimum: 0
 *               maximumAmount:
 *                 type: number
 *                 minimum: 0
 *     responses:
 *       200:
 *         description: Commission settings updated successfully
 *       400:
 *         description: Invalid input data
 *       500:
 *         description: Internal server error
 */
router.put('/commission/settings',
  authenticate,
  requireAdmin,
  [
    body('commissionType').isIn(['booking', 'withdrawal', 'per_km']).withMessage('Valid commission type is required'),
    body('commissionPercentage').optional().isFloat({ min: 0, max: 100 }).withMessage('Commission percentage must be between 0 and 100'),
    body('commissionAmount').optional().isFloat({ min: 0 }).withMessage('Commission amount cannot be negative'),
    body('minimumAmount').optional().isFloat({ min: 0 }).withMessage('Minimum amount cannot be negative'),
    body('maximumAmount').optional().isFloat({ min: 0 }).withMessage('Maximum amount cannot be negative')
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    next();
  },
  commissionController.updateCommissionSettings
);

// Commission Reports Endpoints

/**
 * @swagger
 * /api/admin/commission/reports:
 *   get:
 *     summary: Get commission reports (Admin only)
 *     tags: [Admin Commission]
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
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by start date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by end date
 *     responses:
 *       200:
 *         description: Commission reports retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get('/commission/reports',
  authenticate,
  requireAdmin,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('startDate').optional().isDate().withMessage('Invalid start date'),
    query('endDate').optional().isDate().withMessage('Invalid end date')
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    next();
  },
  commissionController.getCommissionReports
);

/**
 * @swagger
 * /api/admin/commission/reports/generate:
 *   post:
 *     summary: Generate commission report for a specific date (Admin only)
 *     tags: [Admin Commission]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - date
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *                 description: Date for which to generate the report
 *     responses:
 *       200:
 *         description: Commission report generated successfully
 *       400:
 *         description: Invalid date format
 *       500:
 *         description: Internal server error
 */
router.post('/commission/reports/generate',
  authenticate,
  requireAdmin,
  [
    body('date').isDate().withMessage('Valid date is required')
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    next();
  },
  commissionController.generateCommissionReport
);

// Commission Analytics Endpoints

/**
 * @swagger
 * /api/admin/commission/analytics:
 *   get:
 *     summary: Get commission analytics (Admin only)
 *     tags: [Admin Commission]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           default: '30'
 *         description: Period in days for analytics
 *     responses:
 *       200:
 *         description: Commission analytics retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get('/commission/analytics',
  authenticate,
  requireAdmin,
  [
    query('period').optional().isInt({ min: 1 }).withMessage('Period must be a positive integer')
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    next();
  },
  commissionController.getCommissionAnalytics
);

/**
 * @swagger
 * /api/admin/commission/dashboard:
 *   get:
 *     summary: Get commission dashboard data (Admin only)
 *     tags: [Admin Commission]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Commission dashboard data retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get('/commission/dashboard',
  authenticate,
  requireAdmin,
  commissionController.getCommissionDashboard
);

// Commission Export Endpoints

/**
 * @swagger
 * /api/admin/commission/export:
 *   get:
 *     summary: Export commission data (Admin only)
 *     tags: [Admin Commission]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: Start date for export
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: End date for export
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, csv]
 *           default: json
 *         description: Export format
 *     responses:
 *       200:
 *         description: Commission data exported successfully
 *       400:
 *         description: Invalid date range
 *       500:
 *         description: Internal server error
 */
router.get('/commission/export',
  authenticate,
  requireAdmin,
  [
    query('startDate').isDate().withMessage('Valid start date is required'),
    query('endDate').isDate().withMessage('Valid end date is required'),
    query('format').optional().isIn(['json', 'csv']).withMessage('Format must be json or csv')
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    next();
  },
  commissionController.exportCommissionData
);

// Financial Dashboard Endpoints

/**
 * @swagger
 * /api/admin/financial/dashboard:
 *   get:
 *     summary: Get financial dashboard data (Admin only)
 *     tags: [Admin Financial]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Financial dashboard data retrieved successfully
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
 *                     today:
 *                       type: object
 *                       properties:
 *                         revenue:
 *                           type: number
 *                         transactions:
 *                           type: integer
 *                         activeUsers:
 *                           type: integer
 *                         newUsers:
 *                           type: integer
 *                         withdrawals:
 *                           type: number
 *                         commission:
 *                           type: number
 *                     thisMonth:
 *                       type: object
 *                       properties:
 *                         revenue:
 *                           type: number
 *                         transactions:
 *                           type: integer
 *                         activeUsers:
 *                           type: integer
 *                         newUsers:
 *                           type: integer
 *                         withdrawals:
 *                           type: number
 *                         commission:
 *                           type: number
 *                     lastMonth:
 *                       type: object
 *                       properties:
 *                         revenue:
 *                           type: number
 *                         transactions:
 *                           type: integer
 *                         activeUsers:
 *                           type: integer
 *                         newUsers:
 *                           type: integer
 *                         withdrawals:
 *                           type: number
 *                         commission:
 *                           type: number
 *                     comparison:
 *                       type: object
 *                       properties:
 *                         revenueGrowth:
 *                           type: number
 *                         transactionGrowth:
 *                           type: number
 *                         userGrowth:
 *                           type: number
 *                     recentTransactions:
 *                       type: array
 *                       items:
 *                         type: object
 *                     topUsers:
 *                       type: array
 *                       items:
 *                         type: object
 *                     alerts:
 *                       type: array
 *                       items:
 *                         type: object
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/financial/dashboard',
  authenticate,
  requireAdmin,
  financialController.getFinancialDashboard
);

// Revenue Reports Endpoints

/**
 * @swagger
 * /api/admin/financial/revenue:
 *   get:
 *     summary: Get revenue reports (Admin only)
 *     tags: [Admin Financial]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for revenue report
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for revenue report
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [hourly, daily, weekly, monthly]
 *           default: daily
 *         description: Period for revenue aggregation
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
 *     responses:
 *       200:
 *         description: Revenue reports retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get('/financial/revenue',
  authenticate,
  requireAdmin,
  [
    query('startDate').optional().isDate().withMessage('Invalid start date'),
    query('endDate').optional().isDate().withMessage('Invalid end date'),
    query('period').optional().isIn(['hourly', 'daily', 'weekly', 'monthly']).withMessage('Invalid period'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    next();
  },
  financialController.getRevenueReports
);

// Transaction Reports Endpoints

/**
 * @swagger
 * /api/admin/financial/transactions:
 *   get:
 *     summary: Get transaction reports (Admin only)
 *     tags: [Admin Financial]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for transaction report
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for transaction report
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [credit, debit]
 *         description: Filter by transaction type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, completed, failed, cancelled]
 *         description: Filter by transaction status
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
 *     responses:
 *       200:
 *         description: Transaction reports retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get('/financial/transactions',
  authenticate,
  requireAdmin,
  [
    query('startDate').optional().isDate().withMessage('Invalid start date'),
    query('endDate').optional().isDate().withMessage('Invalid end date'),
    query('type').optional().isIn(['credit', 'debit']).withMessage('Invalid transaction type'),
    query('status').optional().isIn(['pending', 'completed', 'failed', 'cancelled']).withMessage('Invalid status'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    next();
  },
  financialController.getTransactionReports
);

// User Financial Reports Endpoints

/**
 * @swagger
 * /api/admin/financial/users/{id}:
 *   get:
 *     summary: Get user financial report (Admin only)
 *     tags: [Admin Financial]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for user report
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for user report
 *     responses:
 *       200:
 *         description: User financial report retrieved successfully
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.get('/financial/users/:id',
  authenticate,
  requireAdmin,
  [
    param('id').isUUID().withMessage('Valid user ID is required'),
    query('startDate').optional().isDate().withMessage('Invalid start date'),
    query('endDate').optional().isDate().withMessage('Invalid end date')
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    next();
  },
  financialController.getUserFinancialReport
);

// Financial Export Endpoints

/**
 * @swagger
 * /api/admin/financial/export:
 *   post:
 *     summary: Export financial data (Admin only)
 *     tags: [Admin Financial]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - startDate
 *               - endDate
 *             properties:
 *               startDate:
 *                 type: string
 *                 format: date
 *                 description: Start date for export
 *               endDate:
 *                 type: string
 *                 format: date
 *                 description: End date for export
 *               type:
 *                 type: string
 *                 enum: [transactions, revenue, users]
 *                 default: transactions
 *                 description: Type of data to export
 *               format:
 *                 type: string
 *                 enum: [json, csv]
 *                 default: json
 *                 description: Export format
 *     responses:
 *       200:
 *         description: Financial data exported successfully
 *       400:
 *         description: Invalid export parameters
 *       500:
 *         description: Internal server error
 */
router.post('/financial/export',
  authenticate,
  requireAdmin,
  [
    body('startDate').isDate().withMessage('Valid start date is required'),
    body('endDate').isDate().withMessage('Valid end date is required'),
    body('type').optional().isIn(['transactions', 'revenue', 'users']).withMessage('Invalid export type'),
    body('format').optional().isIn(['json', 'csv']).withMessage('Invalid export format')
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    next();
  },
  financialController.exportFinancialData
);

// Financial Alerts Endpoints

/**
 * @swagger
 * /api/admin/financial/alerts:
 *   get:
 *     summary: Get financial alerts (Admin only)
 *     tags: [Admin Financial]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Financial alerts retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get('/financial/alerts',
  authenticate,
  requireAdmin,
  financialController.getFinancialAlerts
);

// Error handling middleware
router.use((error, req, res, next) => {
  logger.error('Admin route error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

module.exports = router; 