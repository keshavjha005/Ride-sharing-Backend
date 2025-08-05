const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticate, authenticateAdmin } = require('../middleware/auth');
const {
  getLocalizedContent,
  getContentByKey,
  createLocalizedContent,
  updateLocalizedContent,
  deleteLocalizedContent,
  getContentTypes,
  getContentCategories,
} = require('../controllers/localizationController');

// Public routes
router.get('/', asyncHandler(getLocalizedContent));
router.get('/types', asyncHandler(getContentTypes));
router.get('/categories', asyncHandler(getContentCategories));
router.get('/key/:key', asyncHandler(getContentByKey));

// Admin routes (protected)
router.post('/', authenticateAdmin, asyncHandler(createLocalizedContent));
router.put('/key/:key', authenticateAdmin, asyncHandler(updateLocalizedContent));
router.delete('/key/:key', authenticateAdmin, asyncHandler(deleteLocalizedContent));

module.exports = router; 