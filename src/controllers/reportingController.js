const { v4: uuidv4 } = require('uuid');
const mysql = require('mysql2/promise');
const config = require('../config/index');
const logger = require('../utils/logger');

class ReportingController {
  constructor() {
    this.pool = mysql.createPool(config.database);
  }

  // Generate comprehensive reports
  async generateReport(req, res) {
    try {
      const { reportType, dateRange, filters, format = 'json' } = req.body;
      const adminId = req.admin.id;

      logger.info(`Admin ${adminId} generating ${reportType} report`);

      let reportData;
      switch (reportType) {
        case 'user_analytics':
          reportData = await this.generateUserAnalyticsReport(dateRange, filters);
          break;
        case 'ride_analytics':
          reportData = await this.generateRideAnalyticsReport(dateRange, filters);
          break;
        case 'financial_analytics':
          reportData = await this.generateFinancialAnalyticsReport(dateRange, filters);
          break;
        case 'system_analytics':
          reportData = await this.generateSystemAnalyticsReport(dateRange, filters);
          break;
        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid report type'
          });
      }

      // Log report generation activity
      await this.logAdminActivity(adminId, 'generate_report', 'report', null, {
        reportType,
        dateRange,
        filters,
        format
      });

      res.json({
        success: true,
        data: {
          report: reportData,
          generatedAt: new Date().toISOString(),
          generatedBy: adminId,
          reportType,
          dateRange
        }
      });
    } catch (error) {
      logger.error('Error generating report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate report'
      });
    }
  }

  // Get scheduled reports
  async getScheduledReports(req, res) {
    try {
      const { page = 1, limit = 10, status } = req.query;
      const offset = (page - 1) * limit;

      let query = `
        SELECT sr.*, au.first_name, au.last_name, au.email
        FROM scheduled_reports sr
        LEFT JOIN admin_users au ON sr.created_by = au.id
        WHERE 1=1
      `;
      const params = [];

      if (status) {
        query += ' AND sr.is_active = ?';
        params.push(status === 'active' ? 1 : 0);
      }

      query += ' ORDER BY sr.created_at DESC LIMIT ? OFFSET ?';
      params.push(parseInt(limit), offset);

      const [reports] = await this.pool.execute(query, params);

      // Get total count
      const [countResult] = await this.pool.execute(
        'SELECT COUNT(*) as total FROM scheduled_reports',
        []
      );

      res.json({
        success: true,
        data: {
          reports,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: countResult[0].total,
            pages: Math.ceil(countResult[0].total / limit)
          }
        }
      });
    } catch (error) {
      logger.error('Error fetching scheduled reports:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch scheduled reports'
      });
    }
  }

  // Create scheduled report
  async createScheduledReport(req, res) {
    try {
      const {
        reportNameAr,
        reportNameEn,
        reportType,
        scheduleType,
        scheduleConfig,
        recipients,
        reportFormat = 'pdf'
      } = req.body;
      const adminId = req.admin.id;

      const reportId = uuidv4();
      const nextGeneration = this.calculateNextGeneration(scheduleType, scheduleConfig);

      const query = `
        INSERT INTO scheduled_reports (
          id, report_name_ar, report_name_en, report_type, schedule_type,
          schedule_config, recipients, report_format, next_generation_at, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await this.pool.execute(query, [
        reportId,
        reportNameAr,
        reportNameEn,
        reportType,
        scheduleType,
        JSON.stringify(scheduleConfig),
        JSON.stringify(recipients),
        reportFormat,
        nextGeneration,
        adminId
      ]);

      // Log activity
      await this.logAdminActivity(adminId, 'create_scheduled_report', 'scheduled_report', reportId, {
        reportNameEn,
        reportType,
        scheduleType
      });

      res.status(201).json({
        success: true,
        message: 'Scheduled report created successfully',
        data: { reportId }
      });
    } catch (error) {
      logger.error('Error creating scheduled report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create scheduled report'
      });
    }
  }

  // Update scheduled report
  async updateScheduledReport(req, res) {
    try {
      const { id } = req.params;
      const {
        reportNameAr,
        reportNameEn,
        scheduleType,
        scheduleConfig,
        recipients,
        reportFormat,
        isActive
      } = req.body;
      const adminId = req.admin.id;

      const updateFields = [];
      const params = [];

      if (reportNameAr !== undefined) {
        updateFields.push('report_name_ar = ?');
        params.push(reportNameAr);
      }
      if (reportNameEn !== undefined) {
        updateFields.push('report_name_en = ?');
        params.push(reportNameEn);
      }
      if (scheduleType !== undefined) {
        updateFields.push('schedule_type = ?');
        params.push(scheduleType);
      }
      if (scheduleConfig !== undefined) {
        updateFields.push('schedule_config = ?');
        params.push(JSON.stringify(scheduleConfig));
      }
      if (recipients !== undefined) {
        updateFields.push('recipients = ?');
        params.push(JSON.stringify(recipients));
      }
      if (reportFormat !== undefined) {
        updateFields.push('report_format = ?');
        params.push(reportFormat);
      }
      if (isActive !== undefined) {
        updateFields.push('is_active = ?');
        params.push(isActive);
      }

      if (updateFields.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No fields to update'
        });
      }

      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      params.push(id);

      const query = `UPDATE scheduled_reports SET ${updateFields.join(', ')} WHERE id = ?`;
      await this.pool.execute(query, params);

      // Log activity
      await this.logAdminActivity(adminId, 'update_scheduled_report', 'scheduled_report', id, {
        updatedFields: updateFields.filter(f => !f.includes('updated_at'))
      });

      res.json({
        success: true,
        message: 'Scheduled report updated successfully'
      });
    } catch (error) {
      logger.error('Error updating scheduled report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update scheduled report'
      });
    }
  }

  // Delete scheduled report
  async deleteScheduledReport(req, res) {
    try {
      const { id } = req.params;
      const adminId = req.admin.id;

      await this.pool.execute('DELETE FROM scheduled_reports WHERE id = ?', [id]);

      // Log activity
      await this.logAdminActivity(adminId, 'delete_scheduled_report', 'scheduled_report', id);

      res.json({
        success: true,
        message: 'Scheduled report deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting scheduled report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete scheduled report'
      });
    }
  }

  // Get analytics data
  async getAnalytics(req, res) {
    try {
      const { type, period = '7d', filters } = req.query;
      const adminId = req.admin.id;

      logger.info(`Admin ${adminId} fetching ${type} analytics for period ${period}`);

      let analyticsData;
      switch (type) {
        case 'users':
          analyticsData = await this.getUserAnalytics(period, filters);
          break;
        case 'rides':
          analyticsData = await this.getRideAnalytics(period, filters);
          break;
        case 'financial':
          analyticsData = await this.getFinancialAnalytics(period, filters);
          break;
        case 'system':
          analyticsData = await this.getSystemAnalytics(period, filters);
          break;
        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid analytics type'
          });
      }

      res.json({
        success: true,
        data: analyticsData
      });
    } catch (error) {
      logger.error('Error fetching analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch analytics'
      });
    }
  }

  // Export data
  async exportData(req, res) {
    try {
      const { type, format = 'csv', filters } = req.query;
      const adminId = req.admin.id;

      logger.info(`Admin ${adminId} exporting ${type} data in ${format} format`);

      let exportData;
      switch (type) {
        case 'users':
          exportData = await this.exportUsers(filters);
          break;
        case 'rides':
          exportData = await this.exportRides(filters);
          break;
        case 'payments':
          exportData = await this.exportPayments(filters);
          break;
        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid export type'
          });
      }

      // Log export activity
      await this.logAdminActivity(adminId, 'export_data', type, null, {
        format,
        filters,
        recordCount: exportData.length
      });

      res.json({
        success: true,
        data: {
          records: exportData,
          totalRecords: exportData.length,
          exportedAt: new Date().toISOString(),
          format
        }
      });
    } catch (error) {
      logger.error('Error exporting data:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export data'
      });
    }
  }

  // Helper methods for report generation
  async generateUserAnalyticsReport(dateRange, filters) {
    const { startDate, endDate } = this.parseDateRange(dateRange);
    
    const query = `
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN created_at >= ? AND created_at <= ? THEN 1 END) as new_users,
        COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_users,
        COUNT(CASE WHEN is_verified = 1 THEN 1 END) as verified_users,
        AVG(CASE WHEN ua.total_rides > 0 THEN ua.average_rating END) as avg_rating
      FROM users u
      LEFT JOIN user_analytics ua ON u.id = ua.user_id
      WHERE u.created_at >= ? AND u.created_at <= ?
    `;

    const [result] = await this.pool.execute(query, [startDate, endDate, startDate, endDate]);
    
    return {
      summary: result[0],
      period: { startDate, endDate },
      reportType: 'user_analytics'
    };
  }

  async generateRideAnalyticsReport(dateRange, filters) {
    const { startDate, endDate } = this.parseDateRange(dateRange);
    
    const query = `
      SELECT 
        COUNT(*) as total_rides,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_rides,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_rides,
        AVG(CASE WHEN status = 'completed' THEN ra.distance_km END) as avg_distance,
        AVG(CASE WHEN status = 'completed' THEN ra.duration_minutes END) as avg_duration,
        SUM(CASE WHEN status = 'completed' THEN ra.fare_amount END) as total_revenue
      FROM rides r
      LEFT JOIN ride_analytics ra ON r.id = ra.ride_id
      WHERE r.created_at >= ? AND r.created_at <= ?
    `;

    const [result] = await this.pool.execute(query, [startDate, endDate]);
    
    return {
      summary: result[0],
      period: { startDate, endDate },
      reportType: 'ride_analytics'
    };
  }

  async generateFinancialAnalyticsReport(dateRange, filters) {
    const { startDate, endDate } = this.parseDateRange(dateRange);
    
    const query = `
      SELECT 
        SUM(amount) as total_transactions,
        COUNT(*) as transaction_count,
        AVG(amount) as avg_transaction,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful_transactions,
        SUM(CASE WHEN status = 'completed' THEN amount END) as total_revenue
      FROM payment_transactions
      WHERE created_at >= ? AND created_at <= ?
    `;

    const [result] = await this.pool.execute(query, [startDate, endDate]);
    
    return {
      summary: result[0],
      period: { startDate, endDate },
      reportType: 'financial_analytics'
    };
  }

  async generateSystemAnalyticsReport(dateRange, filters) {
    const { startDate, endDate } = this.parseDateRange(dateRange);
    
    const query = `
      SELECT 
        COUNT(*) as total_logs,
        COUNT(CASE WHEN status = 'error' THEN 1 END) as error_count,
        COUNT(CASE WHEN status = 'critical' THEN 1 END) as critical_count,
        AVG(response_time_ms) as avg_response_time
      FROM system_health_logs
      WHERE created_at >= ? AND created_at <= ?
    `;

    const [result] = await this.pool.execute(query, [startDate, endDate]);
    
    return {
      summary: result[0],
      period: { startDate, endDate },
      reportType: 'system_analytics'
    };
  }

  // Helper methods for analytics
  async getUserAnalytics(period, filters) {
    try {
      const { startDate, endDate } = this.parseDateRange(period);
      
      // Check if users table exists
      const [tables] = await this.pool.execute(`
        SELECT TABLE_NAME 
        FROM information_schema.TABLES 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'
      `, [config.database.database]);
      
      if (tables.length === 0) {
        // Return mock data if table doesn't exist
        return {
          type: 'users',
          period: { startDate, endDate },
          data: [
            { date: startDate, new_users: 0, verified_users: 0 },
            { date: endDate, new_users: 0, verified_users: 0 }
          ]
        };
      }
      
      const query = `
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as new_users,
          COUNT(CASE WHEN is_verified = 1 THEN 1 END) as verified_users
        FROM users
        WHERE created_at >= ? AND created_at <= ?
        GROUP BY DATE(created_at)
        ORDER BY date
      `;

      const [result] = await this.pool.execute(query, [startDate, endDate]);
      
      return {
        type: 'users',
        period: { startDate, endDate },
        data: result
      };
    } catch (error) {
      logger.error('Error in getUserAnalytics:', error);
      // Return mock data on error
      const { startDate, endDate } = this.parseDateRange(period);
      return {
        type: 'users',
        period: { startDate, endDate },
        data: [
          { date: startDate, new_users: 0, verified_users: 0 },
          { date: endDate, new_users: 0, verified_users: 0 }
        ]
      };
    }
  }

  async getRideAnalytics(period, filters) {
    try {
      const { startDate, endDate } = this.parseDateRange(period);
      
      // Check if rides table exists
      const [tables] = await this.pool.execute(`
        SELECT TABLE_NAME 
        FROM information_schema.TABLES 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'rides'
      `, [config.database.database]);
      
      if (tables.length === 0) {
        // Return mock data if table doesn't exist
        return {
          type: 'rides',
          period: { startDate, endDate },
          data: [
            { date: startDate, total_rides: 0, completed_rides: 0, avg_fare: 0 },
            { date: endDate, total_rides: 0, completed_rides: 0, avg_fare: 0 }
          ]
        };
      }
      
      const query = `
        SELECT 
          DATE(r.created_at) as date,
          COUNT(*) as total_rides,
          COUNT(CASE WHEN r.status = 'completed' THEN 1 END) as completed_rides,
          AVG(CASE WHEN r.status = 'completed' THEN ra.fare_amount END) as avg_fare
        FROM rides r
        LEFT JOIN ride_analytics ra ON r.id = ra.ride_id
        WHERE r.created_at >= ? AND r.created_at <= ?
        GROUP BY DATE(r.created_at)
        ORDER BY date
      `;

      const [result] = await this.pool.execute(query, [startDate, endDate]);
      
      return {
        type: 'rides',
        period: { startDate, endDate },
        data: result
      };
    } catch (error) {
      logger.error('Error in getRideAnalytics:', error);
      // Return mock data on error
      const { startDate, endDate } = this.parseDateRange(period);
      return {
        type: 'rides',
        period: { startDate, endDate },
        data: [
          { date: startDate, total_rides: 0, completed_rides: 0, avg_fare: 0 },
          { date: endDate, total_rides: 0, completed_rides: 0, avg_fare: 0 }
        ]
      };
    }
  }

  async getFinancialAnalytics(period, filters) {
    try {
      const { startDate, endDate } = this.parseDateRange(period);
      
      // Check if payment_transactions table exists
      const [tables] = await this.pool.execute(`
        SELECT TABLE_NAME 
        FROM information_schema.TABLES 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'payment_transactions'
      `, [config.database.database]);
      
      if (tables.length === 0) {
        // Return mock data if table doesn't exist
        return {
          type: 'financial',
          period: { startDate, endDate },
          data: [
            { date: startDate, total_revenue: 0, transaction_count: 0, avg_transaction: 0 },
            { date: endDate, total_revenue: 0, transaction_count: 0, avg_transaction: 0 }
          ]
        };
      }
      
      const query = `
        SELECT 
          DATE(created_at) as date,
          SUM(amount) as total_revenue,
          COUNT(*) as transaction_count,
          AVG(amount) as avg_transaction
        FROM payment_transactions
        WHERE status = 'completed' AND created_at >= ? AND created_at <= ?
        GROUP BY DATE(created_at)
        ORDER BY date
      `;

      const [result] = await this.pool.execute(query, [startDate, endDate]);
      
      return {
        type: 'financial',
        period: { startDate, endDate },
        data: result
      };
    } catch (error) {
      logger.error('Error in getFinancialAnalytics:', error);
      // Return mock data on error
      const { startDate, endDate } = this.parseDateRange(period);
      return {
        type: 'financial',
        period: { startDate, endDate },
        data: [
          { date: startDate, total_revenue: 0, transaction_count: 0, avg_transaction: 0 },
          { date: endDate, total_revenue: 0, transaction_count: 0, avg_transaction: 0 }
        ]
      };
    }
  }

  async getSystemAnalytics(period, filters) {
    try {
      const { startDate, endDate } = this.parseDateRange(period);
      
      // Check if system_health_logs table exists
      const [tables] = await this.pool.execute(`
        SELECT TABLE_NAME 
        FROM information_schema.TABLES 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'system_health_logs'
      `, [config.database.database]);
      
      if (tables.length === 0) {
        // Return mock data if table doesn't exist
        return {
          type: 'system',
          period: { startDate, endDate },
          data: [
            { date: startDate, total_logs: 0, error_count: 0, avg_response_time: 0 },
            { date: endDate, total_logs: 0, error_count: 0, avg_response_time: 0 }
          ]
        };
      }
      
      const query = `
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as total_logs,
          COUNT(CASE WHEN status = 'error' THEN 1 END) as error_count,
          AVG(response_time_ms) as avg_response_time
        FROM system_health_logs
        WHERE created_at >= ? AND created_at <= ?
        GROUP BY DATE(created_at)
        ORDER BY date
      `;

      const [result] = await this.pool.execute(query, [startDate, endDate]);
      
      return {
        type: 'system',
        period: { startDate, endDate },
        data: result
      };
    } catch (error) {
      logger.error('Error in getSystemAnalytics:', error);
      // Return mock data on error
      const { startDate, endDate } = this.parseDateRange(period);
      return {
        type: 'system',
        period: { startDate, endDate },
        data: [
          { date: startDate, total_logs: 0, error_count: 0, avg_response_time: 0 },
          { date: endDate, total_logs: 0, error_count: 0, avg_response_time: 0 }
        ]
      };
    }
  }

  // Helper methods for data export
  async exportUsers(filters) {
    try {
      // Check if users table exists
      const [tables] = await this.pool.execute(`
        SELECT TABLE_NAME 
        FROM information_schema.TABLES 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'
      `, [config.database.database]);
      
      if (tables.length === 0) {
        return [];
      }
      
      const query = `
        SELECT 
          u.id, u.email, u.first_name, u.last_name, u.phone,
          u.is_active, u.is_verified, u.created_at,
          ua.total_rides, ua.total_spent, ua.average_rating
        FROM users u
        LEFT JOIN user_analytics ua ON u.id = ua.user_id
        ORDER BY u.created_at DESC
      `;

      const [result] = await this.pool.execute(query);
      return result;
    } catch (error) {
      logger.error('Error in exportUsers:', error);
      return [];
    }
  }

  async exportRides(filters) {
    try {
      // Check if rides table exists
      const [tables] = await this.pool.execute(`
        SELECT TABLE_NAME 
        FROM information_schema.TABLES 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'rides'
      `, [config.database.database]);
      
      if (tables.length === 0) {
        return [];
      }
      
      const query = `
        SELECT 
          r.id, r.status, r.created_at, r.completed_at,
          ra.distance_km, ra.duration_minutes, ra.fare_amount,
          u1.email as rider_email, u2.email as driver_email
        FROM rides r
        LEFT JOIN ride_analytics ra ON r.id = ra.ride_id
        LEFT JOIN users u1 ON r.rider_id = u1.id
        LEFT JOIN users u2 ON r.driver_id = u2.id
        ORDER BY r.created_at DESC
      `;

      const [result] = await this.pool.execute(query);
      return result;
    } catch (error) {
      logger.error('Error in exportRides:', error);
      return [];
    }
  }

  async exportPayments(filters) {
    try {
      // Check if payment_transactions table exists
      const [tables] = await this.pool.execute(`
        SELECT TABLE_NAME 
        FROM information_schema.TABLES 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'payment_transactions'
      `, [config.database.database]);
      
      if (tables.length === 0) {
        return [];
      }
      
      const query = `
        SELECT 
          pt.id, pt.amount, pt.currency, pt.status, pt.created_at,
          pt.payment_method, u.email as user_email
        FROM payment_transactions pt
        LEFT JOIN users u ON pt.user_id = u.id
        ORDER BY pt.created_at DESC
      `;

      const [result] = await this.pool.execute(query);
      return result;
    } catch (error) {
      logger.error('Error in exportPayments:', error);
      return [];
    }
  }

  // Utility methods
  parseDateRange(range) {
    const now = new Date();
    let startDate, endDate;

    switch (range) {
      case '1d':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        endDate = now;
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        endDate = now;
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        endDate = now;
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        endDate = now;
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        endDate = now;
    }

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };
  }

  calculateNextGeneration(scheduleType, scheduleConfig) {
    const now = new Date();
    
    switch (scheduleType) {
      case 'daily':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      case 'weekly':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      case 'monthly':
        return new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
      default:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }
  }

  async logAdminActivity(adminId, action, resourceType, resourceId, details = null) {
    try {
      const query = `
        INSERT INTO admin_activity_logs (
          id, admin_user_id, action, resource_type, resource_id, details, ip_address, user_agent
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await this.pool.execute(query, [
        uuidv4(),
        adminId,
        action,
        resourceType,
        resourceId,
        details ? JSON.stringify(details) : null,
        '127.0.0.1', // In production, get from req.ip
        'Admin Panel' // In production, get from req.headers['user-agent']
      ]);
    } catch (error) {
      logger.error('Error logging admin activity:', error);
    }
  }
}

const controller = new ReportingController();

// Bind all methods to preserve 'this' context
const boundController = {
  generateReport: controller.generateReport.bind(controller),
  getScheduledReports: controller.getScheduledReports.bind(controller),
  createScheduledReport: controller.createScheduledReport.bind(controller),
  updateScheduledReport: controller.updateScheduledReport.bind(controller),
  deleteScheduledReport: controller.deleteScheduledReport.bind(controller),
  getAnalytics: controller.getAnalytics.bind(controller),
  exportData: controller.exportData.bind(controller)
};

module.exports = boundController; 