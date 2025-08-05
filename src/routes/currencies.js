const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticate, optionalAuth } = require('../middleware/auth');
const {
  getAllCurrencies,
  getCurrencyByCode,
  getDefaultCurrency,
  updateUserCurrency,
  formatCurrency,
} = require('../controllers/currencyController');

// Public routes
router.get('/', asyncHandler(getAllCurrencies));
router.get('/default', asyncHandler(getDefaultCurrency));
router.get('/format', asyncHandler(formatCurrency));
router.get('/:code', asyncHandler(getCurrencyByCode));

// Protected routes
router.put('/user', authenticate, asyncHandler(updateUserCurrency));

module.exports = router; 