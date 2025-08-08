const { executeQuery } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

class AuditService {
  /**
   * Log admin activity
   */
  async logActivity(adminId, action, entityType, entityId, changes, req = null) {
    try {
      const id = uuidv4();
      const ipAddress = req?.ip || req?.connection?.remoteAddress || 'unknown';
      const userAgent = req?.headers?.['user-agent'] || 'unknown';

      await executeQuery(
        `INSERT INTO admin_activity_logs (
          id, admin_id, action, entity_type, entity_id, changes, ip_address, user_agent, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [
          id,
          adminId,
          action,
          entityType,
          entityId,
          JSON.stringify(changes),
          ipAddress,
          userAgent
        ]
      );

      logger.info(`Audit log created: ${action} on ${entityType} by admin ${adminId}`);
    } catch (error) {
      logger.error('Error logging admin activity:', error);
    }
  }

  /**
   * Log system setting changes
   */
  async logSettingChange(adminId, settingKey, oldValue, newValue, req = null) {
    await this.logActivity(
      adminId,
      'update',
      'system_setting',
      settingKey,
      {
        setting_key: settingKey,
        old_value: oldValue,
        new_value: newValue
      },
      req
    );
  }

  /**
   * Log user management actions
   */
  async logUserAction(adminId, action, userId, changes, req = null) {
    await this.logActivity(
      adminId,
      action,
      'user',
      userId,
      changes,
      req
    );
  }

  /**
   * Log ride management actions
   */
  async logRideAction(adminId, action, rideId, changes, req = null) {
    await this.logActivity(
      adminId,
      action,
      'ride',
      rideId,
      changes,
      req
    );
  }

  /**
   * Log admin management actions
   */
  async logAdminAction(adminId, action, targetAdminId, changes, req = null) {
    await this.logActivity(
      adminId,
      action,
      'admin_user',
      targetAdminId,
      changes,
      req
    );
  }

  /**
   * Log authentication events
   */
  async logAuthEvent(adminId, action, details, req = null) {
    await this.logActivity(
      adminId,
      action,
      'authentication',
      null,
      details,
      req
    );
  }

  /**
   * Log system events
   */
  async logSystemEvent(action, details, req = null) {
    try {
      const id = uuidv4();
      const ipAddress = req?.ip || req?.connection?.remoteAddress || 'system';
      const userAgent = req?.headers?.['user-agent'] || 'system';

      await executeQuery(
        `INSERT INTO admin_activity_logs (
          id, admin_id, action, entity_type, entity_id, changes, ip_address, user_agent, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [
          id,
          null, // No admin for system events
          action,
          'system',
          null,
          JSON.stringify(details),
          ipAddress,
          userAgent
        ]
      );

      logger.info(`System event logged: ${action}`);
    } catch (error) {
      logger.error('Error logging system event:', error);
    }
  }

  /**
   * Get audit logs with filtering
   */
  async getAuditLogs(filters = {}) {
    try {
      const {
        adminId,
        action,
        entityType,
        startDate,
        endDate,
        limit = 100,
        offset = 0
      } = filters;

      let whereConditions = [];
      let params = [];

      if (adminId) {
        whereConditions.push('al.admin_id = ?');
        params.push(adminId);
      }

      if (action) {
        whereConditions.push('al.action = ?');
        params.push(action);
      }

      if (entityType) {
        whereConditions.push('al.entity_type = ?');
        params.push(entityType);
      }

      if (startDate) {
        whereConditions.push('al.created_at >= ?');
        params.push(startDate);
      }

      if (endDate) {
        whereConditions.push('al.created_at <= ?');
        params.push(endDate);
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      const logs = await executeQuery(
        `SELECT 
          al.*,
          CONCAT(au.first_name, ' ', au.last_name) as admin_name,
          au.email as admin_email
        FROM admin_activity_logs al
        LEFT JOIN admin_users au ON al.admin_id = au.id
        ${whereClause}
        ORDER BY al.created_at DESC
        LIMIT ? OFFSET ?`,
        [...params, limit, offset]
      );

      return logs;
    } catch (error) {
      logger.error('Error getting audit logs:', error);
      throw error;
    }
  }

  /**
   * Get audit log statistics
   */
  async getAuditStats(filters = {}) {
    try {
      const { startDate, endDate } = filters;

      let whereConditions = [];
      let params = [];

      if (startDate) {
        whereConditions.push('created_at >= ?');
        params.push(startDate);
      }

      if (endDate) {
        whereConditions.push('created_at <= ?');
        params.push(endDate);
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      const [actionStats] = await executeQuery(
        `SELECT 
          action,
          COUNT(*) as count
        FROM admin_activity_logs
        ${whereClause}
        GROUP BY action
        ORDER BY count DESC`,
        params
      );

      const [entityStats] = await executeQuery(
        `SELECT 
          entity_type,
          COUNT(*) as count
        FROM admin_activity_logs
        ${whereClause}
        GROUP BY entity_type
        ORDER BY count DESC`,
        params
      );

      const [adminStats] = await executeQuery(
        `SELECT 
          al.admin_id,
          CONCAT(au.first_name, ' ', au.last_name) as admin_name,
          COUNT(*) as count
        FROM admin_activity_logs al
        LEFT JOIN admin_users au ON al.admin_id = au.id
        ${whereClause}
        GROUP BY al.admin_id, admin_name
        ORDER BY count DESC
        LIMIT 10`,
        params
      );

      return {
        actionStats,
        entityStats,
        adminStats
      };
    } catch (error) {
      logger.error('Error getting audit stats:', error);
      throw error;
    }
  }

  /**
   * Clean up old audit logs
   */
  async cleanupOldLogs(retentionDays = 90) {
    try {
      const result = await executeQuery(
        'DELETE FROM admin_activity_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)',
        [retentionDays]
      );

      logger.info(`Cleaned up ${result.affectedRows} old audit logs`);
      return result.affectedRows;
    } catch (error) {
      logger.error('Error cleaning up old audit logs:', error);
      throw error;
    }
  }

  /**
   * Export audit logs
   */
  async exportAuditLogs(filters = {}) {
    try {
      const logs = await this.getAuditLogs({ ...filters, limit: 10000 });
      
      return logs.map(log => ({
        timestamp: log.created_at,
        admin: log.admin_name || 'System',
        action: log.action,
        entity_type: log.entity_type,
        entity_id: log.entity_id,
        changes: log.changes,
        ip_address: log.ip_address
      }));
    } catch (error) {
      logger.error('Error exporting audit logs:', error);
      throw error;
    }
  }
}

module.exports = new AuditService();
