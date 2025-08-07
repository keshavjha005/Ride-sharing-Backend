const { v4: uuidv4 } = require('uuid');
const { executeQuery } = require('../config/database');
const logger = require('../utils/logger');

class UserVerificationStatus {
  constructor(data = {}) {
    this.id = data.id || uuidv4();
    this.user_id = data.user_id;
    this.overall_status = data.overall_status || 'not_verified';
    this.documents_submitted = data.documents_submitted || 0;
    this.documents_approved = data.documents_approved || 0;
    this.documents_rejected = data.documents_rejected || 0;
    this.last_submission_date = data.last_submission_date;
    this.verification_date = data.verification_date;
    this.verified_by = data.verified_by;
    this.rejection_reason = data.rejection_reason;
    this.created_at = data.created_at || new Date();
    this.updated_at = data.updated_at || new Date();
  }

  /**
   * Create or update user verification status
   */
  static async createOrUpdate(userId, statusData = {}) {
    try {
      // Check if status already exists
      const existing = await this.findByUserId(userId);
      
      if (existing) {
        return await this.update(userId, statusData);
      } else {
        return await this.create({ user_id: userId, ...statusData });
      }
    } catch (error) {
      logger.error('Failed to create or update user verification status', {
        error: error.message,
        userId,
      });
      throw error;
    }
  }

  /**
   * Create a new user verification status
   */
  static async create(statusData) {
    try {
      const status = new UserVerificationStatus(statusData);
      
      const query = `
        INSERT INTO user_verification_status (
          id, user_id, overall_status, documents_submitted, documents_approved, documents_rejected,
          last_submission_date, verification_date, verified_by, rejection_reason
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const params = [
        status.id,
        status.user_id,
        status.overall_status,
        status.documents_submitted,
        status.documents_approved,
        status.documents_rejected,
        status.last_submission_date,
        status.verification_date,
        status.verified_by,
        status.rejection_reason
      ];

      await executeQuery(query, params);
      
      logger.business('user_verification_status_created', { 
        userId: status.user_id, 
        overallStatus: status.overall_status 
      });
      
      return this.findByUserId(status.user_id);
    } catch (error) {
      logger.error('Failed to create user verification status', {
        error: error.message,
        userId: statusData.user_id,
      });
      throw error;
    }
  }

  /**
   * Find verification status by user ID
   */
  static async findByUserId(userId) {
    try {
      const query = `
        SELECT uvs.*, u.first_name, u.last_name, u.email
        FROM user_verification_status uvs
        LEFT JOIN users u ON uvs.user_id = u.id
        WHERE uvs.user_id = ?
      `;
      const results = await executeQuery(query, [userId]);
      
      return results[0] || null;
    } catch (error) {
      logger.error('Failed to find user verification status by user ID', {
        error: error.message,
        userId,
      });
      throw error;
    }
  }

  /**
   * Find verification status by ID
   */
  static async findById(id) {
    try {
      const query = `
        SELECT uvs.*, u.first_name, u.last_name, u.email
        FROM user_verification_status uvs
        LEFT JOIN users u ON uvs.user_id = u.id
        WHERE uvs.id = ?
      `;
      const results = await executeQuery(query, [id]);
      
      return results[0] || null;
    } catch (error) {
      logger.error('Failed to find user verification status by ID', {
        error: error.message,
        id,
      });
      throw error;
    }
  }

  /**
   * Find all verification statuses with pagination
   */
  static async findAll(page = 1, limit = 20, filters = {}) {
    try {
      let whereClause = 'WHERE 1=1';
      const params = [];

      if (filters.overall_status) {
        whereClause += ' AND uvs.overall_status = ?';
        params.push(filters.overall_status);
      }

      if (filters.user_id) {
        whereClause += ' AND uvs.user_id = ?';
        params.push(filters.user_id);
      }

      const offset = (parseInt(page) - 1) * parseInt(limit);
      const limitValue = parseInt(limit);

      const query = `
        SELECT uvs.*, u.first_name, u.last_name, u.email
        FROM user_verification_status uvs
        LEFT JOIN users u ON uvs.user_id = u.id
        ${whereClause}
        ORDER BY uvs.updated_at DESC
        LIMIT ${offset}, ${limitValue}
      `;

      const statuses = await executeQuery(query, params);

      // Get total count for pagination
      const countQuery = `
        SELECT COUNT(*) as total
        FROM user_verification_status uvs
        ${whereClause}
      `;

      const countResult = await executeQuery(countQuery, params);
      const total = countResult[0].total;

      return {
        statuses,
        pagination: {
          page: parseInt(page),
          limit: limitValue,
          total,
          pages: Math.ceil(total / limitValue)
        }
      };
    } catch (error) {
      logger.error('Failed to find user verification statuses', {
        error: error.message,
        filters,
      });
      throw error;
    }
  }

  /**
   * Update user verification status
   */
  static async update(userId, updateData) {
    try {
      const fields = [];
      const params = [];

      // Build dynamic update query
      Object.keys(updateData).forEach(key => {
        fields.push(`${key} = ?`);
        params.push(updateData[key]);
      });

      fields.push('updated_at = CURRENT_TIMESTAMP');
      params.push(userId);

      const query = `
        UPDATE user_verification_status 
        SET ${fields.join(', ')}
        WHERE user_id = ?
      `;

      const result = await executeQuery(query, params);
      
      if (result.affectedRows === 0) {
        throw new Error('User verification status not found');
      }

      logger.business('user_verification_status_updated', { 
        userId, 
        updatedFields: Object.keys(updateData) 
      });
      
      return this.findByUserId(userId);
    } catch (error) {
      logger.error('Failed to update user verification status', {
        error: error.message,
        userId,
        updateData,
      });
      throw error;
    }
  }

  /**
   * Update overall verification status
   */
  static async updateOverallStatus(userId, status, adminId = null, rejectionReason = null) {
    try {
      const updateData = {
        overall_status: status,
        verification_date: new Date(),
        verified_by: adminId
      };

      if (rejectionReason) {
        updateData.rejection_reason = rejectionReason;
      }

      const result = await this.update(userId, updateData);
      
      logger.business('user_overall_verification_status_updated', { 
        userId, 
        status,
        adminId 
      });
      
      return result;
    } catch (error) {
      logger.error('Failed to update overall verification status', {
        error: error.message,
        userId,
        status,
      });
      throw error;
    }
  }

  /**
   * Update document counts
   */
  static async updateDocumentCounts(userId, counts) {
    try {
      const updateData = {
        documents_submitted: counts.submitted || 0,
        documents_approved: counts.approved || 0,
        documents_rejected: counts.rejected || 0,
        last_submission_date: new Date()
      };

      const result = await this.update(userId, updateData);
      
      logger.business('user_document_counts_updated', { 
        userId, 
        counts 
      });
      
      return result;
    } catch (error) {
      logger.error('Failed to update document counts', {
        error: error.message,
        userId,
        counts,
      });
      throw error;
    }
  }

  /**
   * Get verification status summary
   */
  static async getSummary() {
    try {
      const query = `
        SELECT 
          overall_status,
          COUNT(*) as count
        FROM user_verification_status 
        GROUP BY overall_status
      `;

      const results = await executeQuery(query);
      
      const summary = {
        not_verified: 0,
        pending: 0,
        verified: 0,
        rejected: 0,
        total: 0
      };

      results.forEach(row => {
        summary[row.overall_status] = row.count;
        summary.total += row.count;
      });

      return summary;
    } catch (error) {
      logger.error('Failed to get verification status summary', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get users pending verification
   */
  static async getPendingUsers(page = 1, limit = 20) {
    try {
      return await this.findAll(page, limit, { overall_status: 'pending' });
    } catch (error) {
      logger.error('Failed to get pending users', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get users by verification status
   */
  static async getUsersByStatus(status, page = 1, limit = 20) {
    try {
      return await this.findAll(page, limit, { overall_status: status });
    } catch (error) {
      logger.error('Failed to get users by verification status', {
        error: error.message,
        status,
      });
      throw error;
    }
  }

  /**
   * Calculate and update verification status based on documents
   */
  static async calculateVerificationStatus(userId) {
    try {
      const UserDocument = require('./UserDocument');
      const stats = await UserDocument.getUserDocumentStats(userId);
      
      let overallStatus = 'not_verified';
      
      if (stats.total_documents > 0) {
        if (stats.rejected_documents > 0) {
          overallStatus = 'rejected';
        } else if (stats.approved_documents === stats.total_documents) {
          overallStatus = 'verified';
        } else {
          overallStatus = 'pending';
        }
      }

      await this.updateDocumentCounts(userId, {
        submitted: stats.total_documents,
        approved: stats.approved_documents,
        rejected: stats.rejected_documents
      });

      await this.updateOverallStatus(userId, overallStatus);
      
      return { overallStatus, stats };
    } catch (error) {
      logger.error('Failed to calculate verification status', {
        error: error.message,
        userId,
      });
      throw error;
    }
  }
}

module.exports = UserVerificationStatus; 