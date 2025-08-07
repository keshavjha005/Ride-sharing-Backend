const { v4: uuidv4 } = require('uuid');
const UserAnalytics = require('../models/UserAnalytics');
const UserReport = require('../models/UserReport');
const db = require('../config/database');

class UserManagementController {
  /**
   * Get all users with search and filtering
   */
  static async getUsers(req, res) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        search, 
        status, 
        verification_status,
        min_rides,
        max_risk_score,
        sort_by = 'created_at',
        sort_order = 'DESC'
      } = req.query;

      let whereClause = 'WHERE u.is_deleted IS NULL';
      const params = [];

      // Search functionality
      if (search) {
        whereClause += ` AND (
          u.email LIKE ? OR 
          u.first_name LIKE ? OR 
          u.last_name LIKE ? OR 
          u.phone LIKE ?
        )`;
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm);
      }

      // Status filter
      if (status) {
        whereClause += ' AND u.is_active = ?';
        params.push(status === 'active' ? 1 : 0);
      }

      // Verification status filter
      if (verification_status) {
        whereClause += ' AND ua.verification_status = ?';
        params.push(verification_status);
      }

      // Rides filter
      if (min_rides) {
        whereClause += ' AND ua.total_rides >= ?';
        params.push(parseInt(min_rides));
      }

      // Risk score filter
      if (max_risk_score) {
        whereClause += ' AND ua.risk_score <= ?';
        params.push(parseFloat(max_risk_score));
      }

      const offset = (parseInt(page) - 1) * parseInt(limit);
      params.push(parseInt(limit), offset);

      // Get users with analytics
      const rows = await db.executeQuery(`
        SELECT 
          u.*,
          ua.total_rides,
          ua.total_spent,
          ua.average_rating,
          ua.last_activity,
          ua.verification_status,
          ua.risk_score,
          (SELECT COUNT(*) FROM user_reports WHERE reported_user_id = u.id) as report_count
        FROM users u
        LEFT JOIN user_analytics ua ON u.id = ua.user_id
        ${whereClause}
        ORDER BY ${sort_by} ${sort_order}
        LIMIT ${parseInt(limit)} OFFSET ${offset}
      `, params.slice(0, -2));

      // Get total count
      const countResult = await db.executeQuery(`
        SELECT COUNT(*) as total
        FROM users u
        LEFT JOIN user_analytics ua ON u.id = ua.user_id
        ${whereClause}
      `, params.slice(0, -2));

      res.json({
        success: true,
        data: {
          users: rows,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: countResult[0].total,
            totalPages: Math.ceil(countResult[0].total / parseInt(limit))
          }
        }
      });

    } catch (error) {
      console.error('Error getting users:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching users'
      });
    }
  }

  /**
   * Get user by ID with detailed information
   */
  static async getUserById(req, res) {
    try {
      const { id } = req.params;

      // Get user with analytics
      const userRows = await db.executeQuery(`
        SELECT 
          u.*,
          ua.total_rides,
          ua.total_spent,
          ua.average_rating,
          ua.last_activity,
          ua.verification_status,
          ua.risk_score,
          ua.registration_date
        FROM users u
        LEFT JOIN user_analytics ua ON u.id = ua.user_id
        WHERE u.id = ? AND u.is_deleted IS NULL
      `, [id]);

      if (!userRows.length) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const user = userRows[0];

      // Get user reports
      const reports = await UserReport.findByReportedUserId(id);

      // Get recent rides (if rides table exists)
      let recentRides = [];
      try {
        const rideRows = await db.executeQuery(`
          SELECT id, status, created_at, pickup_location, dropoff_location
          FROM rides 
          WHERE user_id = ? 
          ORDER BY created_at DESC 
          LIMIT 10
        `, [id]);
        recentRides = rideRows;
      } catch (error) {
        // Rides table might not exist yet
        console.log('Rides table not available');
      }

      // Get recent payments (if payment_transactions table exists)
      let recentPayments = [];
      try {
        const paymentRows = await db.executeQuery(`
          SELECT id, amount, status, created_at, payment_method
          FROM payment_transactions 
          WHERE user_id = ? 
          ORDER BY created_at DESC 
          LIMIT 10
        `, [id]);
        recentPayments = paymentRows;
      } catch (error) {
        // Payment_transactions table might not exist yet
        console.log('Payment_transactions table not available');
      }

      res.json({
        success: true,
        data: {
          user,
          reports,
          recentRides,
          recentPayments
        }
      });

    } catch (error) {
      console.error('Error getting user by ID:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching user details'
      });
    }
  }

  /**
   * Update user
   */
  static async updateUser(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Check if user exists
      const userRows = await db.executeQuery('SELECT * FROM users WHERE id = ? AND is_deleted IS NULL', [id]);
      if (!userRows.length) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Update user
      const fields = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
      const values = Object.values(updateData);
      values.push(id);
      
      const updateResult = await db.executeQuery(`
        UPDATE users 
        SET ${fields}, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `, values);
      
      const updated = updateResult.affectedRows > 0;

      // Update analytics if verification status changed
      if (updateData.verification_status) {
        await UserAnalytics.update(id, {
          verification_status: updateData.verification_status
        });
      }

      res.json({
        success: true,
        message: 'User updated successfully',
        data: { updated }
      });

    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating user'
      });
    }
  }

  /**
   * Delete user (soft delete)
   */
  static async deleteUser(req, res) {
    try {
      const { id } = req.params;

      // Check if user exists
      const userRows = await db.executeQuery('SELECT * FROM users WHERE id = ? AND is_deleted IS NULL', [id]);
      if (!userRows.length) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Soft delete user
      const deleteResult = await db.executeQuery(`
        UPDATE users 
        SET is_deleted = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `, [id]);
      
      const deleted = deleteResult.affectedRows > 0;

      res.json({
        success: true,
        message: 'User deleted successfully',
        data: { deleted }
      });

    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting user'
      });
    }
  }

  /**
   * Verify user
   */
  static async verifyUser(req, res) {
    try {
      const { id } = req.params;
      const { verification_status } = req.body;

      // Check if user exists
      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Update verification status
      await UserAnalytics.update(id, { verification_status });

      res.json({
        success: true,
        message: 'User verification status updated successfully'
      });

    } catch (error) {
      console.error('Error verifying user:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating user verification status'
      });
    }
  }

  /**
   * Block/Unblock user
   */
  static async toggleUserStatus(req, res) {
    try {
      const { id } = req.params;
      const { is_active } = req.body;

      // Check if user exists
      const userRows = await db.executeQuery('SELECT * FROM users WHERE id = ? AND is_deleted IS NULL', [id]);
      if (!userRows.length) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Update user status
      const updateResult = await db.executeQuery(`
        UPDATE users 
        SET is_active = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `, [is_active, id]);
      
      const updated = updateResult.affectedRows > 0;

      res.json({
        success: true,
        message: `User ${is_active ? 'unblocked' : 'blocked'} successfully`,
        data: { updated }
      });

    } catch (error) {
      console.error('Error toggling user status:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating user status'
      });
    }
  }

  /**
   * Get user analytics
   */
  static async getUserAnalytics(req, res) {
    try {
      const { id } = req.params;

      // Get user analytics
      const analytics = await UserAnalytics.findByUserId(id);
      if (!analytics) {
        return res.status(404).json({
          success: false,
          message: 'User analytics not found'
        });
      }

      // Calculate risk score
      const riskScore = await UserAnalytics.calculateRiskScore(id);

      res.json({
        success: true,
        data: {
          analytics,
          riskScore
        }
      });

    } catch (error) {
      console.error('Error getting user analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching user analytics'
      });
    }
  }

  /**
   * Get user management summary
   */
  static async getSummary(req, res) {
    try {
      // Get user analytics summary
      const analyticsSummary = await UserAnalytics.getSummary();

      // Get reports summary
      const reportsSummary = await UserReport.getSummary();

      // Get total users count
      const userCountResult = await db.executeQuery(`
        SELECT 
          COUNT(*) as total_users,
          COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_users,
          COUNT(CASE WHEN is_active = 0 THEN 1 END) as blocked_users
        FROM users 
        WHERE is_deleted IS NULL
      `);

      res.json({
        success: true,
        data: {
          users: userCountResult[0],
          analytics: analyticsSummary,
          reports: reportsSummary
        }
      });

    } catch (error) {
      console.error('Error getting user management summary:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching user management summary'
      });
    }
  }

  /**
   * Export users data
   */
  static async exportUsers(req, res) {
    try {
      const { format = 'json' } = req.query;

      // Get all users with analytics
      const rows = await db.executeQuery(`
        SELECT 
          u.id,
          u.email,
          u.first_name,
          u.last_name,
          u.phone,
          u.is_active,
          u.created_at,
          ua.total_rides,
          ua.total_spent,
          ua.average_rating,
          ua.verification_status,
          ua.risk_score,
          ua.last_activity
        FROM users u
        LEFT JOIN user_analytics ua ON u.id = ua.user_id
        WHERE u.is_deleted IS NULL
        ORDER BY u.created_at DESC
      `);

      if (format === 'csv') {
        // Convert to CSV format
        const csvHeaders = [
          'ID', 'Email', 'First Name', 'Last Name', 'Phone', 'Active',
          'Created At', 'Total Rides', 'Total Spent', 'Average Rating',
          'Verification Status', 'Risk Score', 'Last Activity'
        ];

        const csvData = rows.map(row => [
          row.id,
          row.email,
          row.first_name,
          row.last_name,
          row.phone,
          row.is_active ? 'Yes' : 'No',
          row.created_at,
          row.total_rides || 0,
          row.total_spent || 0,
          row.average_rating || 'N/A',
          row.verification_status || 'pending',
          row.risk_score || 0,
          row.last_activity || 'N/A'
        ]);

        const csv = [csvHeaders, ...csvData]
          .map(row => row.map(field => `"${field}"`).join(','))
          .join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=users_export.csv');
        res.send(csv);
      } else {
        // Return JSON format
        res.json({
          success: true,
          data: rows
        });
      }

    } catch (error) {
      console.error('Error exporting users:', error);
      res.status(500).json({
        success: false,
        message: 'Error exporting users data'
      });
    }
  }
}

module.exports = UserManagementController; 