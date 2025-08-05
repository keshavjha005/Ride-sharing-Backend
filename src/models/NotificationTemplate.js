const { executeQuery } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

class NotificationTemplate {
  constructor(data = {}) {
    this.id = data.id || uuidv4();
    this.template_key = data.template_key;
    this.title_ar = data.title_ar;
    this.title_en = data.title_en;
    this.body_ar = data.body_ar;
    this.body_en = data.body_en;
    this.notification_type = data.notification_type;
    this.category = data.category;
    this.priority = data.priority || 'normal';
    this.is_active = data.is_active !== undefined ? data.is_active : true;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  /**
   * Create a new notification template
   */
  static async create(templateData) {
    try {
      const template = new NotificationTemplate(templateData);
      
      const query = `
        INSERT INTO notification_templates (
          id, template_key, title_ar, title_en, body_ar, body_en,
          notification_type, category, priority, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const params = [
        template.id,
        template.template_key,
        template.title_ar,
        template.title_en,
        template.body_ar,
        template.body_en,
        template.notification_type,
        template.category,
        template.priority,
        template.is_active
      ];

      await executeQuery(query, params);
      logger.info(`Notification template created: ${template.template_key}`);
      
      return template;
    } catch (error) {
      logger.error('Error creating notification template:', error);
      throw error;
    }
  }

  /**
   * Find template by ID
   */
  static async findById(id) {
    try {
      const query = 'SELECT * FROM notification_templates WHERE id = ?';
      const results = await executeQuery(query, [id]);
      
      if (results.length === 0) {
        return null;
      }
      
      return new NotificationTemplate(results[0]);
    } catch (error) {
      logger.error('Error finding notification template by ID:', error);
      throw error;
    }
  }

  /**
   * Find template by key
   */
  static async findByKey(templateKey) {
    try {
      const query = 'SELECT * FROM notification_templates WHERE template_key = ? AND is_active = true';
      const results = await executeQuery(query, [templateKey]);
      
      if (results.length === 0) {
        return null;
      }
      
      return new NotificationTemplate(results[0]);
    } catch (error) {
      logger.error('Error finding notification template by key:', error);
      throw error;
    }
  }

  /**
   * Find all templates with optional filters
   */
  static async findAll(filters = {}) {
    try {
      let query = 'SELECT * FROM notification_templates WHERE 1=1';
      const params = [];

      if (filters.notification_type) {
        query += ' AND notification_type = ?';
        params.push(filters.notification_type);
      }

      if (filters.category) {
        query += ' AND category = ?';
        params.push(filters.category);
      }

      if (filters.is_active !== undefined) {
        query += ' AND is_active = ?';
        params.push(filters.is_active);
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
      return results.map(template => new NotificationTemplate(template));
    } catch (error) {
      logger.error('Error finding notification templates:', error);
      throw error;
    }
  }

  /**
   * Update template
   */
  async update(updateData) {
    try {
      const allowedFields = [
        'title_ar', 'title_en', 'body_ar', 'body_en',
        'notification_type', 'category', 'priority', 'is_active'
      ];

      const updates = [];
      const params = [];

      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          updates.push(`${field} = ?`);
          params.push(updateData[field]);
        }
      }

      if (updates.length === 0) {
        return this;
      }

      updates.push('updated_at = NOW()');
      params.push(this.id);

      const query = `
        UPDATE notification_templates 
        SET ${updates.join(', ')}
        WHERE id = ?
      `;

      await executeQuery(query, params);
      
      // Update local object
      Object.assign(this, updateData);
      this.updated_at = new Date();
      
      logger.info(`Notification template updated: ${this.template_key}`);
      return this;
    } catch (error) {
      logger.error('Error updating notification template:', error);
      throw error;
    }
  }

  /**
   * Delete template
   */
  async delete() {
    try {
      const query = 'DELETE FROM notification_templates WHERE id = ?';
      await executeQuery(query, [this.id]);
      
      logger.info(`Notification template deleted: ${this.template_key}`);
      return true;
    } catch (error) {
      logger.error('Error deleting notification template:', error);
      throw error;
    }
  }

  /**
   * Render template with variables
   */
  render(variables = {}, language = 'en') {
    try {
      let title = language === 'ar' ? this.title_ar : this.title_en;
      let body = language === 'ar' ? this.body_ar : this.body_en;

      // Replace variables in template
      for (const [key, value] of Object.entries(variables)) {
        const placeholder = `{${key}}`;
        title = title.replace(new RegExp(placeholder, 'g'), value);
        body = body.replace(new RegExp(placeholder, 'g'), value);
      }

      return {
        title,
        body,
        notification_type: this.notification_type,
        category: this.category,
        priority: this.priority
      };
    } catch (error) {
      logger.error('Error rendering notification template:', error);
      throw error;
    }
  }

  /**
   * Get template statistics
   */
  static async getStatistics() {
    try {
      const query = `
        SELECT 
          notification_type,
          category,
          COUNT(*) as count,
          SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_count
        FROM notification_templates 
        GROUP BY notification_type, category
        ORDER BY notification_type, category
      `;
      
      const results = await executeQuery(query);
      return results;
    } catch (error) {
      logger.error('Error getting notification template statistics:', error);
      throw error;
    }
  }

  /**
   * Bulk create templates
   */
  static async bulkCreate(templates) {
    try {
      const query = `
        INSERT INTO notification_templates (
          id, template_key, title_ar, title_en, body_ar, body_en,
          notification_type, category, priority, is_active
        ) VALUES ?
      `;
      
      const values = templates.map(template => [
        template.id || uuidv4(),
        template.template_key,
        template.title_ar,
        template.title_en,
        template.body_ar,
        template.body_en,
        template.notification_type,
        template.category,
        template.priority || 'normal',
        template.is_active !== undefined ? template.is_active : true
      ]);

      await executeQuery(query, [values]);
      logger.info(`Bulk created ${templates.length} notification templates`);
      
      return templates.map(template => new NotificationTemplate(template));
    } catch (error) {
      logger.error('Error bulk creating notification templates:', error);
      throw error;
    }
  }

  /**
   * Validate template data
   */
  static validate(templateData) {
    const errors = [];

    if (!templateData.template_key) {
      errors.push('Template key is required');
    }

    if (!templateData.notification_type) {
      errors.push('Notification type is required');
    }

    if (!templateData.title_en && !templateData.title_ar) {
      errors.push('At least one title (English or Arabic) is required');
    }

    if (!templateData.body_en && !templateData.body_ar) {
      errors.push('At least one body (English or Arabic) is required');
    }

    const validTypes = ['chat', 'booking', 'ride', 'payment', 'system', 'marketing'];
    if (templateData.notification_type && !validTypes.includes(templateData.notification_type)) {
      errors.push(`Invalid notification type. Must be one of: ${validTypes.join(', ')}`);
    }

    const validPriorities = ['low', 'normal', 'high', 'urgent'];
    if (templateData.priority && !validPriorities.includes(templateData.priority)) {
      errors.push(`Invalid priority. Must be one of: ${validPriorities.join(', ')}`);
    }

    return errors;
  }
}

module.exports = NotificationTemplate; 