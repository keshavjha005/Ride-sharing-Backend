const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticate, optionalAuth } = require('../middleware/auth');
const {
  getAllLanguages,
  getLanguageByCode,
  getDefaultLanguage,
  updateUserLanguage,
  getRtlLanguages,
} = require('../controllers/languageController');

// Public routes
router.get('/', asyncHandler(getAllLanguages));
router.get('/default', asyncHandler(getDefaultLanguage));
router.get('/rtl', asyncHandler(getRtlLanguages));
router.get('/:code', asyncHandler(getLanguageByCode));

// Protected routes
router.put('/user', authenticate, asyncHandler(updateUserLanguage));

module.exports = router; 