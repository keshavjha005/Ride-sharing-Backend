const { executeQuery } = require('../config/database');
const { ValidationError, NotFoundError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

// Get admin localized content
const getAdminLocalizedContent = async (req, res, next) => {
  try {
    const { language, type, category, key, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    let query = 'SELECT * FROM admin_localized_content WHERE 1=1';
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
      query += ' AND content_key LIKE ?';
      params.push(`%${key}%`);
    }
    
    // Get total count
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
    const countResult = await executeQuery(countQuery, params);
    const total = countResult[0].total;
    
    // Get paginated results
    query += ' ORDER BY content_key ASC LIMIT ' + Number(limit) + ' OFFSET ' + Number(offset);
    
    const content = await executeQuery(query, params);
    
    logger.business('admin_localized_content_retrieved', { 
      language, 
      type, 
      category, 
      key, 
      count: content.length,
      page,
      limit
    });
    
    res.json({
      success: true,
      data: {
        content,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        },
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

// Create admin localized content
const createAdminLocalizedContent = async (req, res, next) => {
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
    const existingQuery = 'SELECT COUNT(*) as count FROM admin_localized_content WHERE content_key = ?';
    const existing = await executeQuery(existingQuery, [content_key]);
    
    if (existing[0].count > 0) {
      throw new ValidationError('Content key already exists');
    }
    
    const query = `
      INSERT INTO admin_localized_content (
        id, content_key, content_ar, content_en, content_type, category
      ) VALUES (UUID(), ?, ?, ?, ?, ?)
    `;
    
    await executeQuery(query, [content_key, content_ar, content_en, content_type, category]);
    
    logger.business('admin_localized_content_created', { content_key, content_type });
    
    res.status(201).json({
      success: true,
      message: 'Admin localized content created successfully',
      data: {
        content_key,
        content_type,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update admin localized content
const updateAdminLocalizedContent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      content_ar,
      content_en,
      content_type,
      category,
      is_active,
    } = req.body;
    
    // Check if content exists
    const existingQuery = 'SELECT * FROM admin_localized_content WHERE id = ?';
    const existing = await executeQuery(existingQuery, [id]);
    
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
    params.push(id);
    
    const query = `UPDATE admin_localized_content SET ${updates.join(', ')} WHERE id = ?`;
    await executeQuery(query, params);
    
    logger.business('admin_localized_content_updated', { id });
    
    res.json({
      success: true,
      message: 'Admin localized content updated successfully',
      data: {
        id,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Delete admin localized content
const deleteAdminLocalizedContent = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if content exists
    const existingQuery = 'SELECT * FROM admin_localized_content WHERE id = ?';
    const existing = await executeQuery(existingQuery, [id]);
    
    if (existing.length === 0) {
      throw new NotFoundError('Content not found');
    }
    
    const query = 'DELETE FROM admin_localized_content WHERE id = ?';
    await executeQuery(query, [id]);
    
    logger.business('admin_localized_content_deleted', { id });
    
    res.json({
      success: true,
      message: 'Admin localized content deleted successfully',
      data: {
        id,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get language settings
const getLanguageSettings = async (req, res, next) => {
  try {
    const query = `
      SELECT als.*, l.name as language_name, l.native_name 
      FROM admin_language_settings als
      JOIN languages l ON als.language_code = l.code
      ORDER BY als.display_order ASC, l.name ASC
    `;
    
    const languages = await executeQuery(query);
    
    logger.business('admin_language_settings_retrieved', { count: languages.length });
    
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

// Update language settings
const updateLanguageSettings = async (req, res, next) => {
  try {
    const { language_code } = req.params;
    const {
      is_enabled,
      is_default,
      display_order,
      admin_interface_enabled,
      mobile_app_enabled,
    } = req.body;
    
    // Check if language exists
    const existingQuery = 'SELECT * FROM admin_language_settings WHERE language_code = ?';
    const existing = await executeQuery(existingQuery, [language_code]);
    
    if (existing.length === 0) {
      throw new NotFoundError('Language setting not found');
    }
    
    // Build update query
    const updates = [];
    const params = [];
    
    if (is_enabled !== undefined) {
      updates.push('is_enabled = ?');
      params.push(is_enabled);
    }
    
    if (is_default !== undefined) {
      updates.push('is_default = ?');
      params.push(is_default);
    }
    
    if (display_order !== undefined) {
      updates.push('display_order = ?');
      params.push(display_order);
    }
    
    if (admin_interface_enabled !== undefined) {
      updates.push('admin_interface_enabled = ?');
      params.push(admin_interface_enabled);
    }
    
    if (mobile_app_enabled !== undefined) {
      updates.push('mobile_app_enabled = ?');
      params.push(mobile_app_enabled);
    }
    
    if (updates.length === 0) {
      throw new ValidationError('No fields to update');
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(language_code);
    
    const query = `UPDATE admin_language_settings SET ${updates.join(', ')} WHERE language_code = ?`;
    await executeQuery(query, params);
    
    logger.business('admin_language_settings_updated', { language_code });
    
    res.json({
      success: true,
      message: 'Language settings updated successfully',
      data: {
        language_code,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get translation management
const getTranslationManagement = async (req, res, next) => {
  try {
    const { status, source_language, target_language, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT tm.*, 
             au1.first_name as translator_name,
             au2.first_name as reviewer_name
      FROM translation_management tm
      LEFT JOIN admin_users au1 ON tm.translator_id = au1.id
      LEFT JOIN admin_users au2 ON tm.reviewer_id = au2.id
      WHERE 1=1
    `;
    const params = [];
    
    if (status) {
      query += ' AND tm.translation_status = ?';
      params.push(status);
    }
    
    if (source_language) {
      query += ' AND tm.source_language = ?';
      params.push(source_language);
    }
    
    if (target_language) {
      query += ' AND tm.target_language = ?';
      params.push(target_language);
    }
    
    // Get total count
    const countQuery = query.replace('SELECT tm.*, au1.first_name as translator_name, au2.first_name as reviewer_name', 'SELECT COUNT(*) as total');
    const countResult = await executeQuery(countQuery, params);
    const total = countResult[0].total;
    
    // Get paginated results
    query += ' ORDER BY tm.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);
    
    const translations = await executeQuery(query, params);
    
    logger.business('translation_management_retrieved', { 
      status, 
      source_language, 
      target_language, 
      count: translations.length,
      page,
      limit
    });
    
    res.json({
      success: true,
      data: {
        translations,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        },
        filters: {
          status,
          source_language,
          target_language,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Create translation request
const createTranslationRequest = async (req, res, next) => {
  try {
    const {
      source_language,
      target_language,
      content_key,
      original_text,
      translator_id,
    } = req.body;
    
    if (!source_language || !target_language || !content_key || !original_text) {
      throw new ValidationError('Source language, target language, content key, and original text are required');
    }
    
    const query = `
      INSERT INTO translation_management (
        id, source_language, target_language, content_key, original_text, translator_id
      ) VALUES (UUID(), ?, ?, ?, ?, ?)
    `;
    
    await executeQuery(query, [source_language, target_language, content_key, original_text, translator_id]);
    
    logger.business('translation_request_created', { content_key, source_language, target_language });
    
    res.status(201).json({
      success: true,
      message: 'Translation request created successfully',
      data: {
        content_key,
        source_language,
        target_language,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update translation
const updateTranslation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      translated_text,
      translation_status,
      reviewer_id,
    } = req.body;
    
    // Check if translation exists
    const existingQuery = 'SELECT * FROM translation_management WHERE id = ?';
    const existing = await executeQuery(existingQuery, [id]);
    
    if (existing.length === 0) {
      throw new NotFoundError('Translation not found');
    }
    
    // Build update query
    const updates = [];
    const params = [];
    
    if (translated_text !== undefined) {
      updates.push('translated_text = ?');
      params.push(translated_text);
    }
    
    if (translation_status !== undefined) {
      updates.push('translation_status = ?');
      params.push(translation_status);
    }
    
    if (reviewer_id !== undefined) {
      updates.push('reviewer_id = ?');
      params.push(reviewer_id);
    }
    
    if (translation_status === 'reviewed' || translation_status === 'approved') {
      updates.push('reviewed_at = CURRENT_TIMESTAMP');
    }
    
    if (updates.length === 0) {
      throw new ValidationError('No fields to update');
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);
    
    const query = `UPDATE translation_management SET ${updates.join(', ')} WHERE id = ?`;
    await executeQuery(query, params);
    
    logger.business('translation_updated', { id, translation_status });
    
    res.json({
      success: true,
      message: 'Translation updated successfully',
      data: {
        id,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get pending translations
const getPendingTranslations = async (req, res, next) => {
  try {
    const query = `
      SELECT tm.*, 
             au1.first_name as translator_name,
             au2.first_name as reviewer_name
      FROM translation_management tm
      LEFT JOIN admin_users au1 ON tm.translator_id = au1.id
      LEFT JOIN admin_users au2 ON tm.reviewer_id = au2.id
      WHERE tm.translation_status = 'pending'
      ORDER BY tm.created_at ASC
    `;
    
    const translations = await executeQuery(query);
    
    logger.business('pending_translations_retrieved', { count: translations.length });
    
    res.json({
      success: true,
      data: {
        translations,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Approve translation
const approveTranslation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reviewer_id } = req.body;
    
    // Check if translation exists
    const existingQuery = 'SELECT * FROM translation_management WHERE id = ?';
    const existing = await executeQuery(existingQuery, [id]);
    
    if (existing.length === 0) {
      throw new NotFoundError('Translation not found');
    }
    
    const query = `
      UPDATE translation_management 
      SET translation_status = 'approved', 
          reviewer_id = ?, 
          reviewed_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `;
    
    await executeQuery(query, [reviewer_id, id]);
    
    logger.business('translation_approved', { id, reviewer_id });
    
    res.json({
      success: true,
      message: 'Translation approved successfully',
      data: {
        id,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Export localized content
const exportLocalizedContent = async (req, res, next) => {
  try {
    const { format = 'json', language } = req.query;
    
    let query = 'SELECT * FROM admin_localized_content WHERE is_active = true';
    const params = [];
    
    if (language) {
      query += ' AND (content_' + language + ' IS NOT NULL AND content_' + language + ' != "")';
    }
    
    query += ' ORDER BY content_key ASC';
    
    const content = await executeQuery(query, params);
    
    if (format === 'csv') {
      // Convert to CSV format
      const csvHeaders = ['content_key', 'content_ar', 'content_en', 'content_type', 'category'];
      const csvData = content.map(item => [
        item.content_key,
        item.content_ar || '',
        item.content_en || '',
        item.content_type,
        item.category || ''
      ]);
      
      const csvContent = [csvHeaders, ...csvData]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="localized_content.csv"');
      res.send(csvContent);
    } else {
      // JSON format
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="localized_content.json"');
      res.json({
        success: true,
        data: content,
        export_info: {
          format,
          language,
          total_items: content.length,
          exported_at: new Date().toISOString()
        }
      });
    }
    
    logger.business('localized_content_exported', { format, language, count: content.length });
  } catch (error) {
    next(error);
  }
};

// Get admin language preferences
const getAdminLanguagePreference = async (req, res, next) => {
  try {
    const adminId = req.admin.id;
    
    const query = 'SELECT language_code FROM admin_users WHERE id = ?';
    const result = await executeQuery(query, [adminId]);
    
    if (result.length === 0) {
      throw new NotFoundError('Admin user not found');
    }
    
    res.json({
      success: true,
      data: {
        language_code: result[0].language_code,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update admin language preference
const updateAdminLanguagePreference = async (req, res, next) => {
  try {
    const adminId = req.admin.id;
    const { language_code } = req.body;
    
    if (!language_code) {
      throw new ValidationError('Language code is required');
    }
    
    // Check if language exists
    const languageQuery = 'SELECT COUNT(*) as count FROM languages WHERE code = ?';
    const languageResult = await executeQuery(languageQuery, [language_code]);
    
    if (languageResult[0].count === 0) {
      throw new ValidationError('Invalid language code');
    }
    
    const query = 'UPDATE admin_users SET language_code = ? WHERE id = ?';
    await executeQuery(query, [language_code, adminId]);
    
    logger.business('admin_language_preference_updated', { adminId, language_code });
    
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

module.exports = {
  getAdminLocalizedContent,
  createAdminLocalizedContent,
  updateAdminLocalizedContent,
  deleteAdminLocalizedContent,
  getLanguageSettings,
  updateLanguageSettings,
  getTranslationManagement,
  createTranslationRequest,
  updateTranslation,
  getPendingTranslations,
  approveTranslation,
  exportLocalizedContent,
  getAdminLanguagePreference,
  updateAdminLanguagePreference,
}; 