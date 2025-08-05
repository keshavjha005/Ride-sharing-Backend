const { executeQuery } = require('../config/database');
const { ValidationError, NotFoundError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

// Get localized content
const getLocalizedContent = async (req, res, next) => {
  try {
    const { language, type, category, key } = req.query;
    
    let query = 'SELECT * FROM localized_content WHERE is_active = true';
    const params = [];
    
    if (language) {
      query += ' AND (content_' + language + ' IS NOT NULL AND content_' + language + ' != "")';
    }
    
    if (type) {
      query += ' AND content_type = ?';
      params.push(type);
    }
    
    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }
    
    if (key) {
      query += ' AND content_key = ?';
      params.push(key);
    }
    
    query += ' ORDER BY content_key ASC';
    
    const content = await executeQuery(query, params);
    
    logger.business('localized_content_retrieved', { 
      language, 
      type, 
      category, 
      key, 
      count: content.length 
    });
    
    res.json({
      success: true,
      data: {
        content,
        filters: {
          language,
          type,
          category,
          key,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get content by key
const getContentByKey = async (req, res, next) => {
  try {
    const { key } = req.params;
    const { language } = req.query;
    
    const query = 'SELECT * FROM localized_content WHERE content_key = ? AND is_active = true';
    const content = await executeQuery(query, [key]);
    
    if (content.length === 0) {
      throw new NotFoundError('Content not found');
    }
    
    const item = content[0];
    
    // If language is specified, return only that language content
    if (language && (language === 'ar' || language === 'en')) {
      const languageField = `content_${language}`;
      if (item[languageField]) {
        item.content = item[languageField];
      } else {
        // Fallback to English if requested language is not available
        item.content = item.content_en || item.content_ar || '';
      }
    }
    
    logger.business('content_by_key_retrieved', { key, language });
    
    res.json({
      success: true,
      data: {
        content: item,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Create new localized content
const createLocalizedContent = async (req, res, next) => {
  try {
    const {
      content_key,
      content_ar,
      content_en,
      content_type,
      category,
    } = req.body;
    
    if (!content_key || !content_type) {
      throw new ValidationError('Content key and type are required');
    }
    
    if (!content_ar && !content_en) {
      throw new ValidationError('At least one language content is required');
    }
    
    // Check if content key already exists
    const existingQuery = 'SELECT COUNT(*) as count FROM localized_content WHERE content_key = ?';
    const existing = await executeQuery(existingQuery, [content_key]);
    
    if (existing[0].count > 0) {
      throw new ValidationError('Content key already exists');
    }
    
    const query = `
      INSERT INTO localized_content (
        id, content_key, content_ar, content_en, content_type, category
      ) VALUES (UUID(), ?, ?, ?, ?, ?)
    `;
    
    await executeQuery(query, [content_key, content_ar, content_en, content_type, category]);
    
    logger.business('localized_content_created', { content_key, content_type });
    
    res.status(201).json({
      success: true,
      message: 'Localized content created successfully',
      data: {
        content_key,
        content_type,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update localized content
const updateLocalizedContent = async (req, res, next) => {
  try {
    const { key } = req.params;
    const {
      content_ar,
      content_en,
      content_type,
      category,
      is_active,
    } = req.body;
    
    // Check if content exists
    const existingQuery = 'SELECT * FROM localized_content WHERE content_key = ?';
    const existing = await executeQuery(existingQuery, [key]);
    
    if (existing.length === 0) {
      throw new NotFoundError('Content not found');
    }
    
    // Build update query
    const updates = [];
    const params = [];
    
    if (content_ar !== undefined) {
      updates.push('content_ar = ?');
      params.push(content_ar);
    }
    
    if (content_en !== undefined) {
      updates.push('content_en = ?');
      params.push(content_en);
    }
    
    if (content_type !== undefined) {
      updates.push('content_type = ?');
      params.push(content_type);
    }
    
    if (category !== undefined) {
      updates.push('category = ?');
      params.push(category);
    }
    
    if (is_active !== undefined) {
      updates.push('is_active = ?');
      params.push(is_active);
    }
    
    if (updates.length === 0) {
      throw new ValidationError('No fields to update');
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(key);
    
    const query = `UPDATE localized_content SET ${updates.join(', ')} WHERE content_key = ?`;
    await executeQuery(query, params);
    
    logger.business('localized_content_updated', { content_key: key });
    
    res.json({
      success: true,
      message: 'Localized content updated successfully',
      data: {
        content_key: key,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Delete localized content
const deleteLocalizedContent = async (req, res, next) => {
  try {
    const { key } = req.params;
    
    // Check if content exists
    const existingQuery = 'SELECT * FROM localized_content WHERE content_key = ?';
    const existing = await executeQuery(existingQuery, [key]);
    
    if (existing.length === 0) {
      throw new NotFoundError('Content not found');
    }
    
    const query = 'UPDATE localized_content SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE content_key = ?';
    await executeQuery(query, [key]);
    
    logger.business('localized_content_deleted', { content_key: key });
    
    res.json({
      success: true,
      message: 'Localized content deleted successfully',
      data: {
        content_key: key,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get content types
const getContentTypes = async (req, res, next) => {
  try {
    const query = 'SELECT DISTINCT content_type FROM localized_content WHERE is_active = true ORDER BY content_type';
    const types = await executeQuery(query);
    
    logger.business('content_types_retrieved', { count: types.length });
    
    res.json({
      success: true,
      data: {
        content_types: types.map(t => t.content_type),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get content categories
const getContentCategories = async (req, res, next) => {
  try {
    const query = 'SELECT DISTINCT category FROM localized_content WHERE is_active = true AND category IS NOT NULL ORDER BY category';
    const categories = await executeQuery(query);
    
    logger.business('content_categories_retrieved', { count: categories.length });
    
    res.json({
      success: true,
      data: {
        categories: categories.map(c => c.category),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getLocalizedContent,
  getContentByKey,
  createLocalizedContent,
  updateLocalizedContent,
  deleteLocalizedContent,
  getContentTypes,
  getContentCategories,
}; 