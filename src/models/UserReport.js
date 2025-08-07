const db = require('../config/database');

class UserReport {
  /**
   * Find report by ID
   */
  static async findById(id) {
    try {
      const [rows] = await db.executeQuery(`
        SELECT 
          ur.*,
          reported.email as reported_email,
          reported.first_name as reported_first_name,
          reported.last_name as reported_last_name,
          reporter.email as reporter_email,
          reporter.first_name as reporter_first_name,
          reporter.last_name as reporter_last_name,
          admin.email as admin_email,
          admin.first_name as admin_first_name,
          admin.last_name as admin_last_name
        FROM user_reports ur
        LEFT JOIN users reported ON ur.reported_user_id = reported.id
        LEFT JOIN users reporter ON ur.reporter_user_id = reporter.id
        LEFT JOIN admin_users admin ON ur.resolved_by = admin.id
        WHERE ur.id = ?
      `, [id]);
      
      return rows[0] || null;
    } catch (error) {
      console.error('Error finding user report by ID:', error);
      throw error;
    }
  }

  /**
   * Create user report
   */
  static async create(reportData) {
    try {
      const { 
        id, reported_user_id, reporter_user_id, report_type, 
        report_reason_ar, report_reason_en, evidence_files 
      } = reportData;
      
      const [result] = await db.executeQuery(`
        INSERT INTO user_reports (
          id, reported_user_id, reporter_user_id, report_type,
          report_reason_ar, report_reason_en, evidence_files
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [id, reported_user_id, reporter_user_id, report_type, report_reason_ar, report_reason_en, evidence_files]);

      return { id, ...reportData };
    } catch (error) {
      console.error('Error creating user report:', error);
      throw error;
    }
  }

  /**
   * Update report status
   */
  static async updateStatus(id, status, adminId, adminNotes = null) {
    try {
      const updateData = {
        status,
        resolved_by: adminId,
        resolved_at: status === 'resolved' || status === 'dismissed' ? new Date() : null
      };

      if (adminNotes) {
        updateData.admin_notes = adminNotes;
      }

      const fields = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
      const values = Object.values(updateData);
      values.push(id);

      const [result] = await db.executeQuery(`
        UPDATE user_reports 
        SET ${fields}
        WHERE id = ?
      `, values);

      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error updating report status:', error);
      throw error;
    }
  }

  /**
   * Get all reports with pagination and filters
   */
  static async findAll(page = 1, limit = 20, filters = {}) {
    try {
      let whereClause = 'WHERE ur.id IS NOT NULL';
      const params = [];

      // Apply filters
      if (filters.status) {
        whereClause += ' AND ur.status = ?';
        params.push(filters.status);
      }

      if (filters.report_type) {
        whereClause += ' AND ur.report_type = ?';
        params.push(filters.report_type);
      }

      if (filters.reported_user_id) {
        whereClause += ' AND ur.reported_user_id = ?';
        params.push(filters.reported_user_id);
      }

      if (filters.date_from) {
        whereClause += ' AND DATE(ur.created_at) >= ?';
        params.push(filters.date_from);
      }

      if (filters.date_to) {
        whereClause += ' AND DATE(ur.created_at) <= ?';
        params.push(filters.date_to);
      }

      const offset = (parseInt(page) - 1) * parseInt(limit);
      const limitValue = parseInt(limit);

      const rows = await db.executeQuery(`
        SELECT 
          ur.*,
          reported.email as reported_email,
          reported.first_name as reported_first_name,
          reported.last_name as reported_last_name,
          reporter.email as reporter_email,
          reporter.first_name as reporter_first_name,
          reporter.last_name as reporter_last_name,
          admin.email as admin_email,
          admin.first_name as admin_first_name,
          admin.last_name as admin_last_name
        FROM user_reports ur
        LEFT JOIN users reported ON ur.reported_user_id = reported.id
        LEFT JOIN users reporter ON ur.reporter_user_id = reporter.id
        LEFT JOIN admin_users admin ON ur.resolved_by = admin.id
        ${whereClause}
        ORDER BY ur.created_at DESC
        LIMIT ${limitValue} OFFSET ${offset}
      `, params);

      // Get total count
      const countResult = await db.executeQuery(`
        SELECT COUNT(*) as total
        FROM user_reports ur
        ${whereClause}
      `, params.slice(0, -2));

              return {
          data: rows,
          pagination: {
            page,
            limit,
            total: countResult[0].total,
            totalPages: Math.ceil(countResult[0].total / limit)
          }
        };
    } catch (error) {
      console.error('Error finding all user reports:', error);
      throw error;
    }
  }

  /**
   * Get reports by user ID
   */
  static async findByReportedUserId(userId) {
    try {
      const [rows] = await db.executeQuery(`
        SELECT 
          ur.*,
          reporter.email as reporter_email,
          reporter.first_name as reporter_first_name,
          reporter.last_name as reporter_last_name,
          admin.email as admin_email,
          admin.first_name as admin_first_name,
          admin.last_name as admin_last_name
        FROM user_reports ur
        LEFT JOIN users reporter ON ur.reporter_user_id = reporter.id
        LEFT JOIN admin_users admin ON ur.resolved_by = admin.id
        WHERE ur.reported_user_id = ?
        ORDER BY ur.created_at DESC
      `, [userId]);
      
      return rows;
    } catch (error) {
      console.error('Error finding reports by reported user ID:', error);
      throw error;
    }
  }

  /**
   * Get reports summary
   */
  static async getSummary() {
    try {
      const [rows] = await db.executeQuery(`
        SELECT 
          COUNT(*) as total_reports,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_reports,
          COUNT(CASE WHEN status = 'investigating' THEN 1 END) as investigating_reports,
          COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_reports,
          COUNT(CASE WHEN status = 'dismissed' THEN 1 END) as dismissed_reports,
          COUNT(CASE WHEN report_type = 'inappropriate_behavior' THEN 1 END) as inappropriate_behavior,
          COUNT(CASE WHEN report_type = 'safety_concern' THEN 1 END) as safety_concern,
          COUNT(CASE WHEN report_type = 'fraud' THEN 1 END) as fraud,
          COUNT(CASE WHEN report_type = 'other' THEN 1 END) as other
        FROM user_reports
      `);

      return rows[0];
    } catch (error) {
      console.error('Error getting reports summary:', error);
      throw error;
    }
  }

  /**
   * Get recent reports
   */
  static async getRecentReports(limit = 10) {
    try {
      const [rows] = await db.executeQuery(`
        SELECT 
          ur.*,
          reported.email as reported_email,
          reported.first_name as reported_first_name,
          reported.last_name as reported_last_name,
          reporter.email as reporter_email,
          reporter.first_name as reporter_first_name,
          reporter.last_name as reporter_last_name
        FROM user_reports ur
        LEFT JOIN users reported ON ur.reported_user_id = reported.id
        LEFT JOIN users reporter ON ur.reporter_user_id = reporter.id
        ORDER BY ur.created_at DESC
        LIMIT ?
      `, [limit]);
      
      return rows;
    } catch (error) {
      console.error('Error getting recent reports:', error);
      throw error;
    }
  }
}

module.exports = UserReport; 