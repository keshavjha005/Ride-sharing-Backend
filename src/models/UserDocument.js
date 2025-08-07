const { v4: uuidv4 } = require('uuid');
const { executeQuery } = require('../config/database');
const logger = require('../utils/logger');

class UserDocument {
  constructor(data = {}) {
    this.id = data.id || uuidv4();
    this.user_id = data.user_id;
    this.document_type_id = data.document_type_id;
    this.file_url = data.file_url;
    this.file_name = data.file_name;
    this.file_size = data.file_size;
    this.file_type = data.file_type;
    this.upload_date = data.upload_date || new Date();
    this.verification_status = data.verification_status || 'pending';
    this.admin_notes = data.admin_notes;
    this.reviewed_by = data.reviewed_by;
    this.reviewed_at = data.reviewed_at;
    this.created_at = data.created_at || new Date();
    this.updated_at = data.updated_at || new Date();
  }

  /**
   * Create a new user document
   */
  static async create(documentData) {
    try {
      const document = new UserDocument(documentData);
      
      const query = `
        INSERT INTO user_documents (
          id, user_id, document_type_id, file_url, file_name, file_size, file_type,
          upload_date, verification_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const params = [
        document.id,
        document.user_id,
        document.document_type_id,
        document.file_url,
        document.file_name,
        document.file_size,
        document.file_type,
        document.upload_date,
        document.verification_status
      ];

      await executeQuery(query, params);
      
      logger.business('user_document_uploaded', { 
        documentId: document.id, 
        userId: document.user_id,
        documentTypeId: document.document_type_id 
      });
      
      return this.findById(document.id);
    } catch (error) {
      logger.error('Failed to create user document', {
        error: error.message,
        userId: documentData.user_id,
      });
      throw error;
    }
  }

  /**
   * Find document by ID
   */
  static async findById(id) {
    try {
      const query = `
        SELECT ud.*, rd.document_type, rd.document_name_ar, rd.document_name_en
        FROM user_documents ud
        LEFT JOIN required_documents rd ON ud.document_type_id = rd.id
        WHERE ud.id = ?
      `;
      const documents = await executeQuery(query, [id]);
      
      return documents[0] || null;
    } catch (error) {
      logger.error('Failed to find user document by ID', {
        error: error.message,
        documentId: id,
      });
      throw error;
    }
  }

  /**
   * Find documents by user ID
   */
  static async findByUserId(userId, filters = {}) {
    try {
      let whereClause = 'WHERE ud.user_id = ?';
      const params = [userId];

      if (filters.verification_status) {
        whereClause += ' AND ud.verification_status = ?';
        params.push(filters.verification_status);
      }

      if (filters.document_type_id) {
        whereClause += ' AND ud.document_type_id = ?';
        params.push(filters.document_type_id);
      }

      const query = `
        SELECT ud.*, rd.document_type, rd.document_name_ar, rd.document_name_en
        FROM user_documents ud
        LEFT JOIN required_documents rd ON ud.document_type_id = rd.id
        ${whereClause}
        ORDER BY ud.upload_date DESC
      `;

      return await executeQuery(query, params);
    } catch (error) {
      logger.error('Failed to find user documents by user ID', {
        error: error.message,
        userId,
      });
      throw error;
    }
  }

  /**
   * Find all user documents with pagination
   */
  static async findAll(page = 1, limit = 20, filters = {}) {
    try {
      let whereClause = 'WHERE 1=1';
      const params = [];

      if (filters.user_id) {
        whereClause += ' AND ud.user_id = ?';
        params.push(filters.user_id);
      }

      if (filters.verification_status) {
        whereClause += ' AND ud.verification_status = ?';
        params.push(filters.verification_status);
      }

      if (filters.document_type_id) {
        whereClause += ' AND ud.document_type_id = ?';
        params.push(filters.document_type_id);
      }

      if (filters.document_type) {
        whereClause += ' AND rd.document_type = ?';
        params.push(filters.document_type);
      }

      const offset = (parseInt(page) - 1) * parseInt(limit);
      const limitValue = parseInt(limit);

      // Add pagination parameters
      params.push(offset, limitValue);

      const query = `
        SELECT ud.*, rd.document_type, rd.document_name_ar, rd.document_name_en,
               u.first_name, u.last_name, u.email
        FROM user_documents ud
        LEFT JOIN required_documents rd ON ud.document_type_id = rd.id
        LEFT JOIN users u ON ud.user_id = u.id
        ${whereClause}
        ORDER BY ud.upload_date DESC
        LIMIT ${offset}, ${limitValue}
      `;

      const documents = await executeQuery(query, params.slice(0, -2));

      // Get total count for pagination
      const countQuery = `
        SELECT COUNT(*) as total
        FROM user_documents ud
        LEFT JOIN required_documents rd ON ud.document_type_id = rd.id
        ${whereClause}
      `;

      const countResult = await executeQuery(countQuery, params.slice(0, -2));
      const total = countResult[0].total;

      return {
        documents,
        pagination: {
          page: parseInt(page),
          limit: limitValue,
          total,
          pages: Math.ceil(total / limitValue)
        }
      };
    } catch (error) {
      logger.error('Failed to find user documents', {
        error: error.message,
        filters,
      });
      throw error;
    }
  }

  /**
   * Update user document
   */
  static async update(id, updateData) {
    try {
      const fields = [];
      const params = [];

      // Build dynamic update query
      Object.keys(updateData).forEach(key => {
        fields.push(`${key} = ?`);
        params.push(updateData[key]);
      });

      fields.push('updated_at = CURRENT_TIMESTAMP');
      params.push(id);

      const query = `
        UPDATE user_documents 
        SET ${fields.join(', ')}
        WHERE id = ?
      `;

      const result = await executeQuery(query, params);
      
      if (result.affectedRows === 0) {
        throw new Error('User document not found');
      }

      logger.business('user_document_updated', { 
        documentId: id, 
        updatedFields: Object.keys(updateData) 
      });
      
      return this.findById(id);
    } catch (error) {
      logger.error('Failed to update user document', {
        error: error.message,
        documentId: id,
        updateData,
      });
      throw error;
    }
  }

  /**
   * Update verification status
   */
  static async updateVerificationStatus(id, status, adminId, notes = null) {
    try {
      const updateData = {
        verification_status: status,
        reviewed_by: adminId,
        reviewed_at: new Date()
      };

      if (notes) {
        updateData.admin_notes = notes;
      }

      const result = await this.update(id, updateData);
      
      logger.business('user_document_verification_updated', { 
        documentId: id, 
        status,
        adminId 
      });
      
      return result;
    } catch (error) {
      logger.error('Failed to update user document verification status', {
        error: error.message,
        documentId: id,
        status,
      });
      throw error;
    }
  }

  /**
   * Delete user document
   */
  static async delete(id) {
    try {
      const query = 'DELETE FROM user_documents WHERE id = ?';
      const result = await executeQuery(query, [id]);
      
      if (result.affectedRows === 0) {
        throw new Error('User document not found');
      }

      logger.business('user_document_deleted', { documentId: id });
      
      return { success: true };
    } catch (error) {
      logger.error('Failed to delete user document', {
        error: error.message,
        documentId: id,
      });
      throw error;
    }
  }

  /**
   * Get documents pending verification
   */
  static async getPendingDocuments(page = 1, limit = 20) {
    try {
      return await this.findAll(page, limit, { verification_status: 'pending' });
    } catch (error) {
      logger.error('Failed to get pending documents', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get documents by verification status
   */
  static async getDocumentsByStatus(status, page = 1, limit = 20) {
    try {
      return await this.findAll(page, limit, { verification_status: status });
    } catch (error) {
      logger.error('Failed to get documents by status', {
        error: error.message,
        status,
      });
      throw error;
    }
  }

  /**
   * Get user document statistics
   */
  static async getUserDocumentStats(userId) {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_documents,
          SUM(CASE WHEN verification_status = 'pending' THEN 1 ELSE 0 END) as pending_documents,
          SUM(CASE WHEN verification_status = 'approved' THEN 1 ELSE 0 END) as approved_documents,
          SUM(CASE WHEN verification_status = 'rejected' THEN 1 ELSE 0 END) as rejected_documents
        FROM user_documents 
        WHERE user_id = ?
      `;

      const result = await executeQuery(query, [userId]);
      return result[0];
    } catch (error) {
      logger.error('Failed to get user document statistics', {
        error: error.message,
        userId,
      });
      throw error;
    }
  }
}

module.exports = UserDocument; 