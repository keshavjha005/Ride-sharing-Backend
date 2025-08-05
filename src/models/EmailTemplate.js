const { executeQuery } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

class EmailTemplate {
  constructor(data = {}) {
    this.id = data.id || uuidv4();
    this.template_key = data.template_key;
    this.subject_ar = data.subject_ar;
    this.subject_en = data.subject_en;
    this.body_ar = data.body_ar;
    this.body_en = data.body_en;
    this.html_ar = data.html_ar;
    this.html_en = data.html_en;
    this.is_active = data.is_active !== undefined ? data.is_active : true;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  /**
   * Create new email template
   */
  static async create(templateData) {
    try {
      const template = new EmailTemplate(templateData);
      
      const query = `
        INSERT INTO email_templates (
          id, template_key, subject_ar, subject_en, body_ar, body_en, 
          html_ar, html_en, is_active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `;

      await executeQuery(query, [
        template.id,
        template.template_key,
        template.subject_ar,
        template.subject_en,
        template.body_ar,
        template.body_en,
        template.html_ar,
        template.html_en,
        template.is_active
      ]);

      return template;
    } catch (error) {
      logger.error('Error creating email template:', error);
      throw error;
    }
  }

  /**
   * Find template by key
   */
  static async findByKey(templateKey) {
    try {
      const query = `
        SELECT * FROM email_templates 
        WHERE template_key = ? AND is_active = true
      `;
      
      const results = await executeQuery(query, [templateKey]);
      
      if (results.length === 0) {
        return null;
      }

      return new EmailTemplate(results[0]);
    } catch (error) {
      logger.error('Error finding email template by key:', error);
      throw error;
    }
  }

  /**
   * Find template by ID
   */
  static async findById(id) {
    try {
      const query = 'SELECT * FROM email_templates WHERE id = ?';
      const results = await executeQuery(query, [id]);
      
      if (results.length === 0) {
        return null;
      }

      return new EmailTemplate(results[0]);
    } catch (error) {
      logger.error('Error finding email template by ID:', error);
      throw error;
    }
  }

  /**
   * Find all templates with filters
   */
  static async findAll(filters = {}) {
    try {
      let query = 'SELECT * FROM email_templates WHERE 1=1';
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
      return results.map(row => new EmailTemplate(row));
    } catch (error) {
      logger.error('Error finding email templates:', error);
      throw error;
    }
  }

  /**
   * Update template
   */
  async update(updateData) {
    try {
      const query = `
        UPDATE email_templates 
        SET template_key = ?, subject_ar = ?, subject_en = ?, 
            body_ar = ?, body_en = ?, html_ar = ?, html_en = ?, 
            is_active = ?, updated_at = NOW()
        WHERE id = ?
      `;

      await executeQuery(query, [
        updateData.template_key || this.template_key,
        updateData.subject_ar || this.subject_ar,
        updateData.subject_en || this.subject_en,
        updateData.body_ar || this.body_ar,
        updateData.body_en || this.body_en,
        updateData.html_ar || this.html_ar,
        updateData.html_en || this.html_en,
        updateData.is_active !== undefined ? updateData.is_active : this.is_active,
        this.id
      ]);

      // Update instance properties
      Object.assign(this, updateData);
      this.updated_at = new Date();

      return this;
    } catch (error) {
      logger.error('Error updating email template:', error);
      throw error;
    }
  }

  /**
   * Delete template
   */
  async delete() {
    try {
      const query = 'DELETE FROM email_templates WHERE id = ?';
      await executeQuery(query, [this.id]);
      return true;
    } catch (error) {
      logger.error('Error deleting email template:', error);
      throw error;
    }
  }

  /**
   * Render template with variables
   */
  render(variables = {}, language = 'en') {
    try {
      const subject = language === 'ar' ? this.subject_ar : this.subject_en;
      const body = language === 'ar' ? this.body_ar : this.body_en;
      const html = language === 'ar' ? this.html_ar : this.html_en;

      const renderedSubject = this.substituteVariables(subject, variables);
      const renderedBody = this.substituteVariables(body, variables);
      const renderedHtml = this.substituteVariables(html, variables);

      return {
        subject: renderedSubject,
        text: renderedBody,
        html: renderedHtml
      };
    } catch (error) {
      logger.error('Error rendering email template:', error);
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

    if (!templateData.subject_en && !templateData.subject_ar) {
      errors.push('At least one subject (English or Arabic) is required');
    }

    if (!templateData.body_en && !templateData.body_ar) {
      errors.push('At least one body (English or Arabic) is required');
    }

    if (templateData.template_key && templateData.template_key.length > 100) {
      errors.push('Template key must be less than 100 characters');
    }

    if (templateData.subject_en && templateData.subject_en.length > 255) {
      errors.push('English subject must be less than 255 characters');
    }

    if (templateData.subject_ar && templateData.subject_ar.length > 255) {
      errors.push('Arabic subject must be less than 255 characters');
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
        FROM email_templates
      `;

      const results = await executeQuery(query);
      return results[0];
    } catch (error) {
      logger.error('Error getting email template statistics:', error);
      throw error;
    }
  }
}

module.exports = EmailTemplate; 