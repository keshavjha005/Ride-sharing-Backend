const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();

const rideController = require('../controllers/rideController');
const { authenticate } = require('../middleware/auth');

// Validation middleware
const validateSearchHistoryParams = [
  body('pickupLocation')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Pickup location must be a string between 1 and 500 characters'),
  
  body('dropLocation')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Drop location must be a string between 1 and 500 characters')
];

const validateSearchSuggestionsParams = [
  query('query')
    .isString()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Search query must be between 2 and 200 characters'),
  
  query('type')
    .optional()
    .isIn(['location', 'popular'])
    .withMessage('Type must be location or popular')
];

const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

const validateSearchHistoryId = [
  param('id')
    .isUUID()
    .withMessage('Valid search history ID is required')
];

// Routes

/**
 * @swagger
 * /api/search/history:
 *   get:
 *     summary: Get user's search history
 *     description: Retrieve the authenticated user's search history with pagination
 *     tags: [Search]
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
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Items per page
 *         example: 20
 *     responses:
 *       200:
 *         description: Search history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Search history retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     history:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           pickupLocation:
 *                             type: string
 *                           dropLocation:
 *                             type: string
 *                           searchDate:
 *                             type: string
 *                             format: date-time
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/history', authenticate, validatePagination, rideController.getSearchHistory);

/**
 * @swagger
 * /api/search/history:
 *   post:
 *     summary: Save search to history
 *     description: Save a search query to the user's search history
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               pickupLocation:
 *                 type: string
 *                 maxLength: 500
 *                 description: Pickup location address
 *                 example: "New York, NY"
 *               dropLocation:
 *                 type: string
 *                 maxLength: 500
 *                 description: Drop location address
 *                 example: "Boston, MA"
 *     responses:
 *       201:
 *         description: Search saved to history successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Search saved to history successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     searchId:
 *                       type: string
 *                       format: uuid
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/history', authenticate, validateSearchHistoryParams, rideController.saveSearchHistory);

/**
 * @swagger
 * /api/search/history/{id}:
 *   delete:
 *     summary: Delete search history item
 *     description: Delete a specific search history item for the authenticated user
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Search history item ID
 *     responses:
 *       200:
 *         description: Search history item deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Search history item deleted successfully"
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Search history item not found or not authorized
 *       500:
 *         description: Internal server error
 */
router.delete('/history/:id', authenticate, validateSearchHistoryId, rideController.deleteSearchHistory);

/**
 * @swagger
 * /api/search/suggestions:
 *   get:
 *     summary: Get search suggestions
 *     description: Get location or popular search suggestions based on the query
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 2
 *           maxLength: 200
 *         description: Search query string
 *         example: "New York"
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [location, popular]
 *           default: location
 *         description: Type of suggestions to return
 *         example: "location"
 *     responses:
 *       200:
 *         description: Search suggestions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Search suggestions retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     suggestions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           description:
 *                             type: string
 *                           pickupLocation:
 *                             type: string
 *                           dropLocation:
 *                             type: string
 *                           searchCount:
 *                             type: integer
 *                     query:
 *                       type: string
 *                     type:
 *                       type: string
 *       400:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 */
router.get('/suggestions', validateSearchSuggestionsParams, rideController.getSearchSuggestions);

module.exports = router; 