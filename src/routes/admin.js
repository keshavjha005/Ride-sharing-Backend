const express = require('express');
const { body, query, param, validationResult } = require('express-validator');
const commissionController = require('../controllers/commissionController');
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