const { executeQuery } = require('../config/database');
const { ValidationError, NotFoundError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

// Get all supported languages
const getAllLanguages = async (req, res, next) => {
  try {
    const query = 'SELECT * FROM languages WHERE is_active = true ORDER BY is_default DESC, name ASC';
    const languages = await executeQuery(query);
    
    logger.business('languages_retrieved', { count: languages.length });
    
    res.json({
      success: true,
      data: {
        languages,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get language by code
const getLanguageByCode = async (req, res, next) => {
  try {
    const { code } = req.params;
    
    const query = 'SELECT * FROM languages WHERE code = ? AND is_active = true';
    const languages = await executeQuery(query, [code]);
    
    if (languages.length === 0) {
      throw new NotFoundError('Language not found');
    }
    
    logger.business('language_retrieved', { code });
    
    res.json({
      success: true,
      data: {
        language: languages[0],
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get default language
const getDefaultLanguage = async (req, res, next) => {
  try {
    const query = 'SELECT * FROM languages WHERE is_default = true AND is_active = true LIMIT 1';
    const languages = await executeQuery(query);
    
    if (languages.length === 0) {
      throw new NotFoundError('Default language not found');
    }
    
    logger.business('default_language_retrieved');
    
    res.json({
      success: true,
      data: {
        language: languages[0],
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update user language preference
const updateUserLanguage = async (req, res, next) => {
  try {
    const { language_code } = req.body;
    const userId = req.user.id;
    
    if (!language_code) {
      throw new ValidationError('Language code is required');
    }
    
    // Verify language exists and is active
    const languageQuery = 'SELECT * FROM languages WHERE code = ? AND is_active = true';
    const languages = await executeQuery(languageQuery, [language_code]);
    
    if (languages.length === 0) {
      throw new ValidationError('Invalid language code');
    }
    
    // Update user language preference
    const updateQuery = 'UPDATE users SET language_code = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    await executeQuery(updateQuery, [language_code, userId]);
    
    logger.business('user_language_updated', { userId, language_code });
    
    res.json({
      success: true,
      message: 'Language preference updated successfully',
      data: {
        language_code,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get RTL languages
const getRtlLanguages = async (req, res, next) => {
  try {
    const query = 'SELECT * FROM languages WHERE is_rtl = true AND is_active = true ORDER BY name ASC';
    const languages = await executeQuery(query);
    
    logger.business('rtl_languages_retrieved', { count: languages.length });
    
    res.json({
      success: true,
      data: {
        languages,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllLanguages,
  getLanguageByCode,
  getDefaultLanguage,
  updateUserLanguage,
  getRtlLanguages,
}; 