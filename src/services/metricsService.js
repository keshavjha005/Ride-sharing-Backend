const { executeQuery } = require('../config/database');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

class MetricsService {
  constructor() {
    this.apiMetrics = {
      requests: 0,
      totalResponseTime: 0,
      errors: 0,
      requestsPerMinute: [],
      startTime: Date.now()
    };
    
    // Reset metrics every minute
    setInterval(() => {
      this.resetMinuteMetrics();
    }, 60000);
  }

  // Track API request
  trackRequest(responseTime, isError = false) {
    this.apiMetrics.requests++;
    this.apiMetrics.totalResponseTime += responseTime;
    
    if (isError) {
      this.apiMetrics.errors++;
    }
  }

  // Get current API metrics
  getAPIMetrics() {
    const currentMinute = Math.floor(Date.now() / 60000);
    const requestsThisMinute = this.apiMetrics.requestsPerMinute.filter(
      entry => entry.minute === currentMinute
    ).reduce((sum, entry) => sum + entry.count, 0);

    return {
      requests_per_minute: requestsThisMinute,
      avg_response_time: this.apiMetrics.requests > 0 
        ? Math.round(this.apiMetrics.totalResponseTime / this.apiMetrics.requests)
        : 0,
      error_rate: this.apiMetrics.requests > 0 
        ? this.apiMetrics.errors / this.apiMetrics.requests
        : 0,
      total_requests: this.apiMetrics.requests
    };
  }

  // Reset minute-based metrics
  resetMinuteMetrics() {
    const currentMinute = Math.floor(Date.now() / 60000);
    const requestsThisMinute = this.apiMetrics.requests;
    
    this.apiMetrics.requestsPerMinute.push({
      minute: currentMinute,
      count: requestsThisMinute
    });

    // Keep only last 60 minutes
    this.apiMetrics.requestsPerMinute = this.apiMetrics.requestsPerMinute
      .filter(entry => entry.minute > currentMinute - 60);

    // Reset counters
    this.apiMetrics.requests = 0;
    this.apiMetrics.totalResponseTime = 0;
    this.apiMetrics.errors = 0;
  }

  // Log system event
  async logSystemEvent(level, service, message, metadata = {}) {
    try {
      await executeQuery(
        `INSERT INTO system_logs (id, level, service, message, metadata, created_at) 
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [uuidv4(), level, service, message, JSON.stringify(metadata)]
      );
    } catch (error) {
      logger.error('Failed to log system event:', error);
    }
  }

  // Store system metric
  async storeMetric(metricType, metricName, value, unit = null, metadata = {}) {
    try {
      await executeQuery(
        `INSERT INTO system_metrics (id, metric_type, metric_name, metric_value, unit, metadata, created_at)
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [uuidv4(), metricType, metricName, value, unit, JSON.stringify(metadata)]
      );
    } catch (error) {
      logger.error('Failed to store metric:', error);
    }
  }

  // Get database performance metrics
  async getDatabaseMetrics() {
    try {
      const startTime = Date.now();
      await executeQuery('SELECT 1');
      const queryTime = Date.now() - startTime;

      // Get actual database statistics
      const [connectionResult] = await executeQuery('SHOW STATUS LIKE "Threads_connected"');
      const [queryCountResult] = await executeQuery('SHOW STATUS LIKE "Queries"');
      const [uptimeResult] = await executeQuery('SHOW STATUS LIKE "Uptime"');
      
      const activeConnections = connectionResult ? parseInt(connectionResult.Value) : 0;
      const totalQueries = queryCountResult ? parseInt(queryCountResult.Value) : 0;
      const uptime = uptimeResult ? parseInt(uptimeResult.Value) : 0;
      
      // Calculate queries per minute based on uptime
      const queriesPerMinute = uptime > 0 ? Math.round((totalQueries / uptime) * 60) : 0;

      // Store metrics
      await this.storeMetric('database', 'query_time', queryTime, 'ms');
      await this.storeMetric('database', 'active_connections', activeConnections, 'count');
      await this.storeMetric('database', 'queries_per_minute', queriesPerMinute, 'count');

      return {
        queries_per_minute: queriesPerMinute,
        avg_query_time: queryTime,
        active_connections: activeConnections,
        total_queries: totalQueries,
        uptime_seconds: uptime
      };
    } catch (error) {
      logger.error('Error getting database metrics:', error);
      return { queries_per_minute: 0, avg_query_time: 0, active_connections: 0 };
    }
  }
}

// Export singleton instance
module.exports = new MetricsService();
