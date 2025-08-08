const { executeQuery } = require('../config/database');
const logger = require('../utils/logger');
const os = require('os');
const fs = require('fs').promises;
const path = require('path');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);
const metricsService = require('../services/metricsService');

class SystemMonitoringController {
  async getSystemHealth(req, res) {
    try {
      const startTime = Date.now();
      
      // Check database health
      const dbHealth = await this.checkDatabaseHealth();
      
      // Check API health
      const apiHealth = await this.checkAPIHealth();
      
      // Get system uptime
      const uptime = this.getSystemUptime();
      
      const overallStatus = this.determineOverallStatus([dbHealth.status, apiHealth.status]);
      
      const healthData = {
        overall_status: overallStatus,
        uptime: uptime,
        last_check: new Date().toISOString(),
        database: dbHealth,
        api: apiHealth,
        timestamp: new Date().toISOString()
      };

      res.json({
        success: true,
        data: healthData
      });
    } catch (error) {
      logger.error('Error getting system health:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get system health'
      });
    }
  }

  async getSystemMetrics(req, res) {
    try {
      const metrics = {
        cpu: await this.getCPUMetrics(),
        memory: await this.getMemoryMetrics(),
        disk: await this.getDiskMetrics(),
        users: await this.getUserMetrics(),
        api: await this.getAPIMetrics(),
        database: await this.getDatabaseMetrics(),
        timestamp: new Date().toISOString()
      };

      res.json({
        success: true,
        data: metrics
      });
    } catch (error) {
      logger.error('Error getting system metrics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get system metrics'
      });
    }
  }

  async getSystemLogs(req, res) {
    try {
      const { logLevel, service, search, dateRange = '24h' } = req.query;
      
      let whereConditions = [];
      let params = [];
      
      if (logLevel) {
        whereConditions.push('level = ?');
        params.push(logLevel);
      }
      
      if (service) {
        whereConditions.push('service = ?');
        params.push(service);
      }
      
      if (search) {
        whereConditions.push('(message LIKE ? OR service LIKE ?)');
        params.push(`%${search}%`, `%${search}%`);
      }
      
      // Add date range filter
      const dateFilter = this.getDateRangeFilter(dateRange);
      whereConditions.push('created_at >= ?');
      params.push(dateFilter);
      
      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
      
      const logs = await executeQuery(
        `SELECT * FROM system_logs ${whereClause} ORDER BY created_at DESC LIMIT 1000`,
        params
      );

      res.json({
        success: true,
        data: logs
      });
    } catch (error) {
      logger.error('Error getting system logs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get system logs'
      });
    }
  }

  async getAuditLogs(req, res) {
    try {
      const { action, search, dateRange = '24h' } = req.query;
      
      let whereConditions = [];
      let params = [];
      
      if (action) {
        whereConditions.push('action = ?');
        params.push(action);
      }
      
      if (search) {
        whereConditions.push('(entity_type LIKE ? OR details LIKE ? OR user_name LIKE ?)');
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }
      
      // Add date range filter
      const dateFilter = this.getDateRangeFilter(dateRange);
      whereConditions.push('created_at >= ?');
      params.push(dateFilter);
      
      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
      
      const auditLogs = await executeQuery(
        `SELECT 
          al.*,
          CONCAT(au.first_name, ' ', au.last_name) as user_name
        FROM admin_activity_logs al
        LEFT JOIN admin_users au ON al.admin_id = au.id
        ${whereClause} 
        ORDER BY al.created_at DESC 
        LIMIT 1000`,
        params
      );

      res.json({
        success: true,
        data: auditLogs
      });
    } catch (error) {
      logger.error('Error getting audit logs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get audit logs'
      });
    }
  }

  // Helper methods
  async checkDatabaseHealth() {
    try {
      const startTime = Date.now();
      await executeQuery('SELECT 1');
      const responseTime = Date.now() - startTime;
      
      // Get connection count
      const [connectionResult] = await executeQuery(
        'SHOW STATUS LIKE "Threads_connected"'
      );
      const connections = connectionResult ? parseInt(connectionResult.Value) : 0;
      
      return {
        status: 'healthy',
        response_time: responseTime,
        connections: connections,
        last_check: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Database health check failed:', error);
      return {
        status: 'error',
        response_time: null,
        connections: 0,
        last_check: new Date().toISOString(),
        error: error.message
      };
    }
  }

  async checkAPIHealth() {
    try {
      // Get real API metrics from metrics service
      const apiMetrics = metricsService.getAPIMetrics();
      
      // Determine status based on error rate and response time
      let status = 'healthy';
      if (apiMetrics.error_rate > 0.1) { // More than 10% errors
        status = 'critical';
      } else if (apiMetrics.error_rate > 0.05) { // More than 5% errors
        status = 'error';
      } else if (apiMetrics.avg_response_time > 2000) { // More than 2 seconds
        status = 'warning';
      }
      
      return {
        status: status,
        response_time: apiMetrics.avg_response_time,
        requests_per_minute: apiMetrics.requests_per_minute,
        error_rate: apiMetrics.error_rate,
        total_requests: apiMetrics.total_requests,
        last_check: new Date().toISOString()
      };
    } catch (error) {
      logger.error('API health check failed:', error);
      return {
        status: 'error',
        response_time: null,
        requests_per_minute: 0,
        error_rate: 1,
        last_check: new Date().toISOString(),
        error: error.message
      };
    }
  }

  getSystemUptime() {
    const uptime = os.uptime();
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }

  determineOverallStatus(statuses) {
    if (statuses.includes('critical')) return 'critical';
    if (statuses.includes('error')) return 'error';
    if (statuses.includes('warning')) return 'warning';
    return 'healthy';
  }

  async getCPUMetrics() {
    try {
      // Get CPU usage over a short interval for more accurate reading
      const startMeasure = this.getCPUTimes();
      
      // Wait 100ms for measurement
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const endMeasure = this.getCPUTimes();
      
      const idleDiff = endMeasure.idle - startMeasure.idle;
      const totalDiff = endMeasure.total - startMeasure.total;
      
      const usage = totalDiff > 0 ? 1 - (idleDiff / totalDiff) : 0;
      
      const cpus = os.cpus();
      
      // Store CPU metrics
      await metricsService.storeMetric('system', 'cpu_usage', usage, 'percentage');
      
      return {
        current: Math.max(0, Math.min(1, usage)), // Ensure between 0 and 1
        cores: cpus.length,
        model: cpus[0].model
      };
    } catch (error) {
      logger.error('Error getting CPU metrics:', error);
      return { current: 0, cores: 0, model: 'Unknown' };
    }
  }

  getCPUTimes() {
    const cpus = os.cpus();
    let idle = 0;
    let total = 0;
    
    cpus.forEach(cpu => {
      idle += cpu.times.idle;
      total += cpu.times.user + cpu.times.nice + cpu.times.sys + cpu.times.idle + cpu.times.irq;
    });
    
    return { idle, total };
  }

  async getMemoryMetrics() {
    try {
      const total = os.totalmem();
      const free = os.freemem();
      const used = total - free;
      const usagePercentage = (used / total) * 100;
      
      // Store memory metrics
      await metricsService.storeMetric('system', 'memory_total', total, 'bytes');
      await metricsService.storeMetric('system', 'memory_used', used, 'bytes');
      await metricsService.storeMetric('system', 'memory_usage_percentage', usagePercentage, 'percentage');
      
      return {
        total: total,
        used: used,
        free: free,
        usage_percentage: Math.round(usagePercentage)
      };
    } catch (error) {
      logger.error('Error getting memory metrics:', error);
      return { total: 0, used: 0, free: 0, usage_percentage: 0 };
    }
  }

  async getDiskMetrics() {
    try {
      let diskInfo;
      
      // Try to get real disk usage based on OS
      if (process.platform === 'win32') {
        // Windows
        const { stdout } = await exec('wmic logicaldisk get size,freespace,caption');
        const lines = stdout.trim().split('\n').slice(1);
        const diskLine = lines.find(line => line.includes('C:'));
        if (diskLine) {
          const parts = diskLine.trim().split(/\s+/);
          const freeSpace = parseInt(parts[1]) || 0;
          const totalSpace = parseInt(parts[2]) || 0;
          diskInfo = {
            total: totalSpace,
            free: freeSpace,
            used: totalSpace - freeSpace
          };
        }
      } else {
        // Unix-like systems (Linux, macOS)
        const { stdout } = await exec('df -k /');
        const lines = stdout.trim().split('\n');
        const diskLine = lines[1]; // First data line
        const parts = diskLine.split(/\s+/);
        
        diskInfo = {
          total: parseInt(parts[1]) * 1024, // Convert from KB to bytes
          used: parseInt(parts[2]) * 1024,
          free: parseInt(parts[3]) * 1024
        };
      }
      
      if (!diskInfo) {
        throw new Error('Could not parse disk information');
      }
      
      const usagePercentage = diskInfo.total > 0 ? (diskInfo.used / diskInfo.total) * 100 : 0;
      
      // Store metrics
      await metricsService.storeMetric('disk', 'total_space', diskInfo.total, 'bytes');
      await metricsService.storeMetric('disk', 'used_space', diskInfo.used, 'bytes');
      await metricsService.storeMetric('disk', 'usage_percentage', usagePercentage, 'percent');
      
      return {
        total: diskInfo.total,
        used: diskInfo.used,
        free: diskInfo.free,
        usage_percentage: Math.round(usagePercentage)
      };
    } catch (error) {
      logger.error('Error getting disk metrics:', error);
      // Fallback to basic filesystem stats
      try {
        const stats = await fs.stat(process.cwd());
        return {
          total: 0,
          used: 0,
          free: 0,
          usage_percentage: 0,
          error: 'Could not determine disk usage'
        };
      } catch (fallbackError) {
        return { total: 0, used: 0, free: 0, usage_percentage: 0 };
      }
    }
  }

  async getUserMetrics() {
    try {
      const [totalUsers] = await executeQuery('SELECT COUNT(*) as count FROM users WHERE is_deleted IS NULL');
      const [activeUsers] = await executeQuery(
        'SELECT COUNT(*) as count FROM users WHERE last_login_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR) AND is_deleted IS NULL'
      );
      const [newToday] = await executeQuery(
        'SELECT COUNT(*) as count FROM users WHERE DATE(created_at) = CURDATE() AND is_deleted IS NULL'
      );
      
      return {
        total: totalUsers.count,
        active: activeUsers.count,
        new_today: newToday.count
      };
    } catch (error) {
      logger.error('Error getting user metrics:', error);
      return { total: 0, active: 0, new_today: 0 };
    }
  }

  async getAPIMetrics() {
    try {
      // Get real API metrics from metrics service
      const metrics = metricsService.getAPIMetrics();
      
      // Store metrics for historical tracking
      await metricsService.storeMetric('api', 'requests_per_minute', metrics.requests_per_minute, 'count');
      await metricsService.storeMetric('api', 'avg_response_time', metrics.avg_response_time, 'ms');
      await metricsService.storeMetric('api', 'error_rate', metrics.error_rate, 'percentage');
      
      return metrics;
    } catch (error) {
      logger.error('Error getting API metrics:', error);
      return { requests_per_minute: 0, avg_response_time: 0, error_rate: 0 };
    }
  }

  async getDatabaseMetrics() {
    try {
      // Use the real database metrics from metrics service
      const metrics = await metricsService.getDatabaseMetrics();
      return metrics;
    } catch (error) {
      logger.error('Error getting database metrics:', error);
      return { queries_per_minute: 0, avg_query_time: 0, active_connections: 0 };
    }
  }

  getDateRangeFilter(dateRange) {
    const now = new Date();
    switch (dateRange) {
      case '1h':
        return new Date(now.getTime() - 60 * 60 * 1000);
      case '24h':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }
  }
}

module.exports = SystemMonitoringController;
