const { v4: uuidv4 } = require('uuid');
const { executeQuery } = require('../config/database');
const logger = require('../utils/logger');

class RequiredDocument {
  constructor(data = {}) {
    this.id = data.id || uuidv4();
    this.document_type = data.document_type;
    this.document_name_ar = data.document_name_ar;
    this.document_name_en = data.document_name_en;
    this.description_ar = data.description_ar;
    this.description_en = data.description_en;
    this.is_required = data.is_required !== undefined ? data.is_required : true;
    this.is_active = data.is_active !== undefined ? data.is_active : true;
    this.file_types = data.file_types || ['image/jpeg', 'image/png', 'application/pdf'];
    this.max_file_size = data.max_file_size || 5242880; // 5MB
    this.max_files_per_document = data.max_files_per_document || 3;
    this.created_by = data.created_by;
    this.created_at = data.created_at || new Date();
    this.updated_at = data.updated_at || new Date();
  }

  /**
   * Create a new required document
   */
  static async create(documentData) {
    try {
      const document = new RequiredDocument(documentData);
      
      const query = `
        INSERT INTO required_documents (
          id, document_type, document_name_ar, document_name_en, description_ar, description_en,
          is_required, is_active, file_types, max_file_size, max_files_per_document, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const params = [
        document.id,
        document.document_type,
        document.document_name_ar,
        document.document_name_en,
        document.description_ar,
        document.description_en,
        document.is_required,
        document.is_active,
        JSON.stringify(document.file_types),
        document.max_file_size,
        document.max_files_per_document,
        document.created_by
      ];

      await executeQuery(query, params);
      
      logger.business('required_document_created', { 
        documentId: document.id, 
        documentType: document.document_type,
        createdBy: document.created_by 
      });
      
      return this.findById(document.id);
    } catch (error) {
      logger.error('Failed to create required document', {
        error: error.message,
        documentType: documentData.document_type,
      });
      throw error;
    }
  }

  /**
   * Find document by ID
   */
  static async findById(id) {
    try {
      const query = 'SELECT * FROM required_documents WHERE id = ?';
      const documents = await executeQuery(query, [id]);
      
      if (documents.length === 0) {
        return null;
      }

      const document = documents[0];
      document.file_types = this.parseFileTypes(document.file_types);
      
      return document;
    } catch (error) {
      logger.error('Failed to find required document by ID', {
        error: error.message,
        documentId: id,
      });
      throw error;
    }
  }

  /**
   * Find all required documents
   */
  static async findAll(filters = {}) {
    try {
      let whereClause = 'WHERE 1=1';
      const params = [];

      if (filters.is_active !== undefined) {
        whereClause += ' AND is_active = ?';
        params.push(filters.is_active);
      }

      if (filters.document_type) {
        whereClause += ' AND document_type = ?';
        params.push(filters.document_type);
      }

      if (filters.is_required !== undefined) {
        whereClause += ' AND is_required = ?';
        params.push(filters.is_required);
      }

      const query = `
        SELECT * FROM required_documents 
        ${whereClause}
        ORDER BY created_at DESC
      `;

      const documents = await executeQuery(query, params);
      
      // Parse file_types JSON for each document
      return documents.map(doc => ({
        ...doc,
        file_types: this.parseFileTypes(doc.file_types)
      }));
    } catch (error) {
      logger.error('Failed to find required documents', {
        error: error.message,
        filters,
      });
      throw error;
    }
  }

  /**
   * Update required document
   */
  static async update(id, updateData) {
    try {
      const fields = [];
      const params = [];

      // Build dynamic update query
      Object.keys(updateData).forEach(key => {
        if (key === 'file_types') {
          fields.push(`${key} = ?`);
          params.push(JSON.stringify(updateData[key]));
        } else {
          fields.push(`${key} = ?`);
          params.push(updateData[key]);
        }
      });

      fields.push('updated_at = CURRENT_TIMESTAMP');
      params.push(id);

      const query = `
        UPDATE required_documents 
        SET ${fields.join(', ')}
        WHERE id = ?
      `;

      const result = await executeQuery(query, params);
      
      if (result.affectedRows === 0) {
        throw new Error('Required document not found');
      }

      logger.business('required_document_updated', { 
        documentId: id, 
        updatedFields: Object.keys(updateData) 
      });
      
      return this.findById(id);
    } catch (error) {
      logger.error('Failed to update required document', {
        error: error.message,
        documentId: id,
        updateData,
      });
      throw error;
    }
  }

  /**
   * Delete required document
   */
  static async delete(id) {
    try {
      const query = 'DELETE FROM required_documents WHERE id = ?';
      const result = await executeQuery(query, [id]);
      
      if (result.affectedRows === 0) {
        throw new Error('Required document not found');
      }

      logger.business('required_document_deleted', { documentId: id });
      
      return { success: true };
    } catch (error) {
      logger.error('Failed to delete required document', {
        error: error.message,
        documentId: id,
      });
      throw error;
    }
  }

  /**
   * Get active required documents
   */
  static async getActiveDocuments() {
    try {
      return await this.findAll({ is_active: true });
    } catch (error) {
      logger.error('Failed to get active required documents', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get required documents by type
   */
  static async findByType(documentType) {
    try {
      return await this.findAll({ document_type: documentType });
    } catch (error) {
      logger.error('Failed to find required documents by type', {
        error: error.message,
        documentType,
      });
      throw error;
    }
  }

  /**
   * Parse file_types field safely
   */
  static parseFileTypes(fileTypes) {
    if (!fileTypes) {
      return [];
    }

    try {
      // Try to parse as JSON first
      if (typeof fileTypes === 'string') {
        return JSON.parse(fileTypes);
      }
      return fileTypes;
    } catch (error) {
      // If JSON parsing fails, try to handle as comma-separated string
      if (typeof fileTypes === 'string') {
        // Remove quotes and split by comma
        const cleaned = fileTypes.replace(/['"]/g, '').trim();
        if (cleaned.includes(',')) {
          return cleaned.split(',').map(item => item.trim()).filter(item => item);
        } else if (cleaned) {
          return [cleaned];
        }
      }
      return [];
    }
  }
}

module.exports = RequiredDocument; 