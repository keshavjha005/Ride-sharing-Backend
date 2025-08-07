const db = require('../config/database');

class UserAnalytics {
  /**
   * Find analytics by user ID
   */
  static async findByUserId(userId) {
    try {
      const [rows] = await db.executeQuery(
        'SELECT * FROM user_analytics WHERE user_id = ?',
        [userId]
      );
      return rows[0] || null;
    } catch (error) {
      console.error('Error finding user analytics by user ID:', error);
      throw error;
    }
  }

  /**
   * Create user analytics
   */
  static async create(analyticsData) {
    try {
      const { id, user_id, total_rides, total_spent, average_rating, last_activity, registration_date, verification_status, risk_score } = analyticsData;
      
      const [result] = await db.executeQuery(`
        INSERT INTO user_analytics (
          id, user_id, total_rides, total_spent, average_rating, 
          last_activity, registration_date, verification_status, risk_score
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [id, user_id, total_rides, total_spent, average_rating, last_activity, registration_date, verification_status, risk_score]);

      return { id, ...analyticsData };
    } catch (error) {
      console.error('Error creating user analytics:', error);
      throw error;
    }
  }

  /**
   * Update user analytics
   */
  static async update(userId, updateData) {
    try {
      const fields = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
      const values = Object.values(updateData);
      values.push(userId);

      const [result] = await db.executeQuery(`
        UPDATE user_analytics 
        SET ${fields}, updated_at = CURRENT_TIMESTAMP 
        WHERE user_id = ?
      `, values);

      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error updating user analytics:', error);
      throw error;
    }
  }

  /**
   * Get all user analytics with pagination
   */
  static async findAll(page = 1, limit = 20, filters = {}) {
    try {
      let whereClause = 'WHERE ua.user_id IS NOT NULL';
      const params = [];

      // Apply filters
      if (filters.verification_status) {
        whereClause += ' AND ua.verification_status = ?';
        params.push(filters.verification_status);
      }

      if (filters.min_rides) {
        whereClause += ' AND ua.total_rides >= ?';
        params.push(filters.min_rides);
      }

      if (filters.max_risk_score) {
        whereClause += ' AND ua.risk_score <= ?';
        params.push(filters.max_risk_score);
      }

      const offset = (parseInt(page) - 1) * parseInt(limit);
      const limitValue = parseInt(limit);

      const rows = await db.executeQuery(`
        SELECT 
          ua.*,
          u.email,
          u.first_name,
          u.last_name,
          u.phone,
          u.is_active
        FROM user_analytics ua
        LEFT JOIN users u ON ua.user_id = u.id
        ${whereClause}
        ORDER BY ua.updated_at DESC
        LIMIT ${limitValue} OFFSET ${offset}
      `, params);

      // Get total count
      const countResult = await db.executeQuery(`
        SELECT COUNT(*) as total
        FROM user_analytics ua
        LEFT JOIN users u ON ua.user_id = u.id
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
      console.error('Error finding all user analytics:', error);
      throw error;
    }
  }

  /**
   * Get user analytics summary
   */
  static async getSummary() {
    try {
      const [rows] = await db.executeQuery(`
        SELECT 
          COUNT(*) as total_users,
          COUNT(CASE WHEN verification_status = 'verified' THEN 1 END) as verified_users,
          COUNT(CASE WHEN verification_status = 'pending' THEN 1 END) as pending_users,
          COUNT(CASE WHEN verification_status = 'rejected' THEN 1 END) as rejected_users,
          AVG(total_rides) as avg_rides_per_user,
          AVG(total_spent) as avg_spent_per_user,
          AVG(average_rating) as avg_rating,
          AVG(risk_score) as avg_risk_score
        FROM user_analytics
      `);

      return rows[0];
    } catch (error) {
      console.error('Error getting user analytics summary:', error);
      throw error;
    }
  }

  /**
   * Update user activity
   */
  static async updateActivity(userId) {
    try {
      const [result] = await db.executeQuery(`
        UPDATE user_analytics 
        SET last_activity = CURRENT_TIMESTAMP 
        WHERE user_id = ?
      `, [userId]);

      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error updating user activity:', error);
      throw error;
    }
  }

  /**
   * Calculate risk score for user
   */
  static async calculateRiskScore(userId) {
    try {
      // Get user data for risk calculation
      const [userData] = await db.executeQuery(`
        SELECT 
          ua.total_rides,
          ua.average_rating,
          ua.verification_status,
          COUNT(ur.id) as report_count
        FROM user_analytics ua
        LEFT JOIN user_reports ur ON ua.user_id = ur.reported_user_id
        WHERE ua.user_id = ?
        GROUP BY ua.id
      `, [userId]);

      if (!userData) return 0;

      let riskScore = 0;

      // Risk factors
      if (userData.total_rides === 0) riskScore += 0.1; // New user
      if (userData.average_rating < 3.0) riskScore += 0.3; // Low rating
      if (userData.verification_status === 'rejected') riskScore += 0.5; // Rejected verification
      if (userData.report_count > 0) riskScore += (userData.report_count * 0.2); // Reports

      // Cap risk score at 1.0
      return Math.min(riskScore, 1.0);
    } catch (error) {
      console.error('Error calculating risk score:', error);
      return 0;
    }
  }
}

module.exports = UserAnalytics; 