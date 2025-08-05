const { executeQuery } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

class SMSTemplate {
  constructor(data = {}) {
    this.id = data.id || uuidv4();
    this.template_key = data.template_key;
    this.message_ar = data.message_ar;
    this.message_en = data.message_en;
    this.is_active = data.is_active !== undefined ? data.is_active : true;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  /**
   * Create new SMS template
   */
  static async create(templateData) {
    try {
      const template = new SMSTemplate(templateData);
      
      const query = `
        INSERT INTO sms_templates (
          id, template_key, message_ar, message_en, is_active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, NOW(), NOW())
      `;

      await executeQuery(query, [
        template.id,
        template.template_key,
        template.message_ar,
        template.message_en,
        template.is_active
      ]);

      return template;
    } catch (error) {
      logger.error('Error creating SMS template:', error);
      throw error;
    }
  }

  /**
   * Find template by key
   */
  static async findByKey(templateKey) {
    try {
      const query = `
        SELECT * FROM sms_templates 
        WHERE template_key = ? AND is_active = true
      `;
      
      const results = await executeQuery(query, [templateKey]);
      
      if (results.length === 0) {
        return null;
      }

      return new SMSTemplate(results[0]);
    } catch (error) {
      logger.error('Error finding SMS template by key:', error);
      throw error;
    }
  }

  /**
   * Find template by ID
   */
  static async findById(id) {
    try {
      const query = 'SELECT * FROM sms_templates WHERE id = ?';
      const results = await executeQuery(query, [id]);
      
      if (results.length === 0) {
        return null;
      }

      return new SMSTemplate(results[0]);
    } catch (error) {
      logger.error('Error finding SMS template by ID:', error);
      throw error;
    }
  }

  /**
   * Find all templates with filters
   */
  static async findAll(filters = {}) {
    try {
      let query = 'SELECT * FROM sms_templates WHERE 1=1';
      const params = [];

      if (filters.is_active !== undefined) {
        query += ' AND is_active = ?';
        params.push(filters.is_active);
      }

      if (filters.template_key) {
        query += ' AND template_key LIKE ?';
        params.push(`%${filters.template_key}%`);
      }

      query += ' ORDER BY created_at DESC';

      if (filters.limit) {
        query += ' LIMIT ?';
        params.push(filters.limit);
      }

      if (filters.offset) {
        query += ' OFFSET ?';
        params.push(filters.offset);
      }

      const results = await executeQuery(query, params);
      return results.map(row => new SMSTemplate(row));
    } catch (error) {
      logger.error('Error finding SMS templates:', error);
      throw error;
    }
  }

  /**
   * Update template
   */
  async update(updateData) {
    try {
      const query = `
        UPDATE sms_templates 
        SET template_key = ?, message_ar = ?, message_en = ?, 
            is_active = ?, updated_at = NOW()
        WHERE id = ?
      `;

      await executeQuery(query, [
        updateData.template_key || this.template_key,
        updateData.message_ar || this.message_ar,
        updateData.message_en || this.message_en,
        updateData.is_active !== undefined ? updateData.is_active : this.is_active,
        this.id
      ]);

      // Update instance properties
      Object.assign(this, updateData);
      this.updated_at = new Date();

      return this;
    } catch (error) {
      logger.error('Error updating SMS template:', error);
      throw error;
    }
  }

  /**
   * Delete template
   */
  async delete() {
    try {
      const query = 'DELETE FROM sms_templates WHERE id = ?';
      await executeQuery(query, [this.id]);
      return true;
    } catch (error) {
      logger.error('Error deleting SMS template:', error);
      throw error;
    }
  }

  /**
   * Render template with variables
   */
  render(variables = {}, language = 'en') {
    try {
      const message = language === 'ar' ? this.message_ar : this.message_en;
      const renderedMessage = this.substituteVariables(message, variables);

      return {
        message: renderedMessage
      };
    } catch (error) {
      logger.error('Error rendering SMS template:', error);
      throw error;
    }
  }

  /**
   * Substitute variables in template
   */
  substituteVariables(template, variables) {
    if (!template) return '';

    let result = template;
    
    // Replace {variable} with actual values
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      result = result.replace(regex, variables[key] || '');
    });

    // Remove any remaining {variable} placeholders
    result = result.replace(/\{[^}]+\}/g, '');

    return result;
  }

  /**
   * Validate template data
   */
  static validate(templateData) {
    const errors = [];

    if (!templateData.template_key) {
      errors.push('Template key is required');
    }

    if (!templateData.message_en && !templateData.message_ar) {
      errors.push('At least one message (English or Arabic) is required');
    }

    if (templateData.template_key && templateData.template_key.length > 100) {
      errors.push('Template key must be less than 100 characters');
    }

    // Check SMS length limits (160 characters for single SMS)
    if (templateData.message_en && templateData.message_en.length > 160) {
      errors.push('English message must be less than 160 characters for single SMS');
    }

    if (templateData.message_ar && templateData.message_ar.length > 160) {
      errors.push('Arabic message must be less than 160 characters for single SMS');
    }

    return errors;
  }

  /**
   * Get template statistics
   */
  static async getStatistics() {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_templates,
          SUM(CASE WHEN is_active = true THEN 1 ELSE 0 END) as active_templates,
          SUM(CASE WHEN is_active = false THEN 1 ELSE 0 END) as inactive_templates
        FROM sms_templates
      `;

      const results = await executeQuery(query);
      return results[0];
    } catch (error) {
      logger.error('Error getting SMS template statistics:', error);
      throw error;
    }
  }
}

module.exports = SMSTemplate; 