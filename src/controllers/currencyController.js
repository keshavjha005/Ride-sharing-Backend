const { executeQuery } = require('../config/database');
const { ValidationError, NotFoundError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

// Get all supported currencies
const getAllCurrencies = async (req, res, next) => {
  try {
    const query = 'SELECT * FROM currencies WHERE is_active = true ORDER BY is_default DESC, name ASC';
    const currencies = await executeQuery(query);
    
    logger.business('currencies_retrieved', { count: currencies.length });
    
    res.json({
      success: true,
      data: {
        currencies,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get currency by code
const getCurrencyByCode = async (req, res, next) => {
  try {
    const { code } = req.params;
    
    const query = 'SELECT * FROM currencies WHERE code = ? AND is_active = true';
    const currencies = await executeQuery(query, [code]);
    
    if (currencies.length === 0) {
      throw new NotFoundError('Currency not found');
    }
    
    logger.business('currency_retrieved', { code });
    
    res.json({
      success: true,
      data: {
        currency: currencies[0],
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get default currency
const getDefaultCurrency = async (req, res, next) => {
  try {
    const query = 'SELECT * FROM currencies WHERE is_default = true AND is_active = true LIMIT 1';
    const currencies = await executeQuery(query);
    
    if (currencies.length === 0) {
      throw new NotFoundError('Default currency not found');
    }
    
    logger.business('default_currency_retrieved');
    
    res.json({
      success: true,
      data: {
        currency: currencies[0],
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update user currency preference
const updateUserCurrency = async (req, res, next) => {
  try {
    const { currency_code } = req.body;
    const userId = req.user.id;
    
    if (!currency_code) {
      throw new ValidationError('Currency code is required');
    }
    
    // Verify currency exists and is active
    const currencyQuery = 'SELECT * FROM currencies WHERE code = ? AND is_active = true';
    const currencies = await executeQuery(currencyQuery, [currency_code]);
    
    if (currencies.length === 0) {
      throw new ValidationError('Invalid currency code');
    }
    
    // Update user currency preference
    const updateQuery = 'UPDATE users SET currency_code = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    await executeQuery(updateQuery, [currency_code, userId]);
    
    logger.business('user_currency_updated', { userId, currency_code });
    
    res.json({
      success: true,
      message: 'Currency preference updated successfully',
      data: {
        currency_code,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Format currency amount
const formatCurrency = async (req, res, next) => {
  try {
    const { amount, currency_code } = req.query;
    
    if (!amount || !currency_code) {
      throw new ValidationError('Amount and currency code are required');
    }
    
    // Get currency information
    const currencyQuery = 'SELECT * FROM currencies WHERE code = ? AND is_active = true';
    const currencies = await executeQuery(currencyQuery, [currency_code]);
    
    if (currencies.length === 0) {
      throw new ValidationError('Invalid currency code');
    }
    
    const currency = currencies[0];
    const numAmount = parseFloat(amount);
    
    if (isNaN(numAmount)) {
      throw new ValidationError('Invalid amount');
    }
    
    // Format currency based on currency settings
    const formattedAmount = formatCurrencyAmount(numAmount, currency);
    
    logger.business('currency_formatted', { amount, currency_code, formattedAmount });
    
    res.json({
      success: true,
      data: {
        amount: numAmount,
        currency_code,
        formatted_amount: formattedAmount,
        currency_info: {
          symbol: currency.symbol,
          symbol_at_right: currency.symbol_at_right,
          decimal_digits: currency.decimal_digits,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Helper function to format currency amount
const formatCurrencyAmount = (amount, currency) => {
  const numAmount = parseFloat(amount);
  const decimalPlaces = currency.decimal_digits || 2;
  const formattedNumber = numAmount.toFixed(decimalPlaces);
  
  if (currency.symbol_at_right) {
    return `${formattedNumber} ${currency.symbol}`;
  } else {
    return `${currency.symbol}${formattedNumber}`;
  }
};

module.exports = {
  getAllCurrencies,
  getCurrencyByCode,
  getDefaultCurrency,
  updateUserCurrency,
  formatCurrency,
}; 