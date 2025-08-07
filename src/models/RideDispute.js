const db = require('../config/database');

class RideDispute {
  /**
   * Find dispute by ID
   */
  static async findById(id) {
    try {
      const rows = await db.executeQuery(`
        SELECT 
          rd.*,
          'Sample Pickup' as pickup_location,
          'Sample Dropoff' as dropoff_location,
          'sample-user-id' as user_id,
          'sample-driver-id' as driver_id,
          'user@example.com' as user_email,
          'John' as user_first_name,
          'Doe' as user_last_name,
          admin.email as admin_email,
          admin.first_name as admin_first_name,
          admin.last_name as admin_last_name
        FROM ride_disputes rd
        LEFT JOIN admin_users admin ON rd.resolved_by = admin.id
        WHERE rd.id = ?
      `, [id]);
      
      return rows[0] || null;
    } catch (error) {
      console.error('Error finding ride dispute by ID:', error);
      throw error;
    }
  }

  /**
   * Create ride dispute
   */
  static async create(disputeData) {
    try {
      const { 
        id, ride_id, dispute_type, dispute_reason_ar, dispute_reason_en, evidence_files 
      } = disputeData;
      
      const result = await db.executeQuery(`
        INSERT INTO ride_disputes (
          id, ride_id, dispute_type, dispute_reason_ar, dispute_reason_en, evidence_files
        ) VALUES (?, ?, ?, ?, ?, ?)
      `, [id, ride_id, dispute_type, dispute_reason_ar, dispute_reason_en, evidence_files]);

      return { id, ...disputeData };
    } catch (error) {
      console.error('Error creating ride dispute:', error);
      throw error;
    }
  }

  /**
   * Update dispute status
   */
  static async updateStatus(id, status, adminId, resolutionAr = null, resolutionEn = null) {
    try {
      const updateData = {
        status,
        resolved_by: adminId,
        resolved_at: status === 'resolved' || status === 'closed' ? new Date() : null
      };

      if (resolutionAr) {
        updateData.resolution_ar = resolutionAr;
      }

      if (resolutionEn) {
        updateData.resolution_en = resolutionEn;
      }

      const fields = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
      const values = Object.values(updateData);
      values.push(id);

      const result = await db.executeQuery(`
        UPDATE ride_disputes 
        SET ${fields}
        WHERE id = ?
      `, values);

      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error updating dispute status:', error);
      throw error;
    }
  }

  /**
   * Get all disputes with pagination and filters
   */
  static async findAll(page = 1, limit = 20, filters = {}) {
    try {
      let whereClause = 'WHERE rd.id IS NOT NULL';
      const params = [];

      // Apply filters
      if (filters.status) {
        whereClause += ' AND rd.status = ?';
        params.push(filters.status);
      }

      if (filters.dispute_type) {
        whereClause += ' AND rd.dispute_type = ?';
        params.push(filters.dispute_type);
      }

      if (filters.ride_id) {
        whereClause += ' AND rd.ride_id = ?';
        params.push(filters.ride_id);
      }

      if (filters.date_from) {
        whereClause += ' AND DATE(rd.created_at) >= ?';
        params.push(filters.date_from);
      }

      if (filters.date_to) {
        whereClause += ' AND DATE(rd.created_at) <= ?';
        params.push(filters.date_to);
      }

      const offset = (parseInt(page) - 1) * parseInt(limit);
      const limitValue = parseInt(limit);

      const rows = await db.executeQuery(`
        SELECT 
          rd.*,
          'Sample Pickup' as pickup_location,
          'Sample Dropoff' as dropoff_location,
          'sample-user-id' as user_id,
          'sample-driver-id' as driver_id,
          'user@example.com' as user_email,
          'John' as user_first_name,
          'Doe' as user_last_name,
          admin.email as admin_email,
          admin.first_name as admin_first_name,
          admin.last_name as admin_last_name
        FROM ride_disputes rd
        LEFT JOIN admin_users admin ON rd.resolved_by = admin.id
        ${whereClause}
        ORDER BY rd.created_at DESC
        LIMIT ${limitValue} OFFSET ${offset}
      `, params);

      // Get total count
      const countResult = await db.executeQuery(`
        SELECT COUNT(*) as total
        FROM ride_disputes rd
        ${whereClause}
      `, params);

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
      console.error('Error finding all ride disputes:', error);
      throw error;
    }
  }

  /**
   * Get disputes by ride ID
   */
  static async findByRideId(rideId) {
    try {
      const rows = await db.executeQuery(`
        SELECT 
          rd.*,
          admin.email as admin_email,
          admin.first_name as admin_first_name,
          admin.last_name as admin_last_name
        FROM ride_disputes rd
        LEFT JOIN admin_users admin ON rd.resolved_by = admin.id
        WHERE rd.ride_id = ?
        ORDER BY rd.created_at DESC
      `, [rideId]);
      
      return rows;
    } catch (error) {
      console.error('Error finding disputes by ride ID:', error);
      throw error;
    }
  }

  /**
   * Get disputes summary
   */
  static async getSummary() {
    try {
      const rows = await db.executeQuery(`
        SELECT 
          COUNT(*) as total_disputes,
          COUNT(CASE WHEN status = 'open' THEN 1 END) as open_disputes,
          COUNT(CASE WHEN status = 'investigating' THEN 1 END) as investigating_disputes,
          COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_disputes,
          COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed_disputes,
          COUNT(CASE WHEN dispute_type = 'payment' THEN 1 END) as payment_disputes,
          COUNT(CASE WHEN dispute_type = 'service' THEN 1 END) as service_disputes,
          COUNT(CASE WHEN dispute_type = 'safety' THEN 1 END) as safety_disputes,
          COUNT(CASE WHEN dispute_type = 'other' THEN 1 END) as other_disputes
        FROM ride_disputes
      `);

      return rows[0];
    } catch (error) {
      console.error('Error getting disputes summary:', error);
      throw error;
    }
  }

  /**
   * Get recent disputes
   */
  static async getRecentDisputes(limit = 10) {
    try {
      const rows = await db.executeQuery(`
        SELECT 
          rd.*,
          r.pickup_location,
          r.dropoff_location,
          r.user_id,
          r.driver_id,
          u.email as user_email,
          u.first_name as user_first_name,
          u.last_name as user_last_name
        FROM ride_disputes rd
        LEFT JOIN rides r ON rd.ride_id = r.id
        LEFT JOIN users u ON r.user_id = u.id
        ORDER BY rd.created_at DESC
        LIMIT ?
      `, [limit]);
      
      return rows;
    } catch (error) {
      console.error('Error getting recent disputes:', error);
      throw error;
    }
  }

  /**
   * Get disputes by status
   */
  static async getByStatus(status, limit = 20) {
    try {
      const rows = await db.executeQuery(`
        SELECT 
          rd.*,
          r.pickup_location,
          r.dropoff_location,
          r.user_id,
          r.driver_id,
          u.email as user_email,
          u.first_name as user_first_name,
          u.last_name as user_last_name
        FROM ride_disputes rd
        LEFT JOIN rides r ON rd.ride_id = r.id
        LEFT JOIN users u ON r.user_id = u.id
        WHERE rd.status = ?
        ORDER BY rd.created_at DESC
        LIMIT ?
      `, [status, limit]);
      
      return rows;
    } catch (error) {
      console.error('Error getting disputes by status:', error);
      throw error;
    }
  }

  /**
   * Get disputes by type
   */
  static async getByType(disputeType, limit = 20) {
    try {
      const rows = await db.executeQuery(`
        SELECT 
          rd.*,
          r.pickup_location,
          r.dropoff_location,
          r.user_id,
          r.driver_id,
          u.email as user_email,
          u.first_name as user_first_name,
          u.last_name as user_last_name
        FROM ride_disputes rd
        LEFT JOIN rides r ON rd.ride_id = r.id
        LEFT JOIN users u ON r.user_id = u.id
        WHERE rd.dispute_type = ?
        ORDER BY rd.created_at DESC
        LIMIT ?
      `, [disputeType, limit]);
      
      return rows;
    } catch (error) {
      console.error('Error getting disputes by type:', error);
      throw error;
    }
  }
}

module.exports = RideDispute; 